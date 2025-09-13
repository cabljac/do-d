// frontend/src/canvas/GameCanvas.ts
import { EventEmitter } from "../services/network/EventEmitter";
import type { CanvasEventMap, GameState, Token } from "../types";

// Constants for better minification and maintenance
const FONT_SYSTEM = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const COLOR_PRIMARY = "#14b8a6";
const COLOR_WHITE_ALPHA = "rgba(255, 255, 255, 0.1)";

export class GameCanvas extends EventEmitter<CanvasEventMap> {
  private ctx: CanvasRenderingContext2D;
  private gameState?: GameState;
  private gridSize = 40;
  private offset = { x: 0, y: 0 };
  private scale = 1;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private selectedToken: Token | null = null;
  private isMovingToken = false;
  private cursorPosition: { x: number; y: number } | null = null;
  private justDropped = false;
  private clickToMoveMode = false;
  private hoverGridPosition: { x: number; y: number } | null = null;
  private isDragInitiated = false;
  private isMouseDown = false;
  private deleteButtonBounds: { x: number; y: number; width: number; height: number } | null = null;
  private resizeHandler!: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    super();
    this.ctx = canvas.getContext("2d")!;
    this.setupCanvas();
    this.setupEventListeners();
  }

  private setupCanvas() {
    // Make canvas fill its container
    this.resizeHandler = () => {
      const container = this.canvas.parentElement!;
      const rect = container.getBoundingClientRect();
      // Account for container padding/margins
      const computedStyle = window.getComputedStyle(container);
      const paddingX =
        parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
      const paddingY =
        parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);

      this.canvas.width = rect.width - paddingX;
      this.canvas.height = rect.height - paddingY;
      this.render();
    };

    this.resizeHandler();
    window.addEventListener("resize", this.resizeHandler);
  }

  resize() {
    this.resizeHandler();
  }

  private setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener("wheel", this.handleWheel.bind(this));

    // Touch events for mobile
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this));
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this));

    // Keyboard events for accessibility
    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  setGameState(state: GameState) {
    this.gameState = state;
  }

  render() {
    // Save context first
    this.ctx.save();

    // Reset transform to clear the entire canvas
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Clear canvas with glassmorphism background
    this.drawParchmentBackground();

    // Restore and apply camera transforms
    this.ctx.restore();
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);

    // Draw grid
    this.drawGrid();

    // Draw tokens
    if (this.gameState) {
      this.drawTokens();
    }

    // Draw hover preview for click-to-move (in world coordinates)
    if (this.clickToMoveMode && this.selectedToken && this.hoverGridPosition) {
      this.drawHoverPreview();
    }

    // Restore context
    this.ctx.restore();

    // Draw preview token if moving (in screen coordinates)
    if (this.isMovingToken && this.selectedToken && this.cursorPosition) {
      this.drawPreviewToken();
    }

    // Draw UI elements (not affected by camera)
    this.drawUI();
  }

  private drawParchmentBackground() {
    // Dark base color matching the theme
    this.ctx.fillStyle = "#0f1618";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Create multiple gradient orbs for glassmorphism effect
    const gradients = [
      { x: 0.2, y: 0.8, color: "#14b8a6", size: 0.6 },
      { x: 0.8, y: 0.2, color: "#06b6d4", size: 0.5 },
      { x: 0.5, y: 0.5, color: "#22d3ee", size: 0.4 },
    ];

    gradients.forEach(({ x, y, color, size }) => {
      const gradient = this.ctx.createRadialGradient(
        this.canvas.width * x,
        this.canvas.height * y,
        0,
        this.canvas.width * x,
        this.canvas.height * y,
        this.canvas.width * size,
      );
      gradient.addColorStop(0, `${color}40`); // 25% opacity
      gradient.addColorStop(0.5, `${color}20`); // 12.5% opacity
      gradient.addColorStop(1, "transparent");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    });

    // Add subtle noise for texture - optimize by sampling less frequently
    this.ctx.globalAlpha = 0.03;
    this.ctx.fillStyle = "#ffffff";
    const step = 4; // Increased from 2 to reduce iterations
    for (let i = 0; i < this.canvas.width; i += step) {
      for (let j = 0; j < this.canvas.height; j += step) {
        if (Math.random() > 0.5) {
          this.ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    this.ctx.globalAlpha = 1;
  }

  private drawGrid() {
    const startX = Math.floor(-this.offset.x / this.scale / this.gridSize) * this.gridSize;
    const startY = Math.floor(-this.offset.y / this.scale / this.gridSize) * this.gridSize;
    const endX = startX + this.canvas.width / this.scale + this.gridSize;
    const endY = startY + this.canvas.height / this.scale + this.gridSize;

    // Glass-like grid lines
    this.ctx.strokeStyle = COLOR_WHITE_ALPHA;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.5;

    // Add subtle glow effect to grid
    this.ctx.shadowColor = "rgba(20, 184, 166, 0.3)";
    this.ctx.shadowBlur = 2;

    // Vertical lines
    for (let x = startX; x <= endX; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }

    // Reset shadow
    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
  }

  private drawTokens() {
    if (!this.gameState || !this.gameState.tokens) {
      return;
    }

    const tokens = Object.values(this.gameState.tokens);

    tokens.forEach((token) => {
      // Token position (grid coordinates to pixels)
      const x = token.x * this.gridSize;
      const y = token.y * this.gridSize;

      // Calculate size multiplier (default to 1 if not specified)
      const sizeMultiplier = token.size || 1;
      const actualSize = this.gridSize * sizeMultiplier;
      const centerX = x + actualSize / 2;
      const centerY = y + actualSize / 2;
      const radius = actualSize / 2 - 6;

      // Save context for token-specific transforms
      this.ctx.save();

      // Draw glow effect
      const glowGradient = this.ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.5,
        centerX,
        centerY,
        radius * 1.5,
      );
      glowGradient.addColorStop(0, `${token.color}60`);
      glowGradient.addColorStop(1, "transparent");
      this.ctx.fillStyle = glowGradient;
      this.ctx.fillRect(
        x - actualSize * 0.25,
        y - actualSize * 0.25,
        actualSize * 1.5,
        actualSize * 1.5,
      );

      // Draw glass token background
      this.ctx.fillStyle = COLOR_WHITE_ALPHA;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw token with gradient
      const tokenGradient = this.ctx.createLinearGradient(
        centerX - radius,
        centerY - radius,
        centerX + radius,
        centerY + radius,
      );
      tokenGradient.addColorStop(0, token.color);
      tokenGradient.addColorStop(1, this.adjustColor(token.color, -30));

      this.ctx.fillStyle = tokenGradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw glass border
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Draw selection highlight with glow
      if (this.selectedToken?.id === token.id) {
        this.ctx.shadowColor = COLOR_PRIMARY;
        this.ctx.shadowBlur = 10;
        this.ctx.strokeStyle = COLOR_PRIMARY;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }

      // Draw token name with shadow
      this.ctx.fillStyle = "white";
      this.ctx.font = `bold 12px ${FONT_SYSTEM}`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      this.ctx.shadowBlur = 2;
      this.ctx.fillText(token.name, centerX, centerY);
      this.ctx.shadowBlur = 0;

      // Draw modern HP bar if present
      if (token.hp !== undefined && token.maxHp !== undefined) {
        const barWidth = actualSize - 12;
        const barHeight = 6;
        const barX = x + 6;
        const barY = y + actualSize - 10;
        const hpPercent = token.hp / token.maxHp;

        // Glass background
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Border
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        // HP bar with gradient
        const hpColor = hpPercent > 0.5 ? "#10b981" : hpPercent > 0.25 ? "#f59e0b" : "#ef4444";
        const hpGradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        hpGradient.addColorStop(0, hpColor);
        hpGradient.addColorStop(1, this.adjustColor(hpColor, 20));

        this.ctx.fillStyle = hpGradient;
        this.ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * hpPercent, barHeight - 2);

        // HP bar glow
        if (hpPercent < 0.5) {
          this.ctx.shadowColor = hpColor;
          this.ctx.shadowBlur = 4;
          this.ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * hpPercent, barHeight - 2);
          this.ctx.shadowBlur = 0;
        }
      }

      this.ctx.restore();
    });
  }

  // Helper function to adjust color brightness
  private adjustColor(color: string, amount: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  private drawUI() {
    // Draw selection instructions if a token is selected
    if (this.selectedToken) {
      this.drawSelectionInstructions();
    }
  }

  private drawSelectionInstructions(): void {
    if (!this.selectedToken) return;

    // Draw a subtle instruction panel
    const panelWidth = 350;
    const panelHeight = 60;
    const panelX = 20;
    const panelY = 20;

    // Glass background
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

    // Border
    this.ctx.strokeStyle = "rgba(20, 184, 166, 0.5)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Text
    this.ctx.fillStyle = "white";
    this.ctx.font = `14px ${FONT_SYSTEM}`;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";

    const tokenName = this.selectedToken.name;
    this.ctx.fillText(`Selected: ${tokenName}`, panelX + 10, panelY + 10);
    this.ctx.font = `12px ${FONT_SYSTEM}`;
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

    const instructionText = this.clickToMoveMode
      ? "Click an empty square to move or drag to a new position"
      : "Drag to a new position or press Escape to deselect";

    this.ctx.fillText(instructionText, panelX + 10, panelY + 35);

    this.ctx.restore();

    // Add delete button
    this.drawDeleteButton(panelX + panelWidth - 40, panelY + 10, 30, 30);
  }

  private drawDeleteButton(x: number, y: number, width: number, height: number): void {
    // Glass button background
    this.ctx.save();
    this.ctx.fillStyle = "rgba(239, 68, 68, 0.2)"; // Red tint
    this.ctx.fillRect(x, y, width, height);

    // Border
    this.ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    // X icon
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.lineWidth = 2;
    const padding = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(x + padding, y + padding);
    this.ctx.lineTo(x + width - padding, y + height - padding);
    this.ctx.moveTo(x + width - padding, y + padding);
    this.ctx.lineTo(x + padding, y + height - padding);
    this.ctx.stroke();

    this.ctx.restore();

    // Store button bounds for click detection
    this.deleteButtonBounds = { x, y, width, height };
  }

  private screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    const worldX = (screenX - this.offset.x) / this.scale;
    const worldY = (screenY - this.offset.y) / this.scale;
    return {
      x: Math.floor(worldX / this.gridSize),
      y: Math.floor(worldY / this.gridSize),
    };
  }

  private getTokenAt(gridX: number, gridY: number): Token | null {
    if (!this.gameState || !this.gameState.tokens) return null;

    return (
      Object.values(this.gameState.tokens).find((token) => {
        const size = token.size || 1;
        // Check if the clicked position is within the token's area
        return (
          gridX >= token.x && gridX < token.x + size && gridY >= token.y && gridY < token.y + size
        );
      }) || null
    );
  }

  private handleMouseDown(e: MouseEvent) {
    this.isMouseDown = true;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on delete button
    if (
      this.deleteButtonBounds &&
      this.selectedToken &&
      x >= this.deleteButtonBounds.x &&
      x <= this.deleteButtonBounds.x + this.deleteButtonBounds.width &&
      y >= this.deleteButtonBounds.y &&
      y <= this.deleteButtonBounds.y + this.deleteButtonBounds.height
    ) {
      this.emit("token-delete-request", {
        tokenId: this.selectedToken.id,
        tokenName: this.selectedToken.name,
      });
      return;
    }

    const gridPos = this.screenToGrid(x, y);
    const token = this.getTokenAt(gridPos.x, gridPos.y);

    if (token) {
      // Check if we're in click-to-move mode with a different token
      if (this.clickToMoveMode && this.selectedToken && this.selectedToken.id !== token.id) {
        // Switch selection to new token
        this.selectedToken = token;
        this.emit("token-select", { tokenId: token.id });
        this.render();
        return;
      }

      // Select token for potential click-to-move or drag
      this.selectedToken = token;
      this.clickToMoveMode = true;
      this.isDragInitiated = false;
      console.log("Token selected for click-to-move:", token.id, "Mode:", this.clickToMoveMode);
      this.emit("token-select", { tokenId: token.id });

      // Store the starting position for potential drag
      this.dragStart = {
        x: e.clientX - this.offset.x,
        y: e.clientY - this.offset.y,
      };
    } else {
      // Check if we're in click-to-move mode
      if (this.clickToMoveMode && this.selectedToken) {
        // Execute click-to-move
        console.log("Executing click-to-move to", gridPos);
        this.executeClickToMove(gridPos);
        return;
      }

      // Deselect current token if clicking on empty space
      if (this.selectedToken) {
        this.selectedToken = null;
        this.emit("token-deselect");
      }

      // Start panning
      this.isDragging = true;
      this.dragStart = {
        x: e.clientX - this.offset.x,
        y: e.clientY - this.offset.y,
      };
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update hover position for click-to-move preview
    if (this.clickToMoveMode && this.selectedToken && !this.isDragInitiated) {
      const gridPos = this.screenToGrid(x, y);
      const token = this.getTokenAt(gridPos.x, gridPos.y);

      // Only show hover preview on empty squares
      if (!token) {
        this.hoverGridPosition = gridPos;
      } else {
        this.hoverGridPosition = null;
      }
      this.render();
    }

    // Check for drag initiation (only when mouse is down)
    if (this.isMouseDown && this.selectedToken && !this.isDragInitiated && !this.isMovingToken) {
      const mouseDeltaX = Math.abs(e.clientX - (this.dragStart.x + this.offset.x));
      const mouseDeltaY = Math.abs(e.clientY - (this.dragStart.y + this.offset.y));
      const dragThreshold = 5; // pixels

      if (mouseDeltaX > dragThreshold || mouseDeltaY > dragThreshold) {
        // Transition from click-to-move to drag mode
        this.clickToMoveMode = false;
        this.isDragInitiated = true;
        this.isMovingToken = true;
        this.hoverGridPosition = null;
        this.justDropped = false; // Reset the flag when starting to move
      }
    }

    if (this.isDragging) {
      // Pan the view
      this.offset.x = e.clientX - this.dragStart.x;
      this.offset.y = e.clientY - this.dragStart.y;
      this.render();
    } else if (this.isMovingToken && this.selectedToken && !this.justDropped) {
      // Update preview position and cursor position for drag
      this.cursorPosition = { x, y };
      this.render();
    } else if (!this.isMovingToken) {
      // Clear preview position when not moving
      this.cursorPosition = null;
      this.justDropped = false; // Reset the flag
    }
  }

  private handleMouseUp(e: MouseEvent) {
    this.isMouseDown = false;
    if (this.isMovingToken && this.selectedToken) {
      // Move token via drag
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const gridPos = this.screenToGrid(x, y);

      // Check if position is different
      if (gridPos.x !== this.selectedToken.x || gridPos.y !== this.selectedToken.y) {
        this.emit("token-move", {
          tokenId: this.selectedToken.id,
          x: gridPos.x,
          y: gridPos.y,
        });
      }

      // Clear selection after drag
      this.clearSelection();
    }

    this.isDragging = false;
    this.isMovingToken = false;
    this.isDragInitiated = false;
    this.cursorPosition = null;
    this.justDropped = true;
    this.render(); // Re-render to clear the preview immediately
  }

  private executeClickToMove(gridPos: { x: number; y: number }): void {
    if (!this.selectedToken) return;

    // Check if clicking on the same position
    if (gridPos.x === this.selectedToken.x && gridPos.y === this.selectedToken.y) {
      // Keep selection when clicking same position
      return;
    }

    // Check if destination is occupied
    const targetToken = this.getTokenAt(gridPos.x, gridPos.y);
    if (targetToken) {
      // Switch selection to target token
      this.selectedToken = targetToken;
      this.emit("token-select", { tokenId: targetToken.id });
      this.render();
      return;
    }

    // Execute the move
    this.emit("token-move", {
      tokenId: this.selectedToken.id,
      x: gridPos.x,
      y: gridPos.y,
    });

    // Clear selection after successful move
    this.clearSelection();
    this.render();
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault();

    // Constants
    const ZOOM_SPEED = 0.1;
    const MIN_SCALE = 0.8;
    const MAX_SCALE = 4;

    // Determine zoom direction
    // Note: deltaY > 0 means scrolling down (zoom out), < 0 means scrolling up (zoom in)
    const zoomIn = e.deltaY < 0;
    const zoomMultiplier = zoomIn ? 1 + ZOOM_SPEED : 1 - ZOOM_SPEED;

    // Calculate new scale
    let newScale = this.scale * zoomMultiplier;
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    // Don't do anything if we're at the limit
    if (newScale === this.scale) {
      return;
    }

    // Get mouse position relative to the canvas element
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Convert canvas position to world position BEFORE zoom
    // This is the world position that should stay under the cursor
    const worldBeforeX = (canvasX - this.offset.x) / this.scale;
    const worldBeforeY = (canvasY - this.offset.y) / this.scale;

    // Apply the new scale
    this.scale = newScale;

    // Calculate where that world position would be on canvas with new scale
    const canvasAfterX = worldBeforeX * this.scale + this.offset.x;
    const canvasAfterY = worldBeforeY * this.scale + this.offset.y;

    // Adjust offset to keep the world position under the cursor
    this.offset.x += canvasX - canvasAfterX;
    this.offset.y += canvasY - canvasAfterY;

    this.render();
  }

  // Touch handlers (basic mobile support)
  private handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent);
    }
  }

  private handleTouchMove(e: TouchEvent) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent);
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      this.handleMouseUp({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent);
    }
  }

  // Public method for external token updates
  moveToken(tokenId: string, x: number, y: number) {
    if (!this.gameState || !this.gameState.tokens) return;

    const token = this.gameState.tokens[tokenId];
    if (token) {
      token.x = x;
      token.y = y;
      this.render();
    }
  }

  deleteToken(tokenId: string): void {
    if (!this.gameState || !this.gameState.tokens) return;

    const token = this.gameState.tokens[tokenId];
    if (!token) return;

    // Remove from local state
    delete this.gameState.tokens[tokenId];

    // Clear selection if this was the selected token
    if (this.selectedToken?.id === tokenId) {
      this.clearSelection();
    }

    this.render();
  }

  addToken(token: Token) {
    if (!this.gameState) {
      return;
    }

    if (!this.gameState.tokens) {
      this.gameState.tokens = {};
    }

    this.gameState.tokens[token.id] = token;

    // Clear any existing selection after adding a token
    this.clearSelection();
    this.render();
  }

  // Public method to clear token selection
  clearSelection(): void {
    if (this.selectedToken) {
      this.selectedToken = null;
      this.clickToMoveMode = false;
      this.hoverGridPosition = null;
      this.emit("token-deselect");
    }
  }

  // Public method to get current game state
  getGameState(): GameState | undefined {
    return this.gameState;
  }

  getCurrentGridPosition(): { x: number; y: number } {
    // Get the center of the viewport
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Convert to grid coordinates
    return this.screenToGrid(centerX, centerY);
  }

  // Keyboard navigation
  private handleKeyDown(e: KeyboardEvent) {
    const PAN_SPEED = 20;
    const ZOOM_SPEED = 0.1;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        this.clearSelection();
        this.render();
        break;
      case "Delete":
      case "Backspace":
        if (this.selectedToken && !this.isInputFocused()) {
          e.preventDefault();
          this.emit("token-delete-request", {
            tokenId: this.selectedToken.id,
            tokenName: this.selectedToken.name,
          });
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.offset.x += PAN_SPEED;
        this.render();
        this.announcePosition();
        break;
      case "ArrowRight":
        e.preventDefault();
        this.offset.x -= PAN_SPEED;
        this.render();
        this.announcePosition();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.offset.y += PAN_SPEED;
        this.render();
        this.announcePosition();
        break;
      case "ArrowDown":
        e.preventDefault();
        this.offset.y -= PAN_SPEED;
        this.render();
        this.announcePosition();
        break;
      case "+":
      case "=":
        e.preventDefault();
        this.scale = Math.min(4, this.scale * (1 + ZOOM_SPEED));
        this.render();
        this.announceZoom();
        break;
      case "-":
        e.preventDefault();
        this.scale = Math.max(0.8, this.scale * (1 - ZOOM_SPEED));
        this.render();
        this.announceZoom();
        break;
      case "Tab":
        // Allow tab to move focus out of canvas
        break;
      case "Enter":
      case " ":
        // Could be used to interact with selected token
        if (this.selectedToken) {
          e.preventDefault();
          this.announceToken(this.selectedToken);
        }
        break;
    }
  }

  private announcePosition(): void {
    const gridX = Math.floor(-this.offset.x / this.scale / this.gridSize);
    const gridY = Math.floor(-this.offset.y / this.scale / this.gridSize);
    this.announce(`Grid position: ${gridX}, ${gridY}`);
  }

  private announceZoom(): void {
    this.announce(`Zoom: ${Math.round(this.scale * 100)}%`);
  }

  private announceToken(token: Token): void {
    this.announce(`Selected token: ${token.name} at position ${token.x}, ${token.y}`);
  }

  private announce(text: string): void {
    // Create a live region announcement for screen readers
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "visually-hidden";
    announcement.textContent = text;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => announcement.remove(), 1000);
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return (
      activeElement?.tagName === "INPUT" ||
      activeElement?.tagName === "TEXTAREA" ||
      activeElement?.classList.contains("chat-input") ||
      false
    );
  }

  private drawHoverPreview(): void {
    if (!this.clickToMoveMode || !this.selectedToken || !this.hoverGridPosition) return;

    const x = this.hoverGridPosition.x * this.gridSize;
    const y = this.hoverGridPosition.y * this.gridSize;
    const sizeMultiplier = this.selectedToken.size || 1;
    const actualSize = this.gridSize * sizeMultiplier;

    this.ctx.save();

    // Draw semi-transparent preview square
    this.ctx.fillStyle = `${this.selectedToken.color}20`;
    this.ctx.fillRect(x, y, actualSize, actualSize);

    // Draw dashed border
    this.ctx.strokeStyle = `${this.selectedToken.color}60`;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(x, y, actualSize, actualSize);
    this.ctx.setLineDash([]);

    this.ctx.restore();
  }

  private drawPreviewToken() {
    if (!this.selectedToken || !this.cursorPosition) return;

    const cursorPos = this.cursorPosition;
    const sizeMultiplier = this.selectedToken.size || 1;
    const actualSize = this.gridSize * sizeMultiplier;
    const radius = actualSize / 2 - 4;

    // Draw a more visible preview with border at cursor position
    this.ctx.save();

    // Reset any transformations to draw in screen coordinates
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw shadow/glow effect
    this.ctx.shadowColor = this.selectedToken.color;
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = `${this.selectedToken.color}20`;
    this.ctx.beginPath();
    this.ctx.arc(cursorPos.x, cursorPos.y, radius + 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw semi-transparent background
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = `${this.selectedToken.color}40`;
    this.ctx.beginPath();
    this.ctx.arc(cursorPos.x, cursorPos.y, radius + 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw main preview
    this.ctx.fillStyle = `${this.selectedToken.color}70`;
    this.ctx.beginPath();
    this.ctx.arc(cursorPos.x, cursorPos.y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw border
    this.ctx.strokeStyle = `${this.selectedToken.color}90`;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.restore();
  }
}
