/**
 * Client-side event type definitions
 */

import type {
  ChatMessageResponse,
  ErrorResponse,
  JoinedResponse,
  PlayerJoinedResponse,
  PlayerLeftResponse,
  StateUpdateResponse,
  TokenAddedResponse,
  TokenMovedResponse,
} from "./network";

/**
 * WebSocket client event map
 */
export interface GameClientEventMap {
  /** Emitted when connected to the server */
  connected: void;
  /** Emitted when disconnected from the server */
  disconnected: void;
  /** Emitted when successfully joined a room */
  joined: JoinedResponse;
  /** Emitted when game state is updated */
  "state-update": StateUpdateResponse;
  /** Emitted when a chat message is received */
  "chat-message": ChatMessageResponse;
  /** Emitted when a player joins the room */
  "player-joined": PlayerJoinedResponse;
  /** Emitted when a player leaves the room */
  "player-left": PlayerLeftResponse;
  /** Emitted when a token is moved */
  "token-moved": TokenMovedResponse;
  /** Emitted when a token is added */
  "token-added": TokenAddedResponse;
  /** Emitted when an error occurs */
  error: ErrorResponse;
  /** Index signature for dynamic events */
  [key: string]: unknown;
}

/**
 * All possible WebSocket message types that can be sent to the server
 */
export type ClientMessage =
  | { type: "join"; name: string; playerId?: string; password?: string; idempotencyKey?: string }
  | { type: "chat"; text: string; idempotencyKey?: string }
  | { type: "move-token"; tokenId: string; x: number; y: number; idempotencyKey?: string }
  | {
      type: "add-token";
      name: string;
      color: string;
      x: number;
      y: number;
      hp?: number;
      maxHp?: number;
      size?: number;
      imageUrl?: string;
      idempotencyKey?: string;
    }
  | { type: "update-token"; tokenId: string; updates: Partial<Token>; idempotencyKey?: string }
  | { type: "delete-token"; tokenId: string; idempotencyKey?: string }
  | { type: "update-map"; mapUrl: string; idempotencyKey?: string }
  | { type: "clear-map"; idempotencyKey?: string };

import type { Token } from "./game";
