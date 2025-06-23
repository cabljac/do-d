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
