import type { GameCanvas } from "../canvas/GameCanvas";
import type { UIManager } from "../components/UIManager";
import { GameEventHandlers } from "../events/GameEventHandlers";
import { GameClient } from "../services/network/GameClient";
import { getPlayerName, getSavedPlayerId } from "./PlayerManager";
import { redirectToLobby } from "./RoomManager";

const REDIRECT_DELAY = 2000;

export class GameManager {
  constructor(
    private ui: UIManager,
    private canvas: GameCanvas,
  ) {}

  async joinRoom(roomId: string): Promise<void> {
    document.getElementById("lobby")!.style.display = "none";
    document.getElementById("game")!.style.display = "grid";

    setTimeout(() => {
      this.canvas.resize();
    }, 0);

    const playerName = getPlayerName();

    const client = new GameClient();
    const eventHandlers = new GameEventHandlers(client, this.canvas, this.ui, roomId);

    this.ui.setCanvas(this.canvas);

    eventHandlers.setupClientEvents();
    eventHandlers.setupCanvasEvents();
    eventHandlers.setupUIEvents();

    try {
      const existingPlayerId = getSavedPlayerId(roomId);
      const password = sessionStorage.getItem(`room-${roomId}-password`) || undefined;
      await client.connect(roomId, playerName, existingPlayerId, password);
    } catch (_error) {
      this.ui.showError("Failed to connect to game");
      setTimeout(() => {
        redirectToLobby();
      }, REDIRECT_DELAY);
    }
  }
}
