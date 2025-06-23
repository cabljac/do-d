import type { DiceResult, GameState, Player, Token } from "./game";

export interface WSMessage {
  type: string;
  idempotencyKey?: string;
}

export interface JoinMessage extends WSMessage {
  type: "join";
  name: string;
  playerId?: string;
}

export interface ChatMessageData extends WSMessage {
  type: "chat";
  text: string;
}

export interface MoveTokenMessage extends WSMessage {
  type: "move-token";
  tokenId: string;
  x: number;
  y: number;
}

export interface AddTokenMessage extends WSMessage {
  type: "add-token";
  name: string;
  color: string;
  x: number;
  y: number;
  hp?: number;
  maxHp?: number;
  size?: number;
  imageUrl?: string;
}

export interface JoinedResponse {
  type: "joined";
  playerId: string;
  state: GameState;
  chatHistory: ChatMessage[];
}

export interface StateUpdateResponse {
  type: "state-update";
  state: GameState;
}

export interface ChatMessageResponse {
  type: "chat-message";
  message: ChatMessage;
}

export interface PlayerJoinedResponse {
  type: "player-joined";
  player: Player;
}

export interface PlayerLeftResponse {
  type: "player-left";
  playerId: string;
  playerName?: string;
}

export interface TokenMovedResponse {
  type: "token-moved";
  tokenId: string;
  x: number;
  y: number;
  playerId: string;
}

export interface TokenAddedResponse {
  type: "token-added";
  token: Token;
}

export interface ErrorResponse {
  type: "error";
  message: string;
  code?: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
  roll?: DiceResult;
  whisperTo?: string[];
}
