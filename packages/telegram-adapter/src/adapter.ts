import {
  type AdapterInterface,
  type BaseChatroomInfo,
  type Container,
  ContainerType,
  type CoreApi,
  CreateContainerOptions,
  Logger,
  type Menu,
  SendMessage,
  StoredRoute,
} from "@rx-lab/common";
import TelegramBot from "node-telegram-bot-api";
import { CallbackParser, CallbackType, DecodeType } from "./callbackParser";
import { renderElement } from "./renderer";
import { DEFAULT_ROOT_PATH, RenderedElement, START_COMMAND } from "./types";
import { convertRouteToTGRoute, convertTGRouteToRoute } from "./utils";

export type TelegramAppOpts =
  | {
      token: string;
      /**
       * Url for telegram api
       */
      url?: string;
    }
  | {
      token: string;
      longPolling: boolean;
      /**
       * base telegram url for the bot
       */
      url?: string;
    };

export interface TGChatroomInfo extends BaseChatroomInfo {}

export interface TGMessage extends TelegramBot.Update {
  id: string | number;
  text?: string;
  data?: Record<string, any>;
}

export interface TGContainer extends Container<TGChatroomInfo, TGMessage> {}

interface InternalTGContainer extends TGContainer {
  // internal field used to store the message id for updating the message
  updateMessageId?: number;
  decodedData: DecodeType;
}

export class TelegramAdapter
  implements
    AdapterInterface<
      TGContainer,
      RenderedElement[] | RenderedElement,
      TelegramBot.Message
    >
{
  bot: TelegramBot;
  private readonly callbackParser = new CallbackParser();
  private coreApi: CoreApi<TGContainer>;

  constructor(private readonly opts: TelegramAppOpts) {
    const supportLongPolling = "longPolling" in opts ? opts.longPolling : false;
    this.bot = new TelegramBot(opts.token, {
      polling: supportLongPolling,
      baseApiUrl: opts.url,
    });
  }

  // TODO: Only works when user send a message to the bot
  //  Need to handle the case that when user click on the button, message is updated
  async init(api: CoreApi<TGContainer>): Promise<void> {
    this.coreApi = api;

    //FIXME: If user click on the button multiple times at the same time,
    // the message only updated once and throw an error
    this.bot.on("callback_query", async (query) => {
      Logger.log("Get callback query", "red");
      const data = query.data!;
      const container: InternalTGContainer = {
        type: "ROOT",
        children: [],
        chatroomInfo: {
          id: query.message?.chat.id as number,
          messageId: query.message?.message_id,
          userId: query.from.id,
        },
        // sometimes, tg api will send a bot message back, we need to ignore it
        message: query.message?.from?.is_bot
          ? {
              ...query.message,
              text: undefined,
            }
          : (query.message as any),
        hasUpdated: false,
        updateMessageId: query.message?.message_id,
        //@ts-ignore
        id: new Date().getTime(),
      };

      const decodedData = this.callbackParser.decode(data);
      // Put data into the container so that we can process it later
      // should not use component directly inside the closure because it is outdated
      // in some situation. For example, when user click component A, then click component B,
      // the closure will use component A twice instead of component A and B.
      container.decodedData = decodedData;
      const [callbackType] = decodedData;
      if (callbackType === CallbackType.onClick) {
        // find the route and redirect to the route
        const routeFromCallback = await api.restoreRoute(
          this.getRouteKey(container),
        );
        if (routeFromCallback)
          await api.redirectTo(container, routeFromCallback, {
            shouldRender: true,
            shouldAddToHistory: false,
            shouldRenderWithOldProps: true,
          });
      }

      // in order for old message to be updated
      // we need to render the app with the old message.
      // And if the message is on different route,
      // we need to render the app with the new route as well.
      await api.renderApp(container, async (container: InternalTGContainer) => {
        const [callbackType, component] = container.decodedData ?? [];
        if (container.hasUpdated || container.hasUpdated === undefined) {
          return;
        }

        if (container.children[0].props.shouldSuspend) {
          return;
        }

        // handle command button
        // if the component is a string, it means that it is a route,
        // so we need to redirect to the route
        if (callbackType === CallbackType.onCommand) {
          const route = await this.decodeRoute({
            route: component.route,
          });
          if (!route) {
            Logger.log(`Invalid route: ${component.route}`, "red");
            return;
          }
          Logger.log(`Redirecting to ${route}`, "blue");
          container.hasUpdated = true;
          // if component is set to render new message
          // we need to reset the updateMessageId
          if (component.new) {
            container.updateMessageId = undefined;
          }

          try {
            await api.redirectTo(container, route, {
              shouldRender: true,
              shouldAddToHistory: true,
            });
          } catch (err: any) {
            Logger.log(`Error redirecting to ${route}: ${err.message}`, "red");
          }
          return;
        }

        // find the route based on the key
        const componentKey = component?.id;
        const componentToRender = this.callbackParser.findComponentByKey(
          componentKey,
          container.children,
        );
        if (componentToRender) {
          componentToRender?.props.onClick?.();
          container.hasUpdated = true;
          Logger.log("Callback query", "blue");
        } else {
          Logger.log(`Component with key ${componentKey} not found`, "red");
        }
      });
    });
  }

  async componentOnMount(container: InternalTGContainer): Promise<void> {}

  async adapt(
    container: InternalTGContainer,
    isUpdate: boolean,
  ): Promise<RenderedElement[]> {
    if (!isUpdate) this.bot.processUpdate(container.message);

    // if hasUpdated is set to false, it means that the message is not updated,
    // so we don't need to send any message
    if (container.hasUpdated !== undefined && !container.hasUpdated) {
      return [];
    }

    // if no children in the container
    // don't send any message
    if (container.children.length === 0) {
      return [];
    }

    if (container.message?.callback_query) {
      return [];
    }

    const message = renderElement(
      container.children[0] as any,
      this.callbackParser,
    );
    if (Array.isArray(message) && message.length === 0) {
      return [];
    }

    Logger.log(
      `IsSuspense: ${container.children[0].props.shouldSuspend}`,
      "red",
    );
    const chatRoomId = container.chatroomInfo.id;

    Logger.log(`Sending message`, "blue");
    try {
      if (isUpdate && container.updateMessageId) {
        await this.bot.editMessageText(message.text, {
          parse_mode: "HTML",
          reply_markup: message.reply_markup as any,
          chat_id: chatRoomId,
          message_id: container.updateMessageId as number,
        });
      } else {
        await this.bot.sendMessage(chatRoomId, message.text, {
          reply_markup: message.reply_markup as any,
          parse_mode: "HTML",
        });
      }

      return message as any;
    } catch (err: any) {
      Logger.log(`Error sending message: ${err.message}`);
      return [];
    }
  }

  async setMenus(menus: Menu[]): Promise<void> {
    const commands: TelegramBot.BotCommand[] = menus
      .flatMap((menu) => {
        const subCommands = this.getSubCommands(menu);
        return [
          {
            command: convertRouteToTGRoute(menu.href),
            description: menu.description ?? "",
          },
          ...subCommands,
        ];
      })
      .filter((m) => m.command !== DEFAULT_ROOT_PATH);

    await this.bot.setMyCommands(commands);
  }

  private getSubCommands(menu: Menu): TelegramBot.BotCommand[] {
    return (
      menu.children?.flatMap((child) => {
        const subCommands = this.getSubCommands(child);
        return [
          {
            command: convertRouteToTGRoute(child.href),
            description: child.description ?? "",
          },
          ...subCommands,
        ];
      }) ?? []
    );
  }

  async getCurrentRoute(
    message: TelegramBot.Message,
  ): Promise<string | undefined> {
    if (!message.entities) {
      return;
    }

    for (const entity of message.entities) {
      if (entity.type === "bot_command") {
        const command = message.text?.slice(entity.offset, entity.length);
        if (command === START_COMMAND) {
          return DEFAULT_ROOT_PATH;
        }
        return command;
      }
    }

    return undefined;
  }

  async decodeRoute(
    route: StoredRoute | TelegramBot.Message,
  ): Promise<StoredRoute | undefined> {
    if (typeof route === "object") {
      if ("route" in route) {
        return {
          route: convertTGRouteToRoute(route),
          props: route.props,
        };
      }

      const currentRoute = await this.getCurrentRoute(route);
      if (currentRoute) {
        return {
          route: await this.getCurrentRoute(route),
        };
      }
    }

    return undefined;
  }

  getRouteKey(message: TGContainer): string {
    return `${message.chatroomInfo.id}`;
  }

  async onDestroy(): Promise<void> {
    if ("longPolling" in this.opts && this.opts.longPolling) {
      await this.bot.stopPolling({
        cancel: true,
      });
      await this.bot.close();
    }
  }

  createContainer(
    message: TelegramBot.Message,
    options: CreateContainerOptions,
  ): TGContainer {
    // only process message from user
    // this prevents the bot from processing message from itself
    const messageText = message.text;
    const container: InternalTGContainer = {
      decodedData: undefined,
      type: "ROOT",
      children: [],
      chatroomInfo: {
        id: message.chat?.id as number,
        messageId: message.message_id,
        userId: message.from?.id,
      },
      message: {
        ...message,
        id: message.message_id,
        text: messageText,
      } as any,
    };

    if (!options.renderNewMessage) {
      container.updateMessageId = message.message_id;
    }

    return container;
  }

  subscribeToMessageChanged(
    callback: (
      container: TGContainer,
      message: TelegramBot.Message,
    ) => Promise<void>,
  ) {
    this.bot.on("message", (message) => {
      if (message.web_app_data !== undefined) {
        return;
      }
      const container = this.createContainer(message, {
        renderNewMessage: true,
      });
      return callback(container, message);
    });
  }

  async handleMessageUpdate(message: TelegramBot.Message) {
    this.bot.processUpdate(message as any);
  }

  async handleSendMessage(message: SendMessage) {
    // create a container
    const container: InternalTGContainer = {
      chatroomInfo: {
        id: message.to,
        userId: message.to,
      },
      children: [],
      decodedData: undefined,
      hasUpdated: true,
      message: {
        id: "",
        update_id: 0,
        text: message.text,
        data: message.data,
      },
      type: ContainerType.ROOT,
      updateMessageId: 0,
    };

    await this.coreApi.redirectTo(
      container,
      { route: message.path },
      {
        shouldRender: true,
        shouldAddToHistory: false,
        keepTextMessage: true,
      },
    );
  }
}
