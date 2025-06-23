import { describe, expect, it, vi } from "vitest";
import { EventEmitter } from "../services/network/EventEmitter";

describe("EventEmitter", () => {
  it("should emit and listen to events", () => {
    const emitter = new EventEmitter();
    const callback = vi.fn();

    emitter.on("test-event", callback);
    emitter.emit("test-event", { data: "test" });

    expect(callback).toHaveBeenCalledWith({ data: "test" });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should handle multiple listeners for the same event", () => {
    const emitter = new EventEmitter();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    emitter.on("test-event", callback1);
    emitter.on("test-event", callback2);
    emitter.emit("test-event", "data");

    expect(callback1).toHaveBeenCalledWith("data");
    expect(callback2).toHaveBeenCalledWith("data");
  });

  it("should handle multiple events", () => {
    const emitter = new EventEmitter();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    emitter.on("event1", callback1);
    emitter.on("event2", callback2);

    emitter.emit("event1", "data1");
    emitter.emit("event2", "data2");

    expect(callback1).toHaveBeenCalledWith("data1");
    expect(callback2).toHaveBeenCalledWith("data2");
  });

  it("should not call listeners for different events", () => {
    const emitter = new EventEmitter();
    const callback = vi.fn();

    emitter.on("event1", callback);
    emitter.emit("event2", "data");

    expect(callback).not.toHaveBeenCalled();
  });

  it("should handle emitting events with no listeners", () => {
    const emitter = new EventEmitter();

    // Should not throw
    expect(() => emitter.emit("no-listeners", "data")).not.toThrow();
  });
});
