import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSavedPlayerId, savePlayerId } from "../managers/PlayerManager";
import { GameClient } from "../services/network/GameClient";
import type { JoinedResponse } from "../types";

describe("Reconnection and Duplicate Player Prevention", () => {
  let client: GameClient;
  let websocketInstances: any[] = [];

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    websocketInstances = [];

    // Create a simple WebSocket mock that works with happy-dom
    const MockWebSocket = function (this: any, url: string) {
      this.readyState = 0;
      this.url = url;
      this.send = vi.fn();
      this.close = vi.fn();
      this.addEventListener = vi.fn();
      this.removeEventListener = vi.fn();
      this.dispatchEvent = vi.fn();
      this.onopen = null;
      this.onmessage = null;
      this.onclose = null;
      this.onerror = null;
      websocketInstances.push(this);
    } as any;

    // Add static properties
    MockWebSocket.CONNECTING = 0;
    MockWebSocket.OPEN = 1;
    MockWebSocket.CLOSING = 2;
    MockWebSocket.CLOSED = 3;

    // Mock WebSocket globally
    global.WebSocket = MockWebSocket;

    client = new GameClient();
  });

  afterEach(() => {
    if (client) {
      client.disconnect();
    }
  });

  const waitForConnection = async () => {
    // Wait for promises to resolve and timers to execute
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Allow any pending promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  const getLastWebSocket = () => websocketInstances[websocketInstances.length - 1];

  const triggerWebSocketOpen = (ws: any) => {
    // Simulate WebSocket opening
    ws.readyState = WebSocket.OPEN;
    if (ws.onopen) {
      ws.onopen(new Event("open"));
    }
  };

  const simulateWebSocketMessage = (ws: any, message: JoinedResponse | Record<string, unknown>) => {
    if (ws.onmessage) {
      ws.onmessage(
        new MessageEvent("message", {
          data: JSON.stringify(message),
        }),
      );
    }
  };

  const closeWebSocket = (ws: any) => {
    ws.readyState = WebSocket.CLOSED;
    if (ws.onclose) {
      ws.onclose(new CloseEvent("close"));
    }
  };

  describe("GameClient reconnection", () => {
    it("should send existing player ID when reconnecting", async () => {
      const roomId = "test-room-123";
      const playerName = "Jacob";
      const existingPlayerId = "player-456";

      savePlayerId(roomId, existingPlayerId);

      client.connect(roomId, playerName, existingPlayerId);

      const ws = getLastWebSocket();
      triggerWebSocketOpen(ws);

      await waitForConnection();

      // Check that the join message was sent with the existing player ID
      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "join",
          name: playerName,
          playerId: existingPlayerId,
        }),
      );
    });

    it("should not send player ID for new connections", async () => {
      const roomId = "test-room-123";
      const playerName = "Jacob";

      client.connect(roomId, playerName);

      const ws = getLastWebSocket();
      triggerWebSocketOpen(ws);

      await waitForConnection();

      // Check that the join message was sent without player ID
      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "join",
          name: playerName,
          playerId: undefined,
        }),
      );
    });

    it("should handle reconnection after disconnect", async () => {
      const roomId = "test-room-123";
      const playerName = "Jacob";
      const playerId = "player-789";

      websocketInstances = [];

      client.connect(roomId, playerName, playerId);

      const ws1 = getLastWebSocket();
      triggerWebSocketOpen(ws1);
      await waitForConnection();

      simulateWebSocketMessage(ws1, {
        type: "joined",
        playerId: playerId,
        state: { players: {} },
      });

      savePlayerId(roomId, playerId);

      expect(getSavedPlayerId(roomId)).toBe(playerId);

      closeWebSocket(ws1);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      // The GameClient will attempt reconnection
      expect(websocketInstances.length).toBeGreaterThan(1);

      const ws2 = websocketInstances[1];
      triggerWebSocketOpen(ws2);
      await waitForConnection();

      // Check that reconnection includes the saved player ID
      expect(ws2.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "join",
          name: "Jacob",
          playerId: playerId,
        }),
      );
    });
  });

  describe("Player ID consistency", () => {
    it("should maintain same player ID across reconnections", async () => {
      const roomId = "test-room-456";
      const playerName = "Jacob";
      const playerId = "player-consistent-123";

      client.connect(roomId, playerName, playerId);

      const ws1 = getLastWebSocket();
      triggerWebSocketOpen(ws1);
      await waitForConnection();

      simulateWebSocketMessage(ws1, {
        type: "joined",
        playerId: playerId,
        state: { players: {} },
      });

      savePlayerId(roomId, playerId);

      expect(getSavedPlayerId(roomId)).toBe(playerId);

      closeWebSocket(ws1);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const ws2 = getLastWebSocket();
      triggerWebSocketOpen(ws2);
      await waitForConnection();

      expect(ws2.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "join",
          name: "Jacob",
          playerId: playerId,
        }),
      );
    });

    it("should handle multiple rooms without ID conflicts", async () => {
      const room1 = "room-1";
      const room2 = "room-2";
      const playerName = "Jacob";
      const playerId1 = "player-room1";
      const playerId2 = "player-room2";

      // Connect to room 1
      client.connect(room1, playerName, playerId1);

      const ws1 = getLastWebSocket();
      triggerWebSocketOpen(ws1);
      await waitForConnection();

      simulateWebSocketMessage(ws1, {
        type: "joined",
        playerId: playerId1,
        state: { players: {} },
      });

      // Manually save player ID as GameEventHandlers would do
      savePlayerId(room1, playerId1);

      expect(getSavedPlayerId(room1)).toBe(playerId1);

      // Disconnect from room 1
      client.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Create new client for room 2
      const client2 = new GameClient();
      client2.connect(room2, playerName, playerId2);

      const ws2 = getLastWebSocket();
      triggerWebSocketOpen(ws2);
      await waitForConnection();

      simulateWebSocketMessage(ws2, {
        type: "joined",
        playerId: playerId2,
        state: { players: {} },
      });

      // Manually save player ID as GameEventHandlers would do
      savePlayerId(room2, playerId2);

      // Should have different player IDs for different rooms
      expect(getSavedPlayerId(room1)).toBe(playerId1);
      expect(getSavedPlayerId(room2)).toBe(playerId2);

      client2.disconnect();
    });
  });
});
