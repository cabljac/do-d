import { beforeEach, vi } from "vitest";

// Polyfill global for browser environment
if (typeof global === "undefined") {
  (window as typeof globalThis).global = window;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
