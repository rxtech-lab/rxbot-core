import {
  type AdapterInterface,
  BaseChatroomInfo,
  BaseMessage,
  type Container,
  CoreApi,
  CoreInterface,
  DEFAULT_ROOT_ROUTE,
  ErrorPageProps,
  PageProps,
  RedirectOptions,
  ReloadOptions,
  RenderedComponent,
  RouteInfoFile,
  SendMessage,
  StorageInterface,
  StoredRoute,
} from "@rx-lab/common";
import { RedirectError } from "@rx-lab/errors";
import React from "react";
import { Renderer } from "./renderer";
import { renderServerComponent } from "./server/renderServerComponent";
import { createEmptyFiberRoot } from "./utils";
import { WrappedElement } from "./wrappedElement";

type StartOptions = {
  timeout?: number;
  adapter: AdapterInterface<any, any, any>;
  storage: StorageInterface;
  routeFile: RouteInfoFile;
};

interface CoreOptions {
  adapter: AdapterInterface<any, any, any>;
  storage: StorageInterface;
  timeout?: number;
  routeFile: RouteInfoFile;
}

const DEFAULT_TIMEOUT = 2000;

function checkIsOptionsValid(opts: StartOptions) {
  if (!opts.adapter) {
    throw new Error("Adapter is required");
  }

  if (!opts.storage) {
    throw new Error("Storage is required");
  }

  if (!opts.routeFile) {
    throw new Error("Route file is required");
  }
}

export class Core<T extends Container<BaseChatroomInfo, BaseMessage>>
  extends Renderer<T>
  implements CoreInterface<any>
{
  private element: RenderedComponent | undefined;
  /**
   * Debounce timeout for commit updates.
   */
  private readonly timeout: number;

  private container: T | undefined;
  /**
   * Previous rendered page props.
   * @private
   */
  private renderedPageProps: PageProps | undefined;

  constructor({ adapter, storage, timeout }: CoreOptions) {
    super({ adapter, storage });
    this.timeout = timeout ?? DEFAULT_TIMEOUT;
  }

  /**
   * Start the core in production mode.
   * @param opts
   * @constructor
   */
  static async Start(opts: StartOptions) {
    checkIsOptionsValid(opts);
    const core = new Core({
      adapter: opts.adapter,
      storage: opts.storage,
      timeout: opts.timeout,
      routeFile: opts.routeFile,
    });

    await core.router.initFromRoutes(opts.routeFile, false);
    await core.init();
    return core;
  }

  /**
   * Update the menu without initializing the core.
   * @param opts
   * @constructor
   */
  static async UpdateMenu(opts: StartOptions) {
    checkIsOptionsValid(opts);
    const core = new Core({
      adapter: opts.adapter,
      storage: opts.storage,
      timeout: opts.timeout,
      routeFile: opts.routeFile,
    });

    await core.router.initFromRoutes(opts.routeFile, true);
  }

  /**
   * Start the core in development mode.
   * This enables hot reloading of the routes and updates the menu.
   * @param opts
   * @constructor
   */
  static async Dev(opts: StartOptions) {
    checkIsOptionsValid(opts);
    const core = new Core({
      adapter: opts.adapter,
      storage: opts.storage,
      timeout: opts.timeout,
      routeFile: opts.routeFile,
    });

    await core.router.initFromRoutes(opts.routeFile, true);
    await core.init();
    return core;
  }

  /**
   * The core API that provides the necessary methods to render the app.
   */
  private get coreApi(): CoreApi<T> {
    return {
      renderApp: async (container, callback) => {
        this.listeners.set(this.adapter, callback);
        const key = this.adapter.getRouteKey(container);
        const storedRoute = await this.storage.restoreRoute(key);
        // if user click on a bot message, the message text itself will be erased.
        // we need to restore the text from the stored route from user.
        if (
          container.message?.text === undefined &&
          storedRoute?.props?.text !== undefined &&
          container.message !== undefined
        ) {
          container.message.text = storedRoute.props.text;
        }
        return this.render(container, storedRoute?.props);
      },
      restoreRoute: async (key) => {
        return await this.router.getRouteFromKey(key);
      },
      redirectTo: async (container, path, options) => {
        await this.redirect(container, path, options);
        return container;
      },
      redirectToWithMessage: async (message, path, options) => {
        const container = this.adapter.createContainer(message, {
          renderNewMessage: true,
        });
        await this.redirect(container, { route: path }, options);
        return container;
      },
      reload: async (message: BaseMessage, options: ReloadOptions) => {
        const container = this.adapter.createContainer(message, {
          renderNewMessage: options.shouldRenderNewMessage ?? false,
        });
        // get the current route
        const key = this.adapter.getRouteKey(container);
        const storedRoute = await this.storage.restoreRoute(key);
        if (storedRoute) {
          await this.redirect(container, storedRoute, {
            shouldRender: true,
            shouldAddToHistory: true,
            shouldRenderWithOldProps: true,
          });
        } else {
          // reload root route
          await this.redirect(
            container,
            {
              route: DEFAULT_ROOT_ROUTE,
            },
            {
              shouldRender: true,
              shouldAddToHistory: true,
              shouldRenderWithOldProps: true,
            },
          );
        }
      },
    };
  }

  /**
   * Initialize the renderer.
   */
  async init() {
    // initialize the adapter
    await this.adapter.init(this.coreApi);
    this.adapter.subscribeToMessageChanged(async (container, message) => {
      try {
        await this.redirect(container, message, {
          shouldRender: true,
          shouldAddToHistory: true,
        });
      } catch (e) {
        console.error(e);
      }
    });
    await this.loadAndRenderStoredRoute("/");
  }

  async handleMessageUpdate(message: BaseMessage) {
    await this.adapter.handleMessageUpdate(message);
    this.updateLastCommitUpdateTime();
    return new Promise<void>((resolve) => {
      const checkCommitUpdates = () => {
        const currentTime = Date.now();
        if (currentTime - this.lastCommitUpdateTime >= this.timeout) {
          resolve();
        } else {
          setTimeout(checkCommitUpdates, 100); // Check every 100ms
        }
      };

      this.handleMessageUpdateResolver = resolve;
      checkCommitUpdates();
    });
  }

  async redirect(container: T, routeOrObject: any, options?: RedirectOptions) {
    const key = this.adapter.getRouteKey(container);
    let route = await this.adapter.decodeRoute(routeOrObject);
    if (route) {
      if (container.message && options?.keepTextMessage !== true)
        container.message.text = undefined;
    } else {
      route = await this.storage.restoreRoute(key);
    }

    let component: RenderedComponent | undefined;
    if (options?.shouldRender) {
      component = await this.loadAndRenderStoredRoute(key, route);
      try {
        await this.render(
          container,
          options.shouldRenderWithOldProps ? route?.props : undefined,
        );
        // Store the route with page props only if the component is not an error page or a redirect page.
        // Important: Do not store the route if the page is redirecting, as redirected pages already have a stored route.
        if (component?.isError !== true) {
          if (options.shouldAddToHistory) {
            await this.storage.saveRoute(key, {
              route: route?.route ?? DEFAULT_ROOT_ROUTE,
              props: this.renderedPageProps,
            });
          }

          if (options?.shouldAddToHistory && route) {
            await this.storage.addHistory(key, {
              route: route.route,
              props: this.renderedPageProps,
            });
          }
        }
      } catch (e: any) {
        if (e instanceof RedirectError) {
          // if a redirect error is thrown
          // ignore it
          return;
        }
        console.error(e);
        const props: ErrorPageProps = {
          error: e,
          code: 500,
        };
        const errorComponent = await this.router.renderSpecialRoute(
          route?.route,
          "error",
          {},
          props,
        );
        await this.setComponent(errorComponent);
        await this.render(container);
        component.isError = true;
      }
    }
  }

  async loadAndRenderStoredRoute(key: string, defaultRoute?: StoredRoute) {
    const component = await this.router.render(
      key,
      defaultRoute ?? {
        route: DEFAULT_ROOT_ROUTE,
      },
    );
    await this.setComponent(component);
    return component;
  }

  /**
   * Set the component to render.
   * @param component Must be a valid client component.
   */
  private async setComponent(component: RenderedComponent) {
    this.element = component;
  }

  /**
   * Helper function to render the app asynchronously.
   * @param container The container to render the app in
   * @param oldProps The old props of the container saved in the storage
   * @private
   */
  async render(container: T, oldProps?: PageProps) {
    if (!this.element) {
      throw new Error("No component to render");
    }

    if (!container._rootContainer) {
      createEmptyFiberRoot(container, this.reconciler);
    }
    this.container = container;

    // wrap the element with the router and storage providers so that
    // the components can access the router and storage
    const Component = this.element.component;

    /**
     * Default props to pass to the page component.
     */
    const pageProps: PageProps = {
      searchQuery: this.element.queryString,
      params: this.element.params,
      text: container.message?.text,
      userId: container.chatroomInfo.userId,
      routeInfoFile: this.router.routeInfoFile,
      data: container.message?.data,
      ...this.element.props,
      ...oldProps,
    };

    try {
      const wrappedElement = React.createElement(
        WrappedElement,
        {
          element: this.element,
          storage: this.storage,
          chatroomInfo: container.chatroomInfo,
          message: {
            ...container.message,
            text: pageProps.text,
          },
          api: this.coreApi,
        },
        await renderServerComponent(Component, pageProps),
      );
      this.updateLastCommitUpdateTime();

      await new Promise<void>((resolve) => {
        this.reconciler.updateContainer(
          wrappedElement,
          container._rootContainer,
          null,
          async () => {
            await this.adapter.componentOnMount(container);
            this.renderedPageProps = pageProps;
            resolve();
          },
        );
      });

      return container;
    } catch (e) {
      this.updateLastCommitUpdateTime();
      // redirect to the target location if a redirect error is thrown
      if (e instanceof RedirectError) {
        await this.redirect(
          container,
          {
            route: e.newLocation,
          },
          e.redirectOptions ?? {
            shouldRender: true,
            shouldAddToHistory: true,
          },
        );
      }
      throw e;
    }
  }

  async onDestroy() {
    await this.adapter.onDestroy();
    this.listeners.clear();
    // destroy the renderer
    if (this.container)
      this.reconciler.updateContainer(
        null,
        this.container._rootContainer,
        null,
      );
  }

  private updateLastCommitUpdateTime() {
    this.lastCommitUpdateTime = Date.now();
  }

  async sendMessage(message: SendMessage) {
    await this.adapter.handleSendMessage(message);
  }
}
