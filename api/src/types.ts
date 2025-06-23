export interface Token {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
  hp?: number;
  maxHp?: number;
  size?: number;
  imageUrl?: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  isGM: boolean;
  connectionStatus?: "connected" | "disconnected";
}

export interface GameState {
  tokens: Record<string, Token>;
  players: Record<string, Player>;
  mapUrl: string | null;
  gridSize: number;
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

export interface DiceRoll {
  count: number;
  sides: number;
}

export interface DiceExpression {
  rolls: DiceRoll[];
  modifier: number;
}

export interface DiceResult {
  expression: DiceExpression;
  results: DiceRollResult[];
  modifier: number;
  total: number;
}

export interface DiceRollResult {
  sides: number;
  rolls: number[];
  sum: number;
}

export interface InitRoomRequest {
  password?: string;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  idempotencyKey?: string;
}

export interface JoinMessage extends WSMessage {
  type: "join";
  name: string;
  playerId?: string;
  password?: string;
}

export interface PingMessage extends WSMessage {
  type: "ping";
}

export interface PongMessage extends WSMessage {
  type: "pong";
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

export type BroadcastMessage =
  | { type: "player-joined"; player: Player }
  | { type: "player-left"; playerId: string; playerName?: string }
  | { type: "state-update"; state: GameState }
  | { type: "token-moved"; tokenId: string; x: number; y: number; playerId: string }
  | { type: "token-added"; token: Token; playerId: string }
  | { type: "chat-message"; message: ChatMessage }
  | { type: "error"; message: string };
