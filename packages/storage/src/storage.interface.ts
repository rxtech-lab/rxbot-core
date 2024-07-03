import { Component } from "@rx-lab/common";

export interface StorageInterface {
  /**
   * Save the component tree to the storage.
   * @param rootContainer - root component of the tree.
   * @param key - key to save the component tree with.
   */
  saveComponentTree(rootContainer: Component, key: string): Promise<void>;

  /**
   * Get the component tree from the storage.
   */
  restoreComponentTree(key: string): Promise<Component | undefined>;

  /**
   * Save the state to the storage.
   * @param key
   * @param state
   */
  saveState<T>(key: string, state: T): Promise<void>;

  /**
   * Get the state from the storage.
   * @param key
   */
  restoreState<T>(key: string): Promise<T | undefined>;

  subscribe(key: string, callback: () => void): () => void;
}

export abstract class Storage implements StorageInterface {
  listeners: Map<string, () => void> = new Map();

  abstract restoreComponentTree(key: string): Promise<Component | undefined>;

  abstract restoreState<T>(key: string): Promise<T | undefined>;

  abstract saveComponentTree(
    rootContainer: Component,
    key: string,
  ): Promise<void>;

  abstract saveState<T>(key: string, state: T): Promise<void>;

  subscribe(key: string, callback: () => void): () => void {
    this.listeners.set(key, callback);
    return () => {
      this.listeners.delete(key);
    };
  }
}
