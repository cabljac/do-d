import type { TokenFormData } from "../../types";

export class TokenModal {
  private modal: HTMLElement;
  private form: HTMLFormElement;
  private callback?: (tokenData: TokenFormData) => void;

  constructor() {
    this.modal = this.createModal();
    this.form = this.modal.querySelector("form")!;
    document.body.appendChild(this.modal);
    this.setupEventListeners();
  }

  private createModal(): HTMLElement {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Add Token</h2>
          <button type="button" class="modal-close close-modal">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <form class="modal-form">
          <div class="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Token name"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>HP</label>
              <input
                type="number"
                name="hp"
                placeholder="Current HP"
              />
            </div>
            <div class="form-group">
              <label>Max HP</label>
              <input
                type="number"
                name="maxHp"
                placeholder="Maximum HP"
              />
            </div>
          </div>
          <div class="form-group">
            <label>Size</label>
            <select name="size">
              <option value="">Default (1 square)</option>
              <option value="2">Large (2x2)</option>
              <option value="3">Huge (3x3)</option>
              <option value="4">Gargantuan (4x4)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Color</label>
            <input
              type="color"
              name="color"
              value="#FF6B6B"
            />
          </div>
          <div class="form-group">
            <label>Image URL (optional)</label>
            <input
              type="url"
              name="imageUrl"
              placeholder="https://example.com/image.png"
            />
          </div>
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
            >
              Add Token
            </button>
          </div>
        </form>
      </div>
    `;

    return modal;
  }

  private setupEventListeners(): void {
    // Close modal when clicking outside
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Close button
    this.modal.querySelector(".close-modal")?.addEventListener("click", () => {
      this.hide();
    });

    // Cancel button
    this.modal.querySelector(".cancel-button")?.addEventListener("click", () => {
      this.hide();
    });

    // Form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  private handleSubmit(): void {
    const formData = new FormData(this.form);
    const name = formData.get("name") as string;
    const color = formData.get("color") as string;

    // Validate required fields
    if (!name || name.trim() === "") {
      console.log("Token name is required");
      // Focus the name input and show visual feedback
      const nameInput = this.form.elements.namedItem("name") as HTMLInputElement;
      nameInput.focus();
      nameInput.classList.add("error");
      setTimeout(() => nameInput.classList.remove("error"), 2000);
      return;
    }

    const tokenData: TokenFormData = {
      name: name.trim(),
      color: color,
    };

    // Optional fields
    const hp = formData.get("hp");
    const maxHp = formData.get("maxHp");
    const size = formData.get("size");
    const imageUrl = formData.get("imageUrl");

    if (hp) tokenData.hp = parseInt(hp as string);
    if (maxHp) tokenData.maxHp = parseInt(maxHp as string);
    if (size) tokenData.size = parseInt(size as string);
    if (imageUrl) tokenData.imageUrl = imageUrl as string;

    if (this.callback) {
      this.callback(tokenData);
      this.hide();
      this.form.reset();
      // Reset default values
      (this.form.elements.namedItem("color") as HTMLInputElement).value = "#FF6B6B";
    }
  }

  public show(callback: (tokenData: TokenFormData) => void): void {
    this.callback = callback;
    this.modal.classList.add("show");
    // Focus the name input
    setTimeout(() => {
      (this.form.elements.namedItem("name") as HTMLInputElement)?.focus();
    }, 100);
  }

  public hide(): void {
    this.modal.classList.remove("show");
  }
}
