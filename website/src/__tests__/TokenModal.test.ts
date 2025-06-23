import { beforeEach, describe, expect, it, vi } from "vitest";
import { TokenModal } from "../components/token/TokenModal";

describe("TokenModal", () => {
  let modal: TokenModal;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = "";
    modal = new TokenModal();
    mockCallback = vi.fn();
  });

  it("should create modal element in DOM", () => {
    const modalElement = document.querySelector(".modal-overlay");
    expect(modalElement).toBeTruthy();
    expect(modalElement?.classList.contains("show")).toBe(false);
  });

  it("should show modal when show() is called", () => {
    modal.show(mockCallback);
    const modalElement = document.querySelector(".modal-overlay") as HTMLElement;
    expect(modalElement.classList.contains("show")).toBe(true);
  });

  it("should hide modal when hide() is called", () => {
    modal.show(mockCallback);
    modal.hide();
    const modalElement = document.querySelector(".modal-overlay") as HTMLElement;
    expect(modalElement.classList.contains("show")).toBe(false);
  });

  it("should hide modal when clicking outside", () => {
    modal.show(mockCallback);
    const modalElement = document.querySelector(".modal-overlay") as HTMLElement;
    modalElement.click();
    expect(modalElement.classList.contains("show")).toBe(false);
  });

  it("should hide modal when close button is clicked", () => {
    modal.show(mockCallback);
    const closeButton = document.querySelector(".close-modal") as HTMLElement;
    closeButton.click();
    const modalElement = document.querySelector(".modal-overlay") as HTMLElement;
    expect(modalElement.classList.contains("show")).toBe(false);
  });

  it("should submit form with required fields", () => {
    modal.show(mockCallback);

    const form = document.querySelector("form") as HTMLFormElement;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const colorInput = form.elements.namedItem("color") as HTMLInputElement;

    nameInput.value = "Test Token";
    colorInput.value = "#FF0000";

    form.dispatchEvent(new Event("submit", { bubbles: true }));

    expect(mockCallback).toHaveBeenCalledWith({
      name: "Test Token",
      color: "#ff0000", // HTML color inputs return lowercase
    });

    const modalElement = document.querySelector(".modal-overlay") as HTMLElement;
    expect(modalElement.classList.contains("show")).toBe(false);
  });

  it("should submit form with optional fields", () => {
    modal.show(mockCallback);

    const form = document.querySelector("form") as HTMLFormElement;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const colorInput = form.elements.namedItem("color") as HTMLInputElement;
    const hpInput = form.elements.namedItem("hp") as HTMLInputElement;
    const maxHpInput = form.elements.namedItem("maxHp") as HTMLInputElement;
    const sizeInput = form.elements.namedItem("size") as HTMLSelectElement;
    const imageUrlInput = form.elements.namedItem("imageUrl") as HTMLInputElement;

    nameInput.value = "Boss Token";
    colorInput.value = "#00FF00";
    hpInput.value = "50";
    maxHpInput.value = "100";
    sizeInput.value = "2";
    imageUrlInput.value = "https://example.com/boss.png";

    form.dispatchEvent(new Event("submit", { bubbles: true }));

    expect(mockCallback).toHaveBeenCalledWith({
      name: "Boss Token",
      color: "#00ff00", // HTML color inputs return lowercase
      hp: 50,
      maxHp: 100,
      size: 2,
      imageUrl: "https://example.com/boss.png",
    });
  });

  it("should reset form after submission", () => {
    modal.show(mockCallback);

    const form = document.querySelector("form") as HTMLFormElement;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;

    nameInput.value = "Test Token";
    form.dispatchEvent(new Event("submit", { bubbles: true }));

    expect(nameInput.value).toBe("");
  });

  it("should not call callback when cancelled", () => {
    modal.show(mockCallback);

    const cancelButton = document.querySelector(".cancel-button") as HTMLElement;
    cancelButton.click();

    expect(mockCallback).not.toHaveBeenCalled();

    const modalElement = document.querySelector(".modal-overlay") as HTMLElement;
    expect(modalElement.classList.contains("show")).toBe(false);
  });
});
