import type { ChatMessage } from "../../types";
import { DiceDisplay } from "../dice/DiceDisplay";

export class ChatBox {
  private messagesContainer: HTMLElement;
  private inputElement: HTMLInputElement;
  private onSendMessage?: (text: string) => void;
  private currentPlayerId?: string;
  private diceDisplay: DiceDisplay;
  private processedMessageIds: Set<string> = new Set();

  constructor(container: HTMLElement) {
    this.messagesContainer = container.querySelector("#chat-messages")!;
    this.inputElement = container.querySelector("#chat-input") as HTMLInputElement;
    this.diceDisplay = new DiceDisplay();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.inputElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const text = this.inputElement.value.trim();
        if (text && this.onSendMessage) {
          this.onSendMessage(text);
          this.inputElement.value = "";
        }
      }
    });

    // Auto-focus chat on / key
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== this.inputElement) {
        e.preventDefault();
        this.inputElement.focus();
      }
    });
  }

  public setCurrentPlayerId(playerId: string): void {
    this.currentPlayerId = playerId;
  }

  public onMessage(callback: (text: string) => void): void {
    this.onSendMessage = callback;
  }

  public addMessage(message: ChatMessage, playerColors: Map<string, string>): void {
    // Check for duplicate messages
    if (this.processedMessageIds.has(message.id)) {
      console.log("Skipping duplicate message:", message.id);
      return;
    }
    this.processedMessageIds.add(message.id);

    // Clean up old message IDs to prevent memory leak (keep last 1000)
    if (this.processedMessageIds.size > 1000) {
      const idsArray = Array.from(this.processedMessageIds);
      const toRemove = idsArray.slice(0, idsArray.length - 900);
      toRemove.forEach((id) => this.processedMessageIds.delete(id));
    }

    const messageEl = document.createElement("div");
    messageEl.className = "chat-message";

    if (message.whisperTo?.length) {
      messageEl.classList.add("whisper");
    }

    const time = new Date(message.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const playerColor = playerColors.get(message.playerId) || "#ffffff";

    let content = `
      <div class="message-header">
        <span class="player-name" style="color: ${playerColor}">
          ${this.escapeHtml(message.playerName)}
        </span>
        <span class="message-time" aria-label="Sent at ${time}">${time}</span>
      </div>
      <div class="message-content">
        ${this.escapeHtml(message.text)}
      </div>
    `;

    // Add screen reader announcement for new messages
    this.announceMessage(message);

    if (message.roll) {
      content += this.diceDisplay.formatDiceRoll(message.roll);
    }

    messageEl.innerHTML = content;
    this.messagesContainer.appendChild(messageEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    if (message.playerId !== this.currentPlayerId) {
      this.playMessageSound();
    }
  }

  private playMessageSound(): void {
    // Optional: Play a notification sound
    // Could be implemented later with an audio element
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  public clear(): void {
    this.messagesContainer.innerHTML = "";
    this.processedMessageIds.clear();
  }

  public focus(): void {
    this.inputElement.focus();
  }

  public sendMessage(text: string): void {
    if (text && this.onSendMessage) {
      this.onSendMessage(text);
    }
  }

  private announceMessage(message: ChatMessage): void {
    // Create a live region announcement for screen readers
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "visually-hidden";
    announcement.textContent = `${message.playerName} says: ${message.text}`;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => announcement.remove(), 1000);
  }
}
