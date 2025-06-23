/**
 * UI Component Types and Interfaces
 */

import type { DiceResult } from "./game";

/**
 * Configuration for creating a new token from the UI
 */
export interface TokenFormData {
  /** Token display name */
  name: string;
  /** Token color (hex format) */
  color: string;
  /** Current hit points */
  hp?: number;
  /** Maximum hit points */
  maxHp?: number;
  /** Token size in grid squares (e.g., 2 for 2x2) */
  size?: number;
  /** Optional image URL for token artwork */
  imageUrl?: string;
}

/**
 * Token form data with position for creating tokens on the canvas
 */
export interface TokenFormDataWithPosition extends TokenFormData {
  /** X coordinate where token should be placed */
  x: number;
  /** Y coordinate where token should be placed */
  y: number;
}

/**
 * Token movement data from canvas interactions
 */
export interface TokenMoveData {
  /** ID of the token being moved */
  tokenId: string;
  /** New X coordinate */
  x: number;
  /** New Y coordinate */
  y: number;
}

/**
 * Canvas event data for token additions
 */
export interface TokenAddData {
  /** X coordinate where token should be placed */
  x: number;
  /** Y coordinate where token should be placed */
  y: number;
}

/**
 * Dice roll request from UI
 */
export interface DiceRollRequest {
  /** Number of dice to roll */
  count: number;
  /** Number of sides on each die */
  sides: number;
}

/**
 * Chat message types
 */
export type ChatMessageType = "normal" | "whisper" | "system" | "dice";

/**
 * Enhanced chat message for UI display
 */
export interface UIChatMessage {
  /** Unique message ID */
  id: string;
  /** Player who sent the message */
  playerId: string;
  /** Display name of the player */
  playerName: string;
  /** Message content */
  text: string;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Type of message */
  type: ChatMessageType;
  /** Dice roll result if applicable */
  roll?: DiceResult;
  /** Player IDs this message is whispered to */
  whisperTo?: string[];
  /** Whether this message has been processed by the UI */
  processed?: boolean;
}

/**
 * Component lifecycle hooks
 */
export interface ComponentLifecycle {
  /** Called when component is mounted to DOM */
  onMount?(): void;
  /** Called when component is removed from DOM */
  onUnmount?(): void;
  /** Called when component should update */
  onUpdate?(): void;
}

/**
 * Base component configuration
 */
export interface ComponentConfig {
  /** Root DOM element for the component */
  container: HTMLElement;
  /** Optional lifecycle hooks */
  lifecycle?: ComponentLifecycle;
}

/**
 * Toast notification configuration
 */
export interface ToastConfig {
  /** Message to display */
  message: string;
  /** Type of toast (affects styling) */
  type?: "info" | "success" | "warning" | "error";
  /** Duration in milliseconds before auto-dismiss */
  duration?: number;
  /** Whether the toast can be manually dismissed */
  dismissible?: boolean;
}

/**
 * Connection status states
 */
export type ConnectionState = "connected" | "connecting" | "disconnected" | "reconnecting";

/**
 * Player list item configuration
 */
export interface PlayerListItem {
  /** Player ID */
  id: string;
  /** Display name */
  name: string;
  /** Player color */
  color: string;
  /** Whether this player is the GM */
  isGM: boolean;
  /** Current connection status */
  connectionStatus: ConnectionState;
  /** Whether this is the current player */
  isCurrentPlayer?: boolean;
}
