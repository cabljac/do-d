import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker from "../src";

describe("GameRoom functionality through worker", () => {
  it("creates a room and can get its state", async () => {
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
    const createData = (await createResponse.json()) as { roomId: string };

    const stateRequest = new Request(`http://example.com/room/${createData.roomId}/state`);
    const stateResponse = await worker.fetch(stateRequest, env);
    expect(stateResponse.status).toBe(200);
    const stateData = (await stateResponse.json()) as { state: any; chat: any[] };
    expect(stateData.state).toEqual({
      tokens: {},
      players: {},
      mapUrl: null,
      gridSize: 40,
    });
    expect(stateData.chat).toEqual([]);
  });

  it("creates a room with password", async () => {
    const request = new Request("http://example.com/api/room/create", {
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

  it("handles WebSocket upgrade requests", async () => {
    const createRequest = new Request("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({}),
    });
    const createResponse = await worker.fetch(createRequest, env);
    const createData = (await createResponse.json()) as { roomId: string };

    const wsRequest = new Request(`http://example.com/room/${createData.roomId}/ws`, {
      headers: {
        Upgrade: "websocket",
      },
    });
    const wsResponse = await worker.fetch(wsRequest, env);
    expect(wsResponse.status).toBe(101);
  });

  it("rejects non-WebSocket requests to ws endpoint", async () => {
    const createRequest = new Request("http://example.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.CREATE_ROOM_API_KEY || "dev-key-for-testing",
      },
      body: JSON.stringify({}),
    });
    const createResponse = await worker.fetch(createRequest, env);
    const createData = (await createResponse.json()) as { roomId: string };

    const wsRequest = new Request(`http://example.com/room/${createData.roomId}/ws`);
    const wsResponse = await worker.fetch(wsRequest, env);
    expect(wsResponse.status).toBe(400);
    expect(await wsResponse.text()).toBe("This endpoint only handles WebSocket connections");
  });
});

describe("Dice rolling functionality", () => {
  function parseDiceString(
    str: string,
  ): { rolls: Array<{ count: number; sides: number }>; modifier: number } | null {
    str = str.replace(/\s/g, "").toLowerCase();

    const dicePattern = /(\d+)d(\d+)/g;
    const diceMatches = [...str.matchAll(dicePattern)];

    if (diceMatches.length === 0) return null;

    const rolls: Array<{ count: number; sides: number }> = [];
    let modifier = 0;

    for (const match of diceMatches) {
      rolls.push({
        count: parseInt(match[1]),
        sides: parseInt(match[2]),
      });
    }

    const withoutDice = str.replace(/\d+d\d+/g, "");
    const modifierPattern = /([+-]\d+)/g;
    const modifierMatches = [...withoutDice.matchAll(modifierPattern)];

    for (const match of modifierMatches) {
      modifier += parseInt(match[1]);
    }

    return { rolls, modifier };
  }

  function rollDice(diceStr: string): {
    expression: any;
    results: any[];
    modifier: number;
    total: number;
  } {
    const expression = parseDiceString(diceStr);
    if (!expression) {
      throw new Error("Invalid dice format");
    }

    const results: any[] = [];
    let total = expression.modifier;

    for (const diceRoll of expression.rolls) {
      const rolls: number[] = [];
      for (let i = 0; i < diceRoll.count; i++) {
        rolls.push(Math.floor(Math.random() * diceRoll.sides) + 1);
      }

      const sum = rolls.reduce((a, b) => a + b, 0);
      total += sum;

      results.push({
        sides: diceRoll.sides,
        rolls,
        sum,
      });
    }

    return {
      expression,
      results,
      modifier: expression.modifier,
      total,
    };
  }

  it("parses dice expressions correctly", () => {
    const result1 = parseDiceString("2d6");
    expect(result1).toEqual({
      rolls: [{ count: 2, sides: 6 }],
      modifier: 0,
    });

    const result2 = parseDiceString("1d20+5");
    expect(result2).toEqual({
      rolls: [{ count: 1, sides: 20 }],
      modifier: 5,
    });

    const result3 = parseDiceString("2d6+1d4-3");
    expect(result3).toEqual({
      rolls: [
        { count: 2, sides: 6 },
        { count: 1, sides: 4 },
      ],
      modifier: -3,
    });

    const result4 = parseDiceString("invalid");
    expect(result4).toBeNull();
  });

  it("rolls dice correctly", () => {
    const result = rollDice("1d6");
    expect(result.expression.rolls).toEqual([{ count: 1, sides: 6 }]);
    expect(result.expression.modifier).toBe(0);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].sides).toBe(6);
    expect(result.results[0].rolls).toHaveLength(1);
    expect(result.results[0].rolls[0]).toBeGreaterThanOrEqual(1);
    expect(result.results[0].rolls[0]).toBeLessThanOrEqual(6);
    expect(result.total).toBe(result.results[0].rolls[0]);
  });

  it("throws error for invalid dice format", () => {
    expect(() => rollDice("invalid")).toThrow("Invalid dice format");
  });
});
