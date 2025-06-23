export class ConnectionStatus {
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  public setStatus(connected: boolean, message: string): void {
    this.element.textContent = message;
    this.element.classList.remove("connected", "disconnected");
    this.element.classList.add(connected ? "connected" : "disconnected");
  }

  public setConnected(): void {
    this.setStatus(true, "Connected");
  }

  public setDisconnected(): void {
    this.setStatus(false, "Disconnected");
  }

  public setReconnecting(): void {
    this.setStatus(false, "Reconnecting...");
  }

  public setOffline(): void {
    this.setStatus(false, "Offline");
  }
}
