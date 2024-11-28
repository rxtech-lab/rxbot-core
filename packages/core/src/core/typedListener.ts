import EventEmitter from "events";

export class TypedEventEmitter<
  TEvents extends Record<string, (...args: any[]) => void>,
> {
  private emitter = new EventEmitter();

  // Type-safe on method
  on<TEventName extends keyof TEvents>(
    eventName: TEventName,
    handler: TEvents[TEventName],
  ): void {
    this.emitter.on(eventName as string, handler);
  }

  // Type-safe emit method
  emit<TEventName extends keyof TEvents>(
    eventName: TEventName,
    ...args: Parameters<TEvents[TEventName]>
  ): void {
    this.emitter.emit(eventName as string, ...args);
  }

  // Type-safe once method
  once<TEventName extends keyof TEvents>(
    eventName: TEventName,
    handler: TEvents[TEventName],
  ): void {
    this.emitter.once(eventName as string, handler);
  }

  // Type-safe off method
  off<TEventName extends keyof TEvents>(
    eventName: TEventName,
    handler: TEvents[TEventName],
  ): void {
    this.emitter.off(eventName as string, handler);
  }

  // Remove all listeners for a specific event
  removeAllListeners<TEventName extends keyof TEvents>(
    eventName?: TEventName,
  ): void {
    if (eventName) {
      this.emitter.removeAllListeners(eventName as string);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  // Get the current number of listeners for an event
  listenerCount<TEventName extends keyof TEvents>(
    eventName: TEventName,
  ): number {
    return this.emitter.listenerCount(eventName as string);
  }

  // Get all registered event names
  eventNames(): (keyof TEvents)[] {
    return this.emitter.eventNames() as (keyof TEvents)[];
  }
}
