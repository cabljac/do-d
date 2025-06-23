import { GameRoom } from "./GameRoom";
import { checkRateLimit } from "./utils/rate-limit";
import { getSecurityHeaders } from "./utils/security";

export { GameRoom };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";

    const corsHeaders = {
      "Access-Control-Allow-Origin": env.FRONTEND_URL || "http://localhost:3000",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    };

    const headers = getSecurityHeaders(corsHeaders);

    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers });
      }

      if (url.pathname === "/api/room/create" && request.method === "POST") {
        // Check API key
        const apiKey = request.headers.get("X-API-Key");
        if (!apiKey || apiKey !== env.CREATE_ROOM_API_KEY) {
          return new Response("Unauthorized", { status: 401, headers });
        }

        if (!(await checkRateLimit(`create:${clientIP}`, 5, 3600000, env))) {
          return new Response("Too many rooms created. Try again later.", {
            status: 429,
            headers,
          });
        }

        const roomId = crypto.randomUUID();
        const room = env.GAME_ROOM.get(env.GAME_ROOM.idFromName(roomId));

        const body = (await request.json()) as { password?: string };
        if (body.password && body.password.length > 100) {
          return new Response("Password too long", { status: 400, headers });
        }

        await room.initializeRoom(body.password);
        return Response.json({ roomId }, { headers });
      }

      if (url.pathname.startsWith("/room/")) {
        const parts = url.pathname.split("/");
        const roomId = parts[2];
        const action = parts[3];

        if (
          !roomId ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId)
        ) {
          return new Response("Invalid room ID", { status: 400, headers });
        }

        const room = env.GAME_ROOM.get(env.GAME_ROOM.idFromName(roomId));

        switch (action) {
          case "ws":
            if (!(await checkRateLimit(`ws:${clientIP}`, 10, 60000, env))) {
              return new Response("Too many connections", { status: 429, headers });
            }
            return room.fetch(request);

          case "state": {
            if (!(await checkRateLimit(`state:${clientIP}:${roomId}`, 30, 60000, env))) {
              return new Response("Too many requests", { status: 429, headers });
            }
            const state = await room.getState();
            return Response.json(state, { headers });
          }

          default:
            return new Response("Not found", { status: 404, headers });
        }
      }

      if (url.pathname === "/health") {
        return Response.json({ status: "healthy", timestamp: Date.now() }, { headers });
      }

      return new Response("VTT API", { status: 200, headers });
    } catch (error) {
      console.error("API Error:", error);
      return new Response("Internal server error", {
        status: 500,
        headers,
      });
    }
  },
};
