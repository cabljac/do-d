export function getRoomIdFromURL(): string | null {
  return new URLSearchParams(window.location.search).get("room");
}

export function getPlayerIdKey(roomId: string): string {
  return `room-${roomId}-playerId`;
}

export function setURLRoomId(roomId: string): void {
  window.location.href = `?room=${roomId}`;
}

export function redirectToLobby(): void {
  window.location.href = "/";
}
