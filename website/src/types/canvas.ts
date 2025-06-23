/**
 * Canvas-related event types and interfaces
 */

import type { TokenAddData, TokenMoveData } from "./ui";

/**
 * Canvas event map for type-safe event handling
 */
export interface CanvasEventMap {
  /** Emitted when a token is moved on the canvas */
  "token-move": TokenMoveData;
  /** Emitted when requesting to add a new token */
  "token-add": TokenAddData;
  /** Emitted when a token is selected */
  "token-select": { tokenId: string };
  /** Emitted when a token is deselected */
  "token-deselect": void;
  /** Emitted when the canvas is clicked */
  "canvas-click": { x: number; y: number };
  /** Emitted when the canvas is right-clicked */
  "canvas-context-menu": { x: number; y: number; tokenId?: string };
  /** Emitted when zooming the canvas */
  "canvas-zoom": { zoom: number; centerX: number; centerY: number };
  /** Emitted when panning the canvas */
  "canvas-pan": { offsetX: number; offsetY: number };
  /** Index signature for dynamic events */
  [key: string]: unknown;
}

/**
 * Canvas render context configuration
 */
export interface CanvasConfig {
  /** Grid size in pixels */
  gridSize: number;
  /** Whether to show the grid */
  showGrid: boolean;
  /** Grid line color */
  gridColor: string;
  /** Grid line width */
  gridLineWidth: number;
  /** Background color */
  backgroundColor: string;
  /** Minimum zoom level */
  minZoom: number;
  /** Maximum zoom level */
  maxZoom: number;
  /** Default zoom level */
  defaultZoom: number;
}

/**
 * Canvas viewport state
 */
export interface CanvasViewport {
  /** Current zoom level */
  zoom: number;
  /** X offset of the viewport */
  offsetX: number;
  /** Y offset of the viewport */
  offsetY: number;
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
}

/**
 * Token render options
 */
export interface TokenRenderOptions {
  /** Whether the token is selected */
  selected?: boolean;
  /** Whether the token is being hovered */
  hover?: boolean;
  /** Whether the token is being dragged */
  dragging?: boolean;
  /** Opacity override (0-1) */
  opacity?: number;
  /** Whether to show HP bar */
  showHP?: boolean;
  /** Whether to show the token name */
  showName?: boolean;
}
