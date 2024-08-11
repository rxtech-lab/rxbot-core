import { Storage } from "../storage.interface";
import { Component, Builder, ComponentInterface } from "@rx-lab/common";

/**
 * MemoryStorage is a storage that stores the component tree and state in memory.
 */
export class MemoryStorage extends Storage {
  private componentTreeMap = new Map<string, ComponentInterface>();
  private stateMap = new Map<string, any>();

  constructor(builder: Builder) {
    super(builder);
  }

  async restoreComponentTree(key: string): Promise<Component | undefined> {
    const value = this.componentTreeMap.get(key);
    if (!value) {
      return undefined;
    }
    return this.builder.buildFromJson(value);
  }

  async restoreState<T>(key: string): Promise<T | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return this.stateMap.get(key);
  }

  async saveComponentTree(
    rootContainer: Component,
    key: string,
  ): Promise<void> {
    this.componentTreeMap.set(key, rootContainer.toJSON());
  }

  async saveState<T>(key: string, state: T): Promise<void> {
    // Simulate a delay to make it more realistic
    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.stateMap.set(key, state);
    const listener = this.listeners.get(key);
    listener?.();
  }
}
