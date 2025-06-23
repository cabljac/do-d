import type { GameCanvas } from "../canvas/GameCanvas";
import type { UIManager } from "../components/UIManager";
import { savePlayerId } from "../managers/PlayerManager";
import type { GameClient } from "../services/network/GameClient";
import type {
  ChatMessageResponse,
  ErrorResponse,
  JoinedResponse,
  PlayerJoinedResponse,
  PlayerLeftResponse,
  StateUpdateResponse,
  TokenAddedResponse,
  TokenFormDataWithPosition,
  TokenMoveData,
  TokenMovedResponse,
} from "../types";
export class GameEventHandlers {
  private hasJoined = false;

  constructor(
    private client: GameClient,
    private canvas: GameCanvas,
    private ui: UIManager,
    private roomId: string,
  ) {}

  setupClientEvents(): void {
    this.client.on("connected", this.handleConnected.bind(this));
    this.client.on("disconnected", this.handleDisconnected.bind(this));
    this.client.on("joined", this.handleJoined.bind(this));
    this.client.on("state-update", this.handleStateUpdate.bind(this));
    this.client.on("chat-message", this.handleChatMessage.bind(this));
    this.client.on("player-joined", this.handlePlayerJoined.bind(this));
    this.client.on("player-left", this.handlePlayerLeft.bind(this));
    this.client.on("token-moved", this.handleTokenMoved.bind(this));
    this.client.on("token-added", this.handleTokenAdded.bind(this));
    this.client.on("error", this.handleError.bind(this));
  }

  setupCanvasEvents(): void {
    this.canvas.on("token-move", (data: TokenMoveData) => {
      if (!this.hasJoined) {
        console.log("Cannot move token - not yet joined");
        return;
      }
      this.client.sendMessage({
        type: "move-token",
        tokenId: data.tokenId,
        x: data.x,
        y: data.y,
        idempotencyKey: crypto.randomUUID(),
      });
    });

    this.canvas.on("token-select", (data: { tokenId: string }) => {
      // Token selection is now handled visually on the canvas
      console.log("Token selected:", data.tokenId);
    });

    this.canvas.on("token-deselect", () => {
      // Token deselection is now handled visually on the canvas
      console.log("Token deselected");
    });
  }

  setupUIEvents(): void {
    this.ui.onChatMessage((text: string) => {
      if (!this.hasJoined) {
        console.log("Cannot send chat - not yet joined");
        return;
      }
      console.log("GameEventHandlers: Sending chat message:", text);
      this.client.sendMessage({
        type: "chat",
        text,
        idempotencyKey: crypto.randomUUID(),
      });
    });

    this.ui.onAddToken((tokenData: TokenFormDataWithPosition) => {
      console.log("GameEventHandlers: onAddToken called with:", tokenData);
      console.log("GameEventHandlers: hasJoined status:", this.hasJoined);

      // Validate token data
      if (!tokenData.name || tokenData.name.trim() === "") {
        console.log("GameEventHandlers: Token name is empty, not sending message");
        this.ui.showError("Token name is required");
        return;
      }

      if (!this.hasJoined) {
        console.log("Cannot add token - not yet joined");
        this.ui.showError("Please wait until you have joined the room");
        return;
      }

      console.log("GameEventHandlers: Sending add-token message");
      this.client.sendMessage({
        type: "add-token",
        ...tokenData,
        idempotencyKey: crypto.randomUUID(),
      });
    });
  }

  private handleConnected(): void {
    this.ui.setConnectionStatus(true, "Connected");
  }

  private handleDisconnected(): void {
    this.ui.setConnectionStatus(false, "Disconnected");
    this.hasJoined = false;
    console.log("User disconnected, resetting join status");
  }

  private handleJoined(data: JoinedResponse): void {
    this.ui.setCurrentPlayer(data.playerId);
    this.ui.setRoomInfo(
      this.roomId,
      data.state.players ? Object.keys(data.state.players).length : 0,
    );
    this.ui.updatePlayerList(data.state.players);

    savePlayerId(this.roomId, data.playerId);

    this.canvas.setGameState(data.state);
    this.canvas.render();

    if (data.chatHistory) {
      data.chatHistory.forEach((msg) => this.ui.addChatMessage(msg));
    }

    this.hasJoined = true;
    console.log("User has successfully joined the room");
  }

  private handleStateUpdate(data: StateUpdateResponse): void {
    console.log("Received state-update:", data);
    this.canvas.setGameState(data.state);
    this.canvas.render();
    this.ui.updatePlayerList(data.state.players);
    this.ui.setRoomInfo(
      this.roomId,
      data.state.players ? Object.keys(data.state.players).length : 0,
    );
  }

  private handleChatMessage(data: ChatMessageResponse): void {
    this.ui.addChatMessage(data.message);
  }

  private handlePlayerJoined(data: PlayerJoinedResponse): void {
    this.ui.showError(`${data.player.name} joined the game`);
    // Player will be added via the state-update event that follows
  }

  private handlePlayerLeft(data: PlayerLeftResponse): void {
    this.ui.showError(`${data.playerName || "A player"} left the game`);
  }

  private handleTokenMoved(data: TokenMovedResponse): void {
    this.canvas.moveToken(data.tokenId, data.x, data.y);
  }

  private handleTokenAdded(data: TokenAddedResponse): void {
    console.log("Frontend received token-added event:", data);
    this.canvas.addToken(data.token);
  }

  private handleError(data: ErrorResponse): void {
    console.log("Received error:", data);

    if (data.message === "Invalid room password") {
      // Prompt for password
      const password = prompt("This room requires a password:");
      if (password !== null) {
        // Store the password and reconnect
        sessionStorage.setItem(`room-${this.roomId}-password`, password);
        // Disconnect and reconnect with the new password
        window.location.reload();
      } else {
        // User cancelled, go back to lobby
        window.location.href = "/";
      }
    } else if (data.message.includes("Not authenticated") || data.code === "AUTH_REQUIRED") {
      // Authentication error - try to reconnect
      console.log("Authentication error detected, attempting reconnection");
      this.hasJoined = false;
      this.ui.showError("Connection lost. Attempting to reconnect...");

      // The client will handle reconnection automatically
    } else {
      this.ui.showError(data.message);
    }
  }
}
