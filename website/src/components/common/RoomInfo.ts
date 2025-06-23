export class RoomInfo {
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  public setRoomInfo(roomId: string, playerCount: number): void {
    this.element.innerHTML = `
      Room: <code>${this.escapeHtml(roomId)}</code> | 
      Players: ${playerCount}
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  public clear(): void {
    this.element.innerHTML = "";
  }
}
