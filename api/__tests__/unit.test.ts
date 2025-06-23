import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
// Import your worker so you can unit test it
import worker from "../src";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request;

describe("VTT API worker", () => {
  it("responds with VTT API for root path", async () => {
    const request = new IncomingRequest("http://example.com/");
    const response = await worker.fetch(request, env);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("VTT API");
  });

  it("creates a room successfully", async () => {
    const request = new IncomingRequest("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({}),
    });
    const response = await worker.fetch(request, env);
    expect(response.status).toBe(200);
    const data = (await response.json()) as { roomId: string };
    expect(data).toHaveProperty("roomId");
    expect(typeof data.roomId).toBe("string");
  });

  it("creates a room with password", async () => {
    const request = new IncomingRequest("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({ password: "test123" }),
    });
    const response = await worker.fetch(request, env);
    expect(response.status).toBe(200);
    const data = (await response.json()) as { roomId: string };
    expect(data).toHaveProperty("roomId");
  });

  it("rejects room creation with too long password", async () => {
    const longPassword = "a".repeat(101);
    const request = new IncomingRequest("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({ password: longPassword }),
    });
    const response = await worker.fetch(request, env);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Password too long");
  });

  it("handles CORS preflight requests", async () => {
    const request = new IncomingRequest("http://example.com/api/room/create", {
      method: "OPTIONS",
    });
    const response = await worker.fetch(request, env);
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });

  it("rejects invalid room ID format", async () => {
    const request = new IncomingRequest("http://example.com/room/invalid-id/state");
    const response = await worker.fetch(request, env);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid room ID");
  });

  it("returns 404 for unknown room actions", async () => {
    const validRoomId = "12345678-1234-1234-1234-123456789abc";
    const request = new IncomingRequest(`http://example.com/room/${validRoomId}/unknown`);
    const response = await worker.fetch(request, env);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not found");
  });
});
