import { getPlayerIdKey } from "./RoomManager";

const PLAYER_NAME_KEY = "playerName";
const DEFAULT_PLAYER_NAME = "Anonymous";

export function getPlayerName(): string {
  const savedName = localStorage.getItem(PLAYER_NAME_KEY);
  if (savedName) return savedName;

  const newName = prompt("Enter your name:") || DEFAULT_PLAYER_NAME;
  localStorage.setItem(PLAYER_NAME_KEY, newName);
  return newName;
}

export function savePlayerId(roomId: string, playerId: string): void {
  sessionStorage.setItem(getPlayerIdKey(roomId), playerId);
}

export function getSavedPlayerId(roomId: string): string | undefined {
  return sessionStorage.getItem(getPlayerIdKey(roomId)) || undefined;
}
