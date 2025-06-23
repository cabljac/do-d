/**
 * Type-safe event emitter for handling application events
 */

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Event map interface - extend this to define your event types
 */
export interface EventMap {
  [key: string]: unknown;
}

/**
 * Generic event emitter with type safety
 * @template T - Event map defining event names and their data types
 */
export class EventEmitter<T extends EventMap = EventMap> {
  private events: { [K in keyof T]?: EventHandler<T[K]>[] } = {};

  /**
   * Subscribe to an event
   * @param event - Event name
   * @param callback - Handler function
   */
  on<K extends keyof T>(event: K, callback: EventHandler<T[K]>): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]!.push(callback);
  }

  /**
   * Emit an event
   * @param event - Event name
   * @param data - Event data
   */
  emit<K extends keyof T>(event: K, ...args: T[K] extends void ? [] : [T[K]]): void {
    if (this.events[event]) {
      const data = args[0] as T[K];
      this.events[event]!.forEach((callback) => callback(data));
    }
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param callback - Handler function to remove
   */
  off<K extends keyof T>(event: K, callback: EventHandler<T[K]>): void {
    if (this.events[event]) {
      this.events[event] = this.events[event]!.filter((cb) => cb !== callback);
    }
  }

  /**
   * Remove all event listeners for a specific event
   * @param event - Event name
   */
  removeAllListeners<K extends keyof T>(event?: K): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

/**
 * Default event emitter for backward compatibility
 */
export class UntypedEventEmitter extends EventEmitter<EventMap> {}
