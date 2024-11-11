import { Route, SetStateOptions, StoredRoute } from "@rx-lab/common";
import { HISTORY_KEY, ROUTE_KEY, STATE_KEY, Storage } from "@rx-lab/storage";
import { Redis } from "@upstash/redis";

interface UpstashStorageOptions {
  /**
   * The URL of the Upstash Redis instance.
   */
  url: string;
  /**
   * The token to authenticate with the Upstash Redis instance.
   */
  token: string;
}

// The expiration time for the keys in seconds.
const EXPIRATION_TIME = 60 * 60 * 24 * 7; // 1 week

/**
 * Storage implementation that uses Upstash Redis as the backend.
 */
export class UpstashStorage extends Storage {
  private redis: Redis;

  constructor({ url, token }: UpstashStorageOptions) {
    super();
    this.redis = new Redis({
      url,
      token,
    });
  }

  async addHistory(key: string, route: StoredRoute): Promise<void> {
    const storedKey = `${HISTORY_KEY}-${key}`;
    await this.redis.set(storedKey, route);
    await this.redis.expire(storedKey, EXPIRATION_TIME);
  }

  async deleteHistory(key: string): Promise<void> {
    const storedKey = `${HISTORY_KEY}-${key}`;
    await this.redis.del(storedKey);
  }

  async deleteState(key: string, route: StoredRoute): Promise<void> {
    const storedKey = `${STATE_KEY}-${key}`;
    await this.redis.del(storedKey);
    const listener = this.stateChangeListeners.get(storedKey);
    listener?.();
  }

  async restoreHistory(key: string): Promise<StoredRoute | undefined> {
    const storedKey = `${HISTORY_KEY}-${key}`;
    const data = await this.redis.get<string>(storedKey);
    if (data !== null) {
      return data as any;
    }
    return undefined;
  }

  async restoreRoute(key: string): Promise<StoredRoute | undefined> {
    const storedKey = `${ROUTE_KEY}-${key}`;
    const data = await this.redis.get<string>(storedKey);
    if (data !== null) {
      return data as any;
    }
    return undefined;
  }

  async restoreState<T>(
    key: string,
    route: StoredRoute,
  ): Promise<T | undefined> {
    const storedKey = `${STATE_KEY}-${key}`;
    const exists = await this.redis.exists(storedKey);
    if (exists === 0) {
      return undefined;
    }
    return (await this.redis.get(storedKey)) as any;
  }

  async saveRoute(key: string, path: StoredRoute): Promise<void> {
    const storedKey = `${ROUTE_KEY}-${key}`;
    await this.redis.set(storedKey, path);
    await this.redis.expire(storedKey, EXPIRATION_TIME);
    const listener = this.routeChangeListeners.get(storedKey);
    listener?.();
  }

  async saveState<T>(
    key: string,
    route: Route,
    state: T,
    options?: SetStateOptions,
  ): Promise<void> {
    const storedKey = `${STATE_KEY}-${key}`;
    await this.redis.set(storedKey, state);
    if (options?.isPersisted !== true)
      await this.redis.expire(storedKey, EXPIRATION_TIME);
    const listener = this.stateChangeListeners.get(storedKey);
    listener?.();
  }
}
