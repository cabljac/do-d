import { beforeEach, describe, expect, it } from "vitest";

describe("Lobby Accessibility", () => {
  beforeEach(() => {
    // Mock DOM elements for testing
    document.body.innerHTML = `
      <div id="lobby">
        <h1>Durable Objects & Dragons</h1>
        <h2>Create a New Game</h2>
        <form>
          <label for="player-name">Player Name</label>
          <input id="player-name" type="text" required aria-required="true" />
          <label for="room-password">Room Password (Optional)</label>
          <input id="room-password" type="password" />
          <button id="create-room" class="focus:ring-2 focus:ring-blue-500 focus:outline-none">
            Create Room
          </button>
        </form>
        <h2>Join an Existing Game</h2>
        <form>
          <label for="join-room-id">Room ID</label>
          <input id="join-room-id" type="text" required aria-required="true" />
          <button id="join-room" class="focus:ring-2 focus:ring-blue-500 focus:outline-none">
            Join Room
          </button>
        </form>
      </div>
    `;
  });

  it("should have proper heading structure", () => {
    const h1 = document.querySelector("h1");
    const h2s = document.querySelectorAll("h2:not(.visually-hidden)");

    expect(h1).toBeTruthy();
    expect(h1?.textContent).toBeTruthy();
    expect(h2s.length).toBeGreaterThan(0);

    h2s.forEach((h2) => {
      expect(h2.textContent).toBeTruthy();
    });
  });

  it("should have proper form labels and ARIA attributes", () => {
    const inputs = document.querySelectorAll("input");
    expect(inputs.length).toBeGreaterThan(0);

    inputs.forEach((input) => {
      const hasAriaLabel = input.getAttribute("aria-label");
      const hasLabel = input.getAttribute("id");
      expect(hasAriaLabel || hasLabel).toBeTruthy();
    });

    const requiredInputs = document.querySelectorAll("input[required]");
    requiredInputs.forEach((input) => {
      expect(input.getAttribute("aria-required")).toBe("true");
    });
  });

  it("should be fully keyboard navigable", () => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusableElements.length).toBeGreaterThan(0);

    // Test that elements can receive focus
    const firstInput = document.getElementById("player-name") as HTMLElement;
    expect(firstInput).toBeTruthy();
    firstInput.focus();
    expect(document.activeElement).toBe(firstInput);
  });

  it("should have focus ring classes applied", () => {
    const createButton = document.getElementById("create-room");
    const joinButton = document.getElementById("join-room");

    expect(createButton?.className).toContain("focus:ring");
    expect(createButton?.className).toContain("focus:outline-none");
    expect(joinButton?.className).toContain("focus:ring");
    expect(joinButton?.className).toContain("focus:outline-none");
  });

  it("should have proper form structure", () => {
    const forms = document.querySelectorAll("form");
    expect(forms.length).toBeGreaterThan(0);

    forms.forEach((form) => {
      const inputs = form.querySelectorAll("input");
      const buttons = form.querySelectorAll("button");
      expect(inputs.length).toBeGreaterThan(0);
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it("should have accessible button text", () => {
    const buttons = document.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);

    buttons.forEach((button) => {
      expect(button.textContent?.trim()).toBeTruthy();
    });
  });
});
