import {
  type AdapterInterface,
  BaseChatroomInfo,
  BaseMessage,
  type Container,
  CoreApi,
  CoreInterface,
  ErrorPageProps,
  PageProps,
  RedirectOptions,
  RenderedComponent,
  RouteInfoFile,
  SendMessage,
  StorageInterface,
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
      renderApp: (container, callback) => {
        this.listeners.set(this.adapter, callback);
        return this.render(container);
      },
      restoreRoute: async (key) => {
        return await this.router.getRouteFromKey(key);
      },
      redirectTo: async (container, path, options) => {
        await this.redirect(container, path, options);
        return container;
      },
      redirectToWithMessage: async (message, path, options) => {
        const container = this.adapter.createContainer(message);
        await this.redirect(container, path, options);
        return container;
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
    const route = await this.adapter.decodeRoute(routeOrObject);
    if (route) {
      if (container.message && options?.keepTextMessage !== true)
        container.message.text = undefined;
    }

    let component: RenderedComponent | undefined;
    if (options?.shouldRender) {
      component = await this.loadAndRenderStoredRoute(key, route);
      try {
        await this.render(container);
      } catch (e: any) {
        console.error(e);
        const props: ErrorPageProps = {
          error: e,
          code: 500,
        };
        const errorComponent = await this.router.renderSpecialRoute(
          route,
          "error",
          {},
          props,
        );
        await this.setComponent(errorComponent);
        await this.render(container);
        component.isError = true;
      }
    }
    // only save the route if the component is not an error page
    if (route && component?.isError !== true) {
      await this.router.navigateTo(key, route);
      if (options?.shouldAddToHistory) {
        await this.storage.addHistory(key, route);
      }
    }
  }

  async loadAndRenderStoredRoute(key: string, defaultRoute?: string) {
    const component = await this.router.render(key, defaultRoute);
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
   * @private
   */
  async render(container: T) {
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
    };

    try {
      const wrappedElement = React.createElement(
        WrappedElement,
        {
          element: this.element,
          storage: this.storage,
          chatroomInfo: container.chatroomInfo,
          message: container.message,
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
          e.newLocation,
          e.redirectOptions ?? {
            shouldRender: true,
            shouldAddToHistory: true,
          },
        );
        return container;
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
