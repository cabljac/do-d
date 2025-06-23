import type { CreateRoomResponse } from "../../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";
const API_KEY = import.meta.env.VITE_CREATE_ROOM_API_KEY;

export async function createRoom(password?: string): Promise<CreateRoomResponse> {
  if (!API_KEY) {
    throw new Error("API key not configured. Please set VITE_CREATE_ROOM_API_KEY.");
  }

  const response = await fetch(`${API_BASE_URL}/api/room/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({ password: password || undefined }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
