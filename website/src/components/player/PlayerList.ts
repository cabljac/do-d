import type { Player } from "../../types";

export class PlayerList {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public setCurrentPlayerId(_playerId: string): void {
    // This method is called but the value isn't used in the current implementation
    // Could be used for highlighting the current player in the future
  }

  public updatePlayers(players: Record<string, Player>): void {
    console.log("PlayerList.updatePlayers called with:", players);
    this.container.innerHTML = "";

    if (!players) return;

    Object.values(players).forEach((player) => {
      // Skip disconnected players - they should be hidden, not shown as offline
      if (player.connectionStatus === "disconnected") {
        return;
      }

      const playerEl = document.createElement("div");
      playerEl.className = "player-item";

      playerEl.innerHTML = `
        <span class="player-indicator" style="background-color: ${player.color}"></span>
        <span class="player-name">${this.escapeHtml(player.name)}</span>
        ${player.isGM ? '<span class="gm-badge">GM</span>' : ""}
      `;

      this.container.appendChild(playerEl);
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  public clear(): void {
    this.container.innerHTML = "";
  }
}
