import {
  type AdapterInterface,
  Attachment,
  AttachmentType,
  type BaseChatroomInfo,
  type Container,
  ContainerType,
  type CoreApi,
  CreateContainerOptions,
  GetRouteKeyLevel,
  Logger,
  type Menu,
  SendMessage,
  StoredRoute,
} from "@rx-lab/common";
import { AuthorizationError, SkipError } from "@rx-lab/errors";
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

function parseQueryString(queryString: string) {
  const urlParams = new URLSearchParams(queryString);
  const entries = urlParams.entries();
  const result: Record<string, string> = {};
  for (const [key, value] of entries) {
    result[key] = value;
  }
  return result;
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
        container.hasUpdated = true;
        // handle command button
        // if the component is a string, it means that it is a route,
        // so we need to redirect to the route
        if (callbackType === CallbackType.onCommand) {
          const route = await this.decodeRoute({
            route: component.route,
            type: "page",
          });
          if (!route) {
            Logger.log(`Invalid route: ${component.route}`, "red");
            return;
          }
          Logger.log(`Redirecting to ${route}`, "blue");
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
          try {
            Logger.log("Calling Callback query", "blue");
            await componentToRender?.props.onClick?.();
            Logger.log("Callback query has been called", "blue");
          } catch (e) {
            // redirect to error page
            Logger.log(`Error processing callback query: ${e.message}`, "red");
            // send error message instead of updating the message
            container.updateMessageId = undefined;
            await this.coreApi.redirectTo(
              container,
              {
                type: "error",
                error: e,
              },
              {
                shouldRender: true,
                shouldAddToHistory: false,
              },
            );
          }
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
  ): Promise<Container<any, any> | undefined> {
    if (!isUpdate) this.bot.processUpdate(container.message);

    // if hasUpdated is set to false, it means that the message is not updated,
    // so we don't need to send any message
    Logger.log(`Message is updated:${container.hasUpdated}`, "bgBlue");
    if (container.hasUpdated !== undefined && !container.hasUpdated) {
      Logger.log(`Message is not updated`);
      return undefined;
    }

    // if no children in the container
    // don't send any message
    if (container.children.length === 0) {
      Logger.log(`No children in the container`);
      return undefined;
    }

    if (container.message?.callback_query) {
      return undefined;
    }

    const message = renderElement(
      container.children[0] as any,
      this.callbackParser,
    );
    if (Array.isArray(message) && message.length === 0) {
      return undefined;
    }
    const chatRoomId = container.chatroomInfo.id;

    Logger.log(`Sending message`, "bgBlue");
    try {
      if (isUpdate && container.updateMessageId) {
        await this.bot.editMessageText(message.text, {
          parse_mode: "HTML",
          reply_markup: message.reply_markup as any,
          chat_id: chatRoomId,
          message_id: container.updateMessageId as number,
        });
        container.hasUpdated = false;
      } else {
        const sentMessage = await this.bot.sendMessage(
          chatRoomId,
          message.text,
          {
            reply_markup: message.reply_markup as any,
            parse_mode: "HTML",
          },
        );
        return {
          ...container,
          hasUpdated: false,
          chatroomInfo: {
            ...container.chatroomInfo,
            messageId: sentMessage.message_id,
          },
          message: {
            ...container.message,
            id: sentMessage.message_id,
          },
        };
      }
      return undefined;
    } catch (err: any) {
      Logger.log(`Error sending message: ${err.message}`);
      return undefined;
    }
  }

  async setMenus(menus: Menu[]): Promise<void> {
    const commands: TelegramBot.BotCommand[] = menus
      .flatMap((menu) => {
        const subCommands = this.getSubCommands(menu);
        return [
          {
            command: this.convertRootPathToCommand(
              convertRouteToTGRoute(menu.href),
            ),
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
            command: this.convertRootPathToCommand(
              convertRouteToTGRoute(child.href),
            ),
            description: child.description ?? "",
          },
          ...subCommands,
        ];
      }) ?? []
    );
  }

  /**
   * Convert the root path `/` to the command `/start`
   * @param route
   * @private
   */
  private convertRootPathToCommand(route: string): string {
    if (route === DEFAULT_ROOT_PATH) {
      return START_COMMAND;
    }

    return route;
  }

  async getCurrentRoute(message: TelegramBot.Message): Promise<
    | {
        route: string;
        query?: Record<string, string>;
      }
    | undefined
  > {
    if (!message.entities) {
      return;
    }

    for (const entity of message.entities) {
      if (entity.type === "bot_command") {
        // if in the private chat, the command looks like /start
        // but in the group chat, the command looks like /start@bot_name
        let command = message.text?.slice(entity.offset, entity.length);
        command = command?.split("@")[0];

        if (command === START_COMMAND) {
          const query = message.text?.split(" ")[1];
          const decodedQuery = parseQueryString(query ?? "");
          return {
            route: DEFAULT_ROOT_PATH,
            query: decodedQuery as Record<string, string>,
          };
        }
        return {
          route: command,
        };
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
          type: route.type,
        };
      }

      const currentRoute = await this.getCurrentRoute(route);
      if (currentRoute) {
        return {
          route: currentRoute.route,
          type: "page",
          props: currentRoute.query
            ? ({ searchQuery: currentRoute.query } as any)
            : undefined,
        };
      }
    }

    return undefined;
  }

  getRouteKey(
    message: InternalTGContainer,
    level: GetRouteKeyLevel = "auto",
  ): string {
    const messageKey = `${message.message.id ?? (message.message as any).message_id}`;
    const globalKey = `chatroom-${message.chatroomInfo.id}`;
    if (level === "message") {
      return messageKey;
    }

    if (level === "chatroom") {
      return globalKey;
    }

    // if the message is updated, use the message id as the key
    if (message.updateMessageId) {
      return messageKey;
    }

    // when rendering new message, use the chatroom id as the key
    // so that we can send a new message without
    return globalKey;
  }

  async onDestroy(): Promise<void> {
    if ("longPolling" in this.opts && this.opts.longPolling) {
      await this.bot.stopPolling({
        cancel: true,
      });
      await this.bot.close();
    }
  }

  async createContainer(
    message: TelegramBot.Message,
    options: CreateContainerOptions,
  ): Promise<TGContainer> {
    // get attachments from the message
    const attachments: Attachment[] = [];

    if (message.media_group_id) {
      await this.bot.sendMessage(
        message.chat.id,
        "Media group is not supported yet",
      );
      throw new SkipError();
    }

    // TODO: Handle media group in the future
    if (message.photo) {
      const photo = message.photo[message.photo.length - 1];
      const file = await this.bot.getFile(photo.file_id);
      attachments.push({
        type: AttachmentType.Image,
        url: `https://api.telegram.org/file/bot${this.opts.token}/${file.file_path}`,
      });
    }

    if (message.sticker) {
      attachments.push({
        type: AttachmentType.Sticker,
        url: message.sticker.file_id,
      });
    }

    if (message.location) {
      attachments.push({
        type: AttachmentType.Location,
        data: {
          latitude: message.location.latitude,
          longitude: message.location.longitude,
        },
      });
    }

    if (message.contact) {
      attachments.push({
        type: AttachmentType.Contact,
        data: {
          name: message.contact.first_name,
          phoneNumber: message.contact.phone_number,
        },
      });
    }

    if (message.poll) {
      attachments.push({
        type: AttachmentType.Poll,
        data: {
          question: message.poll.question,
          options: message.poll.options.map((option) => ({
            text: option.text,
            votes: option.voter_count,
          })),
        },
      });
    }

    if (message.voice) {
      attachments.push({
        type: AttachmentType.Voice,
        url: message.voice.file_id,
        duration: message.voice.duration,
      });
    }

    if (message.document) {
      attachments.push({
        type: AttachmentType.File,
        url: message.document.file_id,
        size: message.document.file_size,
        mimeType: message.document.mime_type,
      });
    }

    if (message.audio) {
      attachments.push({
        type: AttachmentType.File,
        url: message.audio.file_id,
        size: message.audio.file_size,
        mimeType: message.audio.mime_type,
      });
    }

    if (message.video) {
      attachments.push({
        type: AttachmentType.File,
        url: message.video.file_id,
        size: message.video.file_size,
        mimeType: message.video.mime_type,
      });
    }

    // only process message from user
    // this prevents the bot from processing message from itself
    const messageText = message.text;
    const container: InternalTGContainer = {
      decodedData: undefined,
      type: "ROOT",
      children: [],
      isInGroup: message.chat.type !== "private",
      groupId: message.chat.id.toString(),
      hasBeenMentioned: message.entities?.some(
        (entity) => entity.type === "mention",
      ),
      attachments: attachments,
      chatroomInfo: {
        id: message.chat?.id as number,
        messageId: message.message_id,
        // if options defined userId, use it, otherwise use the message.from.id
        // when redirecting, the default user id is from bot not from the user
        userId:
          options.userId !== undefined ? options.userId : message.from?.id,
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
    this.bot.on("message", async (message) => {
      if (message.web_app_data !== undefined) {
        return;
      }
      try {
        const container = this.createContainer(message, {
          renderNewMessage: true,
        });
        return callback(await container, message);
      } catch (e) {
        if (e instanceof SkipError) {
          return;
        }
        throw e;
      }
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
      isInGroup: message.isInGroup,
      groupId: message.isInGroup ? message.to : undefined,
      hasBeenMentioned: false,
      attachments: [],
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
      { route: message.path, type: "page" },
      {
        shouldRender: true,
        shouldAddToHistory: false,
        keepTextMessage: true,
      },
    );
  }

  async authorize(request: any): Promise<void> {
    const secretToken = process.env.TELEGRAM_SECRET_TOKEN;
    const requestToken = request.headers["x-telegram-bot-api-secret-token"];

    if (secretToken && requestToken !== secretToken) {
      throw new AuthorizationError(
        "Authorization failed: Invalid secret token",
      );
    }
  }
}
