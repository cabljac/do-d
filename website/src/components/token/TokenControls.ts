import type { GameCanvas } from "../../canvas/GameCanvas";
import type { TokenFormDataWithPosition } from "../../types";
import { TokenModal } from "./TokenModal";

export class TokenControls {
  private container: HTMLElement;
  private modal: TokenModal;
  private onAddTokenCallback?: (tokenData: TokenFormDataWithPosition) => void;
  private canvas?: GameCanvas;

  constructor(container: HTMLElement) {
    this.container = container;
    this.modal = new TokenModal();
    this.render();
    this.setupEventListeners();
  }

  public setCanvas(canvas: GameCanvas): void {
    this.canvas = canvas;
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="token-controls-container">
        <button 
          id="add-token-button"
          class="add-token-btn"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add Token
        </button>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const button = this.container.querySelector("#add-token-button");

    button?.addEventListener("click", () => {
      this.modal.show((tokenData) => {
        if (this.onAddTokenCallback) {
          // Add current grid position to token data
          const tokenWithPosition: TokenFormDataWithPosition = {
            ...tokenData,
            x: 0,
            y: 0,
          };

          if (this.canvas) {
            const gridPos = this.canvas.getCurrentGridPosition();
            tokenWithPosition.x = gridPos.x;
            tokenWithPosition.y = gridPos.y;
          }

          this.onAddTokenCallback(tokenWithPosition);
        }
      });
    });
  }

  public onAddToken(callback: (tokenData: TokenFormDataWithPosition) => void): void {
    this.onAddTokenCallback = callback;
  }

  public clear(): void {
    this.container.innerHTML = "";
  }
}
