// frontend/src/network/GameClient.ts

import type { ClientMessage, GameClientEventMap } from "../../types";
import { EventEmitter } from "./EventEmitter";

export class GameClient extends EventEmitter<GameClientEventMap> {
  private ws?: WebSocket;
  private roomId?: string;
  private playerName?: string;
  private password?: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isAuthenticated = false;
  private messageQueue: ClientMessage[] = [];
  private heartbeatInterval?: number;
  private lastHeartbeat = 0;

  async connect(roomId: string, playerName: string, existingPlayerId?: string, password?: string) {
    this.roomId = roomId;
    this.playerName = playerName;
    this.password = password;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost" ? "localhost:8787" : window.location.host;
    const url = `${protocol}//${host}/room/${roomId}/ws`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit("connected");

      // Send join message
      this.sendMessage({
        type: "join",
        name: playerName,
        playerId: existingPlayerId,
        password: password,
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Set authentication status when joined
        if (data.type === "joined") {
          this.isAuthenticated = true;
          console.log("User authenticated, processing queued messages:", this.messageQueue.length);
          // Process any queued messages
          while (this.messageQueue.length > 0) {
            const queuedMessage = this.messageQueue.shift();
            if (queuedMessage) {
              this.sendMessage(queuedMessage);
            }
          }
          // Start heartbeat
          this.startHeartbeat();
        }

        // Update heartbeat timestamp for any message (including pong)
        this.lastHeartbeat = Date.now();

        this.emit(data.type, data);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      this.isAuthenticated = false;
      this.messageQueue = [];
      this.stopHeartbeat();
      this.emit("disconnected");

      // Only attempt reconnection if it wasn't a deliberate close
      if (event.code !== 1000) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.emit("error", { type: "error", message: "Connection error" });
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit("error", {
        type: "error",
        message: "Failed to reconnect after multiple attempts",
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * 2 ** (this.reconnectAttempts - 1);

    console.log(
      `Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
    );

    setTimeout(() => {
      if (this.roomId && this.playerName) {
        // Close existing connection if it exists
        if (this.ws) {
          this.ws.close();
        }

        this.connect(
          this.roomId,
          this.playerName,
          sessionStorage.getItem(`room-${this.roomId}-playerId`) || undefined,
          this.password,
        );
      }
    }, delay);
  }

  sendMessage(message: ClientMessage) {
    console.log(
      "GameClient.sendMessage:",
      message,
      "WebSocket state:",
      this.ws?.readyState,
      "Authenticated:",
      this.isAuthenticated,
    );

    // Allow join messages to be sent immediately
    if (message.type === "join") {
      console.log("GameClient: Sending join message immediately");
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        console.error("WebSocket not connected, state:", this.ws?.readyState);
      }
      return;
    }

    // Queue other messages if not authenticated
    if (!this.isAuthenticated) {
      console.log("GameClient: Not authenticated, queuing message:", message.type);
      this.messageQueue.push(message);
      console.log("GameClient: Current queue length:", this.messageQueue.length);
      return;
    }

    console.log("GameClient: Sending authenticated message:", message.type);
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error("Failed to send message, connection may be lost:", error);
        // If sending fails, queue the message and attempt reconnection
        this.messageQueue.push(message);
        this.isAuthenticated = false;
        this.attemptReconnect();
      }
    } else {
      console.error("WebSocket not connected, state:", this.ws?.readyState);
      // Queue the message and attempt reconnection
      this.messageQueue.push(message);
      this.isAuthenticated = false;
      this.attemptReconnect();
    }
  }

  disconnect() {
    this.isAuthenticated = false;
    this.messageQueue = [];
    this.stopHeartbeat();
    this.ws?.close(1000, "User disconnected");
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  getConnectionState(): {
    connected: boolean;
    authenticated: boolean;
    readyState: number | undefined;
  } {
    return {
      connected: this.ws?.readyState === WebSocket.OPEN,
      authenticated: this.isAuthenticated,
      readyState: this.ws?.readyState,
    };
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.lastHeartbeat = Date.now();

    this.heartbeatInterval = window.setInterval(() => {
      const now = Date.now();
      // If no message received in 30 seconds, consider connection dead
      if (now - this.lastHeartbeat > 30000) {
        console.log("Heartbeat timeout, connection appears dead");
        this.isAuthenticated = false;
        this.attemptReconnect();
        return;
      }

      // Send ping if connected
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          console.error("Failed to send heartbeat ping:", error);
          this.isAuthenticated = false;
          this.attemptReconnect();
        }
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }
}
