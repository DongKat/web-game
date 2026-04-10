import type { InputManager } from './InputManager';
import type { TileMap } from '../map/TileMap';
import type { TileMapRenderer } from '../map/TileMapRenderer';
import type { OverlayMap } from '../ui/OverlayMap';
import type { OverlayRenderer } from '../ui/OverlayRenderer';
import type { MovementSystem } from '../systems/MovementSystem';

export interface GameContext {
    inputManager: InputManager;
    tileMap: TileMap;
    tileMapRenderer: TileMapRenderer;
    overlayMap: OverlayMap;
    overlayRenderer: OverlayRenderer;
    movementSystem: MovementSystem;
}
