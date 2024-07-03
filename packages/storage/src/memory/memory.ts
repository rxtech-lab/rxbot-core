import { Storage } from "../storage.interface";
import { Component, Builder, ComponentInterface } from "@rx-lab/common";

/**
 * MemoryStorage is a storage that stores the component tree and state in memory.
 */
export class MemoryStorage extends Storage {
  private componentTreeMap = new Map<string, ComponentInterface>();
  private stateMap = new Map<string, any>();

  constructor(private readonly builder: Builder) {
    super();
  }

  async restoreComponentTree(key: string): Promise<Component | undefined> {
    const value = this.componentTreeMap.get(key);
    if (!value) {
      return undefined;
    }
    return this.builder.buildFromJson(value);
  }

  async restoreState<T>(key: string): Promise<T | undefined> {
    return this.stateMap.get(key);
  }

  async saveComponentTree(
    rootContainer: Component,
    key: string,
  ): Promise<void> {
    this.componentTreeMap.set(key, rootContainer.toJSON());
  }

  async saveState<T>(key: string, state: T): Promise<void> {
    this.stateMap.set(key, state);
    const listener = this.listeners.get(key);
    listener?.();
  }
}
