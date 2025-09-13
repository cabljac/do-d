export class DeleteConfirmationModal {
  private modal: HTMLDivElement;
  private onConfirm?: () => void;
  private onCancel?: () => void;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleBackdropClick: (e: MouseEvent) => void;
  private boundHandleConfirmClick: () => void;
  private boundHandleCancelClick: () => void;

  constructor() {
    this.modal = this.createModal();
    document.body.appendChild(this.modal);

    // Bind event handlers
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleBackdropClick = this.handleBackdropClick.bind(this);
    this.boundHandleConfirmClick = this.handleConfirmClick.bind(this);
    this.boundHandleCancelClick = this.handleCancelClick.bind(this);
  }

  private createModal(): HTMLDivElement {
    const modal = document.createElement("div");
    modal.className = "delete-confirmation-modal hidden";
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <h3>Delete Token</h3>
        <p>Are you sure you want to delete "<span id="token-name"></span>"?</p>
        <div class="modal-actions">
          <button id="cancel-delete" class="btn-secondary">Cancel</button>
          <button id="confirm-delete" class="btn-danger">Delete</button>
        </div>
      </div>
    `;
    return modal;
  }

  show(tokenName: string, onConfirm: () => void, onCancel?: () => void): void {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;

    const nameSpan = this.modal.querySelector("#token-name");
    if (nameSpan) nameSpan.textContent = tokenName;

    this.modal.classList.remove("hidden");
    this.setupEventListeners();

    // Focus on cancel button for safety
    const cancelBtn = this.modal.querySelector("#cancel-delete") as HTMLButtonElement;
    cancelBtn?.focus();
  }

  hide(): void {
    this.modal.classList.add("hidden");
    this.removeEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener("keydown", this.boundHandleKeyDown);

    // Click events
    const backdrop = this.modal.querySelector(".modal-backdrop");
    backdrop?.addEventListener("click", this.boundHandleBackdropClick);

    const confirmBtn = this.modal.querySelector("#confirm-delete");
    confirmBtn?.addEventListener("click", this.boundHandleConfirmClick);

    const cancelBtn = this.modal.querySelector("#cancel-delete");
    cancelBtn?.addEventListener("click", this.boundHandleCancelClick);
  }

  private removeEventListeners(): void {
    document.removeEventListener("keydown", this.boundHandleKeyDown);

    const backdrop = this.modal.querySelector(".modal-backdrop");
    backdrop?.removeEventListener("click", this.boundHandleBackdropClick);

    const confirmBtn = this.modal.querySelector("#confirm-delete");
    confirmBtn?.removeEventListener("click", this.boundHandleConfirmClick);

    const cancelBtn = this.modal.querySelector("#cancel-delete");
    cancelBtn?.removeEventListener("click", this.boundHandleCancelClick);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this.handleCancelClick();
    }
  }

  private handleBackdropClick(): void {
    this.handleCancelClick();
  }

  private handleConfirmClick(): void {
    if (this.onConfirm) {
      this.onConfirm();
    }
    this.hide();
  }

  private handleCancelClick(): void {
    if (this.onCancel) {
      this.onCancel();
    }
    this.hide();
  }

  destroy(): void {
    this.removeEventListeners();
    this.modal.remove();
  }
}
