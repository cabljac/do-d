import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker from "../src";

describe("WebSocket Hibernation", () => {
  it("maintains WebSocket connections across messages", async () => {
    // Create a room
    const createRequest = new Request("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({}),
    });
    const createResponse = await worker.fetch(createRequest, env);
    expect(createResponse.status).toBe(200);
    const { roomId } = (await createResponse.json()) as { roomId: string };

    // Create WebSocket connection
    const wsRequest = new Request(`http://example.com/room/${roomId}/ws`, {
      headers: {
        Upgrade: "websocket",
      },
    });
    const wsResponse = await worker.fetch(wsRequest, env);
    expect(wsResponse.status).toBe(101);

    const ws = wsResponse.webSocket;
    if (!ws) {
      throw new Error("No WebSocket in response");
    }

    // Accept the WebSocket to enable message handling
    ws.accept();

    // Collect messages
    const messages: string[] = [];
    ws.addEventListener("message", (event) => {
      messages.push(event.data as string);
    });

    // Send join message
    ws.send(
      JSON.stringify({
        type: "join",
        name: "TestPlayer",
      }),
    );

    // Wait for join response
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify we got a joined response
    const joinedMessage = messages.find((msg) => {
      const parsed = JSON.parse(msg);
      return parsed.type === "joined";
    });
    expect(joinedMessage).toBeDefined();
    const joinedData = JSON.parse(joinedMessage!);
    const playerId = joinedData.playerId;
    expect(playerId).toBeDefined();

    // Clear messages array
    messages.length = 0;

    // Send multiple ping messages to test connection persistence
    for (let i = 0; i < 3; i++) {
      ws.send(JSON.stringify({ type: "ping" }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Check that we received pong responses
    const pongMessages = messages.filter((msg) => {
      const parsed = JSON.parse(msg);
      return parsed.type === "pong";
    });
    expect(pongMessages.length).toBe(3);

    // Send a chat message to verify the connection is still authenticated
    messages.length = 0;
    ws.send(
      JSON.stringify({
        type: "chat",
        text: "Hello, world!",
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify chat message was broadcast
    const chatMessage = messages.find((msg) => {
      const parsed = JSON.parse(msg);
      return parsed.type === "chat-message";
    });
    expect(chatMessage).toBeDefined();

    // Verify no AUTH_REQUIRED errors were sent
    const errorMessages = messages.filter((msg) => {
      const parsed = JSON.parse(msg);
      return parsed.type === "error" && parsed.code === "AUTH_REQUIRED";
    });
    expect(errorMessages.length).toBe(0);

    ws.close();
  });

  it("requires authentication for non-join messages", async () => {
    // Create a room
    const createRequest = new Request("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({}),
    });
    const createResponse = await worker.fetch(createRequest, env);
    const { roomId } = (await createResponse.json()) as { roomId: string };

    // Create WebSocket connection
    const wsRequest = new Request(`http://example.com/room/${roomId}/ws`, {
      headers: {
        Upgrade: "websocket",
      },
    });
    const wsResponse = await worker.fetch(wsRequest, env);
    const ws = wsResponse.webSocket;
    if (!ws) {
      throw new Error("No WebSocket in response");
    }

    ws.accept();

    const messages: string[] = [];
    ws.addEventListener("message", (event) => {
      messages.push(event.data as string);
    });

    // Try to send a ping without joining first
    ws.send(JSON.stringify({ type: "ping" }));

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should receive AUTH_REQUIRED error
    const errorMessage = messages.find((msg) => {
      const parsed = JSON.parse(msg);
      return parsed.type === "error" && parsed.code === "AUTH_REQUIRED";
    });
    expect(errorMessage).toBeDefined();

    ws.close();
  });
});
