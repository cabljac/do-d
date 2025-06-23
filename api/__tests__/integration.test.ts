import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("VTT API integration tests", () => {
  it("responds with VTT API for root path", async () => {
    const response = await SELF.fetch("http://example.com/");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("VTT API");
  });

  it("creates a room successfully", async () => {
    const response = await SELF.fetch("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(200);
    const data = (await response.json()) as { roomId: string };
    expect(data).toHaveProperty("roomId");
    expect(typeof data.roomId).toBe("string");
  });

  it("creates a room with password", async () => {
    const response = await SELF.fetch("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({ password: "test123" }),
    });
    expect(response.status).toBe(200);
    const data = (await response.json()) as { roomId: string };
    expect(data).toHaveProperty("roomId");
  });

  it("rejects room creation with too long password", async () => {
    const longPassword = "a".repeat(101);
    const response = await SELF.fetch("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({ password: longPassword }),
    });
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Password too long");
  });

  it("handles CORS preflight requests", async () => {
    const response = await SELF.fetch("http://example.com/api/room/create", {
      method: "OPTIONS",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });

  it("rejects invalid room ID format", async () => {
    const response = await SELF.fetch("http://example.com/room/invalid-id/state");
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid room ID");
  });

  it("returns 404 for unknown room actions", async () => {
    const validRoomId = "12345678-1234-1234-1234-123456789abc";
    const response = await SELF.fetch(`http://example.com/room/${validRoomId}/unknown`);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not found");
  });

  it("can get room state for valid room", async () => {
    // First create a room
    const createResponse = await SELF.fetch("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({}),
    });
    const createData = (await createResponse.json()) as { roomId: string };

    // Then get its state
    const stateResponse = await SELF.fetch(`http://example.com/room/${createData.roomId}/state`);
    expect(stateResponse.status).toBe(200);
    const stateData = (await stateResponse.json()) as { state: any; chat: any[] };
    expect(stateData).toHaveProperty("state");
    expect(stateData).toHaveProperty("chat");
    expect(Array.isArray(stateData.chat)).toBe(true);
  });
});
