import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TokenControls } from "../components/token/TokenControls";

// Mock the TokenModal
vi.mock("../components/token/TokenModal", () => ({
  TokenModal: vi.fn().mockImplementation(() => ({
    show: vi.fn((callback) => {
      // Simulate modal interaction - no x,y from modal
      callback({
        name: "Test Token",
        color: "#FF6B6B",
      });
    }),
  })),
}));

describe("TokenControls", () => {
  let container: HTMLElement;
  let tokenControls: TokenControls;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "token-controls";
    document.body.appendChild(container);

    mockCallback = vi.fn();
    tokenControls = new TokenControls(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should render add token button", () => {
    const button = container.querySelector("#add-token-button");
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain("Add Token");
  });

  it("should have proper button styling", () => {
    const button = container.querySelector("#add-token-button");
    expect(button?.classList.contains("add-token-btn")).toBe(true);
  });

  it("should show modal when button is clicked", () => {
    tokenControls.onAddToken(mockCallback);

    const button = container.querySelector("#add-token-button") as HTMLElement;
    button.click();

    expect(mockCallback).toHaveBeenCalledWith({
      name: "Test Token",
      x: 0,
      y: 0,
      color: "#FF6B6B",
    });
  });

  it("should clear container when clear() is called", () => {
    tokenControls.clear();
    expect(container.innerHTML).toBe("");
  });

  it("should not throw error if callback is not set", () => {
    const button = container.querySelector("#add-token-button") as HTMLElement;
    expect(() => button.click()).not.toThrow();
  });
});
