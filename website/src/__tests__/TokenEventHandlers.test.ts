import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameEventHandlers } from "../events/GameEventHandlers";

// Mock dependencies
vi.mock("../services/network/GameClient");
vi.mock("../canvas/GameCanvas");
vi.mock("../components/UIManager");

describe("Token Event Handlers", () => {
  let eventHandlers: GameEventHandlers;
  let mockClient: any;
  let mockCanvas: any;
  let mockUI: any;
  const roomId = "test-room";

  beforeEach(() => {
    mockClient = {
      on: vi.fn(),
      sendMessage: vi.fn(),
    };

    mockCanvas = {
      on: vi.fn(),
      addToken: vi.fn(),
      moveToken: vi.fn(),
      setGameState: vi.fn(),
      render: vi.fn(),
    };

    mockUI = {
      onChatMessage: vi.fn(),
      onAddToken: vi.fn(),
      showError: vi.fn(),
      updatePlayerList: vi.fn(),
      setRoomInfo: vi.fn(),
      setCurrentPlayer: vi.fn(),
      addChatMessage: vi.fn(),
    };

    eventHandlers = new GameEventHandlers(
      mockClient as any,
      mockCanvas as any,
      mockUI as any,
      roomId,
    );
  });

  describe("UI Events Setup", () => {
    it("should setup add token event handler", () => {
      eventHandlers.setupUIEvents();
      expect(mockUI.onAddToken).toHaveBeenCalled();
    });

    it("should send add-token message with idempotency key", () => {
      // First simulate that the user has joined
      eventHandlers.setupClientEvents();
      const joinedCall = mockClient.on.mock.calls.find((call: any[]) => call[0] === "joined");
      const joinedCallback = joinedCall[1];

      // Trigger joined event to set hasJoined = true
      joinedCallback({
        playerId: "test-player",
        state: { players: {}, tokens: {} },
      });

      eventHandlers.setupUIEvents();

      // Get the callback passed to onAddToken
      const addTokenCallback = mockUI.onAddToken.mock.calls[0][0];

      const tokenData = {
        name: "Test Token",
        x: 100,
        y: 200,
        color: "#FF6B6B",
        hp: 50,
        maxHp: 100,
      };

      addTokenCallback(tokenData);

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        type: "add-token",
        ...tokenData,
        idempotencyKey: expect.any(String),
      });
    });
  });

  describe("Token Event Handling", () => {
    it("should handle token-added event", () => {
      // Setup event handlers
      eventHandlers.setupClientEvents();

      // Get the callback for token-added
      const tokenAddedCall = mockClient.on.mock.calls.find(
        (call: any[]) => call[0] === "token-added",
      );
      const tokenAddedCallback = tokenAddedCall[1];

      const tokenData = {
        token: {
          id: "token-123",
          name: "Test Token",
          x: 100,
          y: 200,
          color: "#FF6B6B",
        },
      };

      tokenAddedCallback(tokenData);

      expect(mockCanvas.addToken).toHaveBeenCalledWith(tokenData.token);
    });

    it("should handle token-moved event", () => {
      // Setup event handlers
      eventHandlers.setupClientEvents();

      // Get the callback for token-moved
      const tokenMovedCall = mockClient.on.mock.calls.find(
        (call: any[]) => call[0] === "token-moved",
      );
      const tokenMovedCallback = tokenMovedCall[1];

      const moveData = {
        tokenId: "token-123",
        x: 300,
        y: 400,
        playerId: "player-456",
      };

      tokenMovedCallback(moveData);

      expect(mockCanvas.moveToken).toHaveBeenCalledWith(moveData.tokenId, moveData.x, moveData.y);
    });
  });

  describe("Canvas Events Setup", () => {
    it("should setup token-move event handler", () => {
      eventHandlers.setupCanvasEvents();
      expect(mockCanvas.on).toHaveBeenCalledWith("token-move", expect.any(Function));
    });

    it("should send move-token message when canvas emits token-move", () => {
      // First simulate that the user has joined
      eventHandlers.setupClientEvents();
      const joinedCall = mockClient.on.mock.calls.find((call: any[]) => call[0] === "joined");
      const joinedCallback = joinedCall[1];

      // Trigger joined event to set hasJoined = true
      joinedCallback({
        playerId: "test-player",
        state: { players: {}, tokens: {} },
      });

      eventHandlers.setupCanvasEvents();

      // Get the callback passed to canvas.on
      const tokenMoveCallback = mockCanvas.on.mock.calls[0][1];

      const moveData = {
        tokenId: "token-123",
        x: 150,
        y: 250,
      };

      tokenMoveCallback(moveData);

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        type: "move-token",
        tokenId: moveData.tokenId,
        x: moveData.x,
        y: moveData.y,
        idempotencyKey: expect.any(String),
      });
    });
  });

  describe("State Updates", () => {
    it("should update canvas when receiving state with tokens", () => {
      // Setup event handlers
      eventHandlers.setupClientEvents();

      // Get the callback for state-update
      const stateUpdateCall = mockClient.on.mock.calls.find(
        (call: any[]) => call[0] === "state-update",
      );
      const stateUpdateCallback = stateUpdateCall[1];

      const stateData = {
        state: {
          tokens: {
            "token-1": { id: "token-1", name: "Token 1", x: 100, y: 100 },
            "token-2": { id: "token-2", name: "Token 2", x: 200, y: 200 },
          },
          players: {
            "player-1": { id: "player-1", name: "Player 1" },
          },
        },
      };

      stateUpdateCallback(stateData);

      expect(mockCanvas.setGameState).toHaveBeenCalledWith(stateData.state);
      expect(mockCanvas.render).toHaveBeenCalled();
    });
  });
});
