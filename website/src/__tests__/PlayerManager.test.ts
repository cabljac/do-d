import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlayerName, getSavedPlayerId, savePlayerId } from "../managers/PlayerManager";

// Mock window.prompt
global.prompt = vi.fn();

describe("PlayerManager", () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe("getPlayerName", () => {
    it("should return stored player name if exists", () => {
      localStorage.setItem("playerName", "TestPlayer");
      expect(getPlayerName()).toBe("TestPlayer");
    });

    it("should prompt for name if no stored name and save it", () => {
      (global.prompt as any).mockReturnValue("NewPlayer");

      const name = getPlayerName();

      expect(name).toBe("NewPlayer");
      expect(localStorage.getItem("playerName")).toBe("NewPlayer");
      expect(global.prompt).toHaveBeenCalledWith("Enter your name:");
    });

    it("should use default name if prompt is cancelled", () => {
      (global.prompt as any).mockReturnValue(null);

      const name = getPlayerName();

      expect(name).toBe("Anonymous");
      expect(localStorage.getItem("playerName")).toBe("Anonymous");
    });
  });

  describe("getSavedPlayerId", () => {
    it("should return stored player ID for a room", () => {
      const roomId = "test-room-123";
      const playerId = "player-456";
      sessionStorage.setItem(`room-${roomId}-playerId`, playerId);

      expect(getSavedPlayerId(roomId)).toBe(playerId);
    });

    it("should return undefined if no player ID stored for room", () => {
      expect(getSavedPlayerId("unknown-room")).toBeUndefined();
    });
  });

  describe("savePlayerId", () => {
    it("should store player ID for a specific room", () => {
      const roomId = "test-room-789";
      const playerId = "player-012";

      savePlayerId(roomId, playerId);

      expect(sessionStorage.getItem(`room-${roomId}-playerId`)).toBe(playerId);
    });
  });

  describe("duplicate player prevention", () => {
    it("should maintain consistent player ID across reconnections", () => {
      const roomId = "test-room-duplicate";
      const playerId = "player-consistent-123";
      const playerName = "Jacob";

      // Simulate initial join
      localStorage.setItem("playerName", playerName);
      savePlayerId(roomId, playerId);

      // Verify initial state
      expect(getPlayerName()).toBe(playerName);
      expect(getSavedPlayerId(roomId)).toBe(playerId);

      // Simulate leaving (clear session but keep player name)
      sessionStorage.clear();

      // Simulate rejoin - should still have the same name
      expect(getPlayerName()).toBe(playerName);
      expect(getSavedPlayerId(roomId)).toBeUndefined();

      // Simulate getting new player ID on rejoin
      const newPlayerId = "player-consistent-123"; // Same ID for reconnection
      savePlayerId(roomId, newPlayerId);

      // Should maintain consistency
      expect(getSavedPlayerId(roomId)).toBe(newPlayerId);
    });

    it("should handle multiple room scenarios without conflicts", () => {
      const room1 = "room-1";
      const room2 = "room-2";
      const playerId1 = "player-room1";
      const playerId2 = "player-room2";

      // Join room 1
      savePlayerId(room1, playerId1);
      expect(getSavedPlayerId(room1)).toBe(playerId1);
      expect(getSavedPlayerId(room2)).toBeUndefined();

      // Join room 2
      savePlayerId(room2, playerId2);
      expect(getSavedPlayerId(room1)).toBe(playerId1);
      expect(getSavedPlayerId(room2)).toBe(playerId2);

      // Leave room 1, should not affect room 2
      sessionStorage.removeItem(`room-${room1}-playerId`);
      expect(getSavedPlayerId(room1)).toBeUndefined();
      expect(getSavedPlayerId(room2)).toBe(playerId2);
    });

    it("should preserve player name across sessions", () => {
      const playerName = "Jacob";

      // Set player name
      localStorage.setItem("playerName", playerName);
      expect(getPlayerName()).toBe(playerName);

      // Simulate page refresh/reload (clear session but keep localStorage)
      sessionStorage.clear();

      // Player name should still be available
      expect(getPlayerName()).toBe(playerName);
    });
  });
});
