import { GameCanvas } from "../canvas/GameCanvas";
import { UIManager } from "../components/UIManager";
import { GameManager } from "../managers/GameManager";
import { LobbyManager } from "../managers/LobbyManager";
import { getRoomIdFromURL } from "../managers/RoomManager";
import { addSkipLinks, initA11y } from "../utils/accessibility";

export class App {
  private ui: UIManager;
  private canvas: GameCanvas;
  private lobbyManager: LobbyManager;
  private gameManager: GameManager;

  constructor() {
    this.ui = new UIManager();
    this.canvas = new GameCanvas(document.getElementById("game-canvas") as HTMLCanvasElement);
    this.lobbyManager = new LobbyManager(this.ui);
    this.gameManager = new GameManager(this.ui, this.canvas);
  }

  setupGlobalListeners(): void {
    window.addEventListener("online", () => {
      this.ui.setConnectionStatus(false, "Reconnecting...");
    });

    window.addEventListener("beforeunload", (e) => {
      const roomId = getRoomIdFromURL();
      if (roomId) {
        e.preventDefault();
        return "";
      }
    });
  }

  async init(): Promise<void> {
    // Initialize accessibility features
    initA11y();
    addSkipLinks();

    this.setupGlobalListeners();

    const roomId = getRoomIdFromURL();
    if (!roomId) {
      this.lobbyManager.show();
    } else {
      await this.gameManager.joinRoom(roomId);
    }
  }
}
