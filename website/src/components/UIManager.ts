import type { GameCanvas } from "../canvas/GameCanvas";
import type { ChatMessage, Player, TokenFormDataWithPosition } from "../types";
import { ChatBox } from "./chat/ChatBox";
import { ConnectionStatus } from "./common/ConnectionStatus";
import { RoomInfo } from "./common/RoomInfo";
import { Toast } from "./common/Toast";
import { PlayerList } from "./player/PlayerList";
import { TokenControls } from "./token/TokenControls";

export class UIManager {
  private chatBox: ChatBox;
  private playerList: PlayerList;
  private tokenControls: TokenControls;
  private connectionStatus: ConnectionStatus;
  private roomInfo: RoomInfo;
  private toast: Toast;
  private playerColors: Map<string, string> = new Map();

  constructor() {
    // Initialize components
    this.chatBox = new ChatBox(document.getElementById("chat")!);
    this.playerList = new PlayerList(document.getElementById("player-list")!);
    this.tokenControls = new TokenControls(document.getElementById("token-controls")!);
    this.connectionStatus = new ConnectionStatus(document.getElementById("connection-status")!);
    this.roomInfo = new RoomInfo(document.getElementById("room-info")!);
    this.toast = Toast.getInstance();
  }

  // Chat methods
  public onChatMessage(callback: (text: string) => void): void {
    this.chatBox.onMessage(callback);
  }

  public addChatMessage(message: ChatMessage): void {
    this.chatBox.addMessage(message, this.playerColors);
  }

  // Player methods
  public setCurrentPlayer(playerId: string): void {
    this.chatBox.setCurrentPlayerId(playerId);
    this.playerList.setCurrentPlayerId(playerId);
  }

  public updatePlayerList(players: Record<string, Player>): void {
    if (!players) return;

    // Update player colors cache
    Object.values(players).forEach((player) => {
      this.playerColors.set(player.id, player.color);
    });

    this.playerList.updatePlayers(players);
  }

  // Connection methods
  public setConnectionStatus(connected: boolean, message: string): void {
    this.connectionStatus.setStatus(connected, message);
  }

  // Room methods
  public setRoomInfo(roomId: string, playerCount: number): void {
    this.roomInfo.setRoomInfo(roomId, playerCount);
  }

  // Error/notification methods
  public showError(message: string): void {
    this.toast.show(message);
  }

  // Token methods
  public onAddToken(callback: (tokenData: TokenFormDataWithPosition) => void): void {
    this.tokenControls.onAddToken(callback);
  }

  public setCanvas(canvas: GameCanvas): void {
    this.tokenControls.setCanvas(canvas);
  }

  // Utility methods
  public focusChat(): void {
    this.chatBox.focus();
  }

  public clearAll(): void {
    this.chatBox.clear();
    this.playerList.clear();
    this.roomInfo.clear();
    this.tokenControls.clear();
    this.playerColors.clear();
  }
}
