import { DurableObject } from "cloudflare:workers";
import type {
  AddTokenMessage,
  BroadcastMessage,
  ChatMessage,
  ChatMessageData,
  DiceExpression,
  DiceResult,
  DiceRoll,
  DiceRollResult,
  GameState,
  JoinMessage,
  MoveTokenMessage,
  PingMessage,
  Player,
  Token,
} from "./types";
import { sanitizeInput, sanitizeUrl } from "./utils/security";

export class GameRoom extends DurableObject {
  private connections: Map<WebSocket, Player> = new Map();
  private messageRateLimit: Map<string, number> = new Map();
  private lastCleanup = Date.now();
  private state: GameState = {
    tokens: {},
    players: {},
    mapUrl: null,
    gridSize: 40,
  };
  private chatHistory: ChatMessage[] = [];
  private processedOperations: Set<string> = new Set();
  private operationCleanupTime = Date.now();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // when DO wakes up, we load the saved game state and chat history.
    // blockConcurrencyWhile blocks requests until the function completes.
    // This ensures that the DO is not interrupted while loading the state.
    ctx.blockConcurrencyWhile(async () => {
      const savedState = await ctx.storage.get<GameState>("gameState");
      if (savedState) {
        this.state = savedState;
        // Ensure tokens object exists
        if (!this.state.tokens) {
          this.state.tokens = {};
        }
      }

      const savedChat = await ctx.storage.get<ChatMessage[]>("chatHistory");
      if (savedChat) {
        this.chatHistory = savedChat;
      }

      // Restore WebSocket connections after hibernation
      const websockets = ctx.getWebSockets();
      console.log(`Durable Object woke up with ${websockets.length} active WebSockets`);
      for (const ws of websockets) {
        const attachment = ws.deserializeAttachment();
        if (attachment && attachment.playerId) {
          const player = this.state.players[attachment.playerId];
          if (player) {
            this.connections.set(ws, player);
            console.log(`Restored connection for player ${player.name} on wake up`);
          }
        }
      }
    });
  }

  // RPC Methods
  async getState() {
    return { state: this.state, chat: this.chatHistory };
  }

  async initializeRoom(password?: string) {
    await this.ctx.storage.put("password", password || null);
    return { success: true };
  }

  // Fetch ONLY for WebSocket
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }

    return new Response("This endpoint only handles WebSocket connections", { status: 400 });
  }

  private async handleWebSocket(_request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Use hibernatable WebSocket to maintain connections across hibernation
    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleMessage(
    ws: WebSocket,
    message: JoinMessage | PingMessage | ChatMessageData | MoveTokenMessage | AddTokenMessage,
  ) {
    console.log("GameRoom received message:", message.type, "from websocket");
    let player = this.connections.get(ws);
    console.log("Current connections count:", this.connections.size);
    console.log(
      "Player found for this websocket:",
      player ? `${player.name} (${player.id})` : "null",
    );

    // Allow join messages without a player
    if (message.type !== "join" && !player) {
      // Try to restore from hibernation one more time
      const attachment = ws.deserializeAttachment();
      if (attachment && attachment.playerId) {
        const restoredPlayer = this.state.players[attachment.playerId];
        if (restoredPlayer) {
          this.connections.set(ws, restoredPlayer);
          player = restoredPlayer;
          console.log(`Restored connection for player ${restoredPlayer.name} in handleMessage`);
        }
      }

      if (!player) {
        console.log("No player found for non-join message");
        console.log(
          "Available players in connections:",
          Array.from(this.connections.values()).map((p) => `${p.name} (${p.id})`),
        );
        console.log("Message type:", message.type);
        console.log("WebSocket ready state:", ws.readyState);

        // Send a more detailed error message
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Not authenticated. Please rejoin the room.",
            code: "AUTH_REQUIRED",
          }),
        );
        return;
      }
    }

    // Rate limiting only for authenticated players
    if (player) {
      const messageCount = this.messageRateLimit.get(player.id) || 0;
      if (messageCount > 100) {
        ws.send(JSON.stringify({ type: "error", message: "Rate limit exceeded" }));
        ws.close(1008, "Rate limit exceeded");
        return;
      }
      this.messageRateLimit.set(player.id, messageCount + 1);
    }

    this.cleanupRateLimits();

    switch (message.type) {
      case "join":
        await this.handleJoin(ws, message);
        break;

      case "ping":
        // Respond to ping with pong
        ws.send(JSON.stringify({ type: "pong" }));
        break;

      case "move-token":
        // Check for idempotency key
        if (message.idempotencyKey) {
          if (this.processedOperations.has(message.idempotencyKey)) {
            // Already processed, skip
            return;
          }
          this.processedOperations.add(message.idempotencyKey);
        }
        await this.handleMoveToken(player!, message);
        break;

      case "chat":
        // Check for idempotency key
        if (message.idempotencyKey) {
          if (this.processedOperations.has(message.idempotencyKey)) {
            // Already processed, skip
            return;
          }
          this.processedOperations.add(message.idempotencyKey);
        }
        await this.handleChat(player!, message);
        break;

      case "add-token":
        console.log("Received add-token request from player:", player?.name || "unknown");
        console.log("Add-token message details:", message);
        console.log("Player object:", player);
        console.log("Connections count:", this.connections.size);

        // Double-check that player still exists (defensive programming)
        if (!player) {
          console.log("Player became null during add-token processing");
          ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
          return;
        }
        // Check for idempotency key
        if (message.idempotencyKey) {
          if (this.processedOperations.has(message.idempotencyKey)) {
            console.log("Skipping duplicate add-token operation:", message.idempotencyKey);
            // Already processed, skip
            return;
          }
          this.processedOperations.add(message.idempotencyKey);
        }
        await this.handleAddToken(player, message);
        break;

      default:
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Unknown message type",
          }),
        );
    }
  }

  private async handleJoin(ws: WebSocket, message: JoinMessage) {
    // Check room password if required
    const roomPassword = await this.ctx.storage.get<string>("password");
    if (roomPassword && message.password !== roomPassword) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid room password" }));
      ws.close(1008, "Invalid password");
      return;
    }

    let player: Player;
    let playerId: string;
    let isReconnection = false;

    // Check if this is a reconnection
    if (message.playerId && this.state.players[message.playerId]) {
      playerId = message.playerId;
      player = this.state.players[playerId];
      player.connectionStatus = "connected";
      isReconnection = true;

      // Update name if provided (in case they changed it)
      if (message.name) {
        player.name = sanitizeInput(message.name || "Anonymous", 50);
      }
    } else {
      // Max 20 players per room
      if (Object.keys(this.state.players).length >= 20) {
        ws.send(JSON.stringify({ type: "error", message: "Room is full" }));
        ws.close(1008, "Room full");
        return;
      }

      // New player
      playerId = crypto.randomUUID();
      const isGM = Object.keys(this.state.players).length === 0;

      // Sanitize player name
      const name = sanitizeInput(message.name || "Anonymous", 50);

      player = {
        id: playerId,
        name,
        color: this.generateColor(),
        isGM,
        connectionStatus: "connected",
      };

      this.state.players[playerId] = player;
    }

    this.connections.set(ws, player);
    // Attach player ID to WebSocket for hibernation recovery
    ws.serializeAttachment({ playerId: player.id });
    console.log(
      `Player ${player.name} (${player.id}) added to connections map. Total connections: ${this.connections.size}`,
    );
    await this.saveState();

    ws.send(
      JSON.stringify({
        type: "joined",
        playerId,
        state: this.state,
        chatHistory: this.chatHistory.slice(-50),
      }),
    );

    // Only broadcast player-joined for new players, not reconnections
    if (!isReconnection) {
      this.broadcast(
        {
          type: "player-joined",
          player,
        },
        ws,
      );
    }

    // Always broadcast state update so all players see the updated player list
    console.log(
      "Broadcasting state update to all players, player count:",
      Object.keys(this.state.players).length,
    );
    this.broadcast({
      type: "state-update",
      state: this.state,
    }); // Don't exclude anyone to ensure all clients are synced
    console.log(
      `Join process completed for ${player.name}. Connections count: ${this.connections.size}`,
    );
  }

  private async handleMoveToken(player: Player, message: MoveTokenMessage) {
    const { tokenId, x, y } = message;
    const token = this.state.tokens[tokenId];

    if (!token) {
      return;
    }

    token.x = x;
    token.y = y;
    await this.saveState();

    this.broadcast({
      type: "token-moved",
      tokenId,
      x,
      y,
      playerId: player.id,
    });
  }

  private async handleAddToken(player: Player, message: AddTokenMessage) {
    console.log("handleAddToken called with:", message);
    // Validate and sanitize input
    const name = sanitizeInput(message.name || "Token", 50);
    const x = typeof message.x === "number" ? Math.floor(message.x) : 0;
    const y = typeof message.y === "number" ? Math.floor(message.y) : 0;
    const color = message.color || this.generateColor();

    // Optional fields
    const hp = typeof message.hp === "number" ? message.hp : undefined;
    const maxHp = typeof message.maxHp === "number" ? message.maxHp : undefined;
    const size = typeof message.size === "number" ? message.size : undefined;

    // Validate image URL
    let imageUrl: string | undefined;
    if (message.imageUrl) {
      const sanitizedUrl = sanitizeUrl(message.imageUrl);
      if (sanitizedUrl) {
        imageUrl = sanitizedUrl;
      }
    }

    // Generate unique token ID
    const tokenId = crypto.randomUUID();

    // Create the token
    const token: Token = {
      id: tokenId,
      name,
      x,
      y,
      color,
      ...(hp !== undefined && { hp }),
      ...(maxHp !== undefined && { maxHp }),
      ...(size !== undefined && { size }),
      ...(imageUrl !== undefined && { imageUrl }),
    };

    // Add to state
    this.state.tokens[tokenId] = token;
    console.log("Token created:", token);
    console.log("Current tokens in state:", Object.keys(this.state.tokens).length);
    await this.saveState();

    // Broadcast to all clients
    console.log("Broadcasting token-added to all clients");
    this.broadcast({
      type: "token-added",
      token,
      playerId: player.id,
    });
  }

  private async handleChat(player: Player, message: ChatMessageData) {
    // Sanitize and limit chat message length
    const text = sanitizeInput(message.text || "", 500);

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      playerId: player.id,
      playerName: player.name,
      text,
      timestamp: Date.now(),
    };

    // Check for dice rolls
    const rollMatch = text.match(/^\/roll\s+(.+)/);
    if (rollMatch) {
      try {
        const result = this.rollDice(rollMatch[1]);
        chatMessage.roll = result;
        chatMessage.text = `rolled ${rollMatch[1]}`;
      } catch (_e) {
        const playerConnection = [...this.connections.entries()].find(
          ([_, p]) => p.id === player.id,
        );
        const ws = playerConnection?.[0];
        if (ws) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid dice format. Use: /roll 2d6+3",
            }),
          );
        }
        return;
      }
    }

    this.chatHistory.push(chatMessage);

    // Keep only last 1000 messages
    if (this.chatHistory.length > 1000) {
      this.chatHistory = this.chatHistory.slice(-900);
    }

    await this.ctx.storage.put("chatHistory", this.chatHistory);

    this.broadcast({
      type: "chat-message",
      message: chatMessage,
    });
  }

  private rollDice(diceStr: string): DiceResult {
    const expression = this.parseDiceString(diceStr);
    if (!expression) {
      throw new Error("Invalid dice format");
    }

    const results: DiceRollResult[] = [];
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

  private parseDiceString(str: string): DiceExpression | null {
    str = str.replace(/\s/g, "").toLowerCase();

    const pattern = /(\d+)d(\d+)|([+-]\d+)/g;
    const matches = [...str.matchAll(pattern)];

    if (matches.length === 0) return null;

    const rolls: DiceRoll[] = [];
    let modifier = 0;

    for (const match of matches) {
      if (match[1] && match[2]) {
        rolls.push({
          count: parseInt(match[1]),
          sides: parseInt(match[2]),
        });
      } else if (match[3]) {
        modifier += parseInt(match[3]);
      }
    }

    if (rolls.length === 0) return null;

    return { rolls, modifier };
  }

  private cleanupRateLimits() {
    const now = Date.now();
    if (now - this.lastCleanup > 60000) {
      this.messageRateLimit.clear();
      this.lastCleanup = now;
    }

    // Clean up old idempotency keys every 5 minutes
    if (now - this.operationCleanupTime > 300000) {
      this.processedOperations.clear();
      this.operationCleanupTime = now;
    }
  }

  private async handleDisconnect(ws: WebSocket) {
    const player = this.connections.get(ws);
    if (player) {
      this.connections.delete(ws);

      // Keep all players in the state but mark as disconnected
      player.connectionStatus = "disconnected";

      await this.saveState();

      this.broadcast({
        type: "player-left",
        playerId: player.id,
        playerName: player.name,
      });

      // Broadcast state update so all players see the updated player list
      this.broadcast({
        type: "state-update",
        state: this.state,
      });
    }
  }

  private broadcast(message: BroadcastMessage, exclude?: WebSocket) {
    const msg = JSON.stringify(message);
    console.log(`Broadcasting ${message.type} to ${this.connections.size} connected players`);

    let sent = 0;
    for (const [ws, player] of this.connections) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(msg);
          sent++;
        } catch (e) {
          console.error(`Failed to send to player ${player.name}:`, e);
        }
      }
    }
    console.log(`Actually sent to ${sent} players`);
  }

  private async saveState() {
    await this.ctx.storage.put("gameState", this.state);
    await this.ctx.storage.put("lastActivity", Date.now());
  }

  async alarm() {
    // Clean up abandoned rooms
    if (this.connections.size === 0) {
      const lastActivity = await this.ctx.storage.get<number>("lastActivity");
      if (lastActivity && Date.now() - lastActivity > 3600000) {
        // 1 hour
        await this.ctx.storage.deleteAll();
      }
    }
  }

  private generateColor(): string {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#6C5CE7"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // WebSocket event handlers for Durable Object hibernation API
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // Check if we need to restore the connection after hibernation
    if (!this.connections.has(ws)) {
      const attachment = ws.deserializeAttachment();
      if (attachment && attachment.playerId) {
        const player = this.state.players[attachment.playerId];
        if (player) {
          this.connections.set(ws, player);
          console.log(`Restored connection for player ${player.name} after hibernation`);
        }
      }
    }

    try {
      const messageStr = message as string;
      if (messageStr.length > 10000) {
        ws.send(JSON.stringify({ type: "error", message: "Message too large" }));
        return;
      }

      const parsedMessage = JSON.parse(messageStr);
      await this.handleMessage(ws, parsedMessage);
    } catch (_e) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        }),
      );
    }
  }

  async webSocketClose(ws: WebSocket) {
    await this.handleDisconnect(ws);
  }

  // Handle WebSocket errors
  async webSocketError(ws: WebSocket, error: Error) {
    console.error("WebSocket error:", error);
    // Try to restore connection if needed
    if (!this.connections.has(ws)) {
      const attachment = ws.deserializeAttachment();
      if (attachment && attachment.playerId) {
        const player = this.state.players[attachment.playerId];
        if (player) {
          this.connections.set(ws, player);
          console.log(`Restored connection for player ${player.name} after error`);
        }
      }
    }
  }
}
