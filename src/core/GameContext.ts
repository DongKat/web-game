import type { InputManager } from './InputManager';
import type { TileMap } from '../map/GameMap';
import type { LayeredTileRenderer } from '../renderer/MapRenderer';
import type { OverlayMap } from '../ui/OverlayMap';
import type { MovementSystem } from '../systems/MovementSystem';


// Holds everything that a "state" would need to work with
export interface GameContext {
    // TODO: Object are subjected to change in the future
    inputManager: InputManager;
    tileMap: TileMap;
    tileMapRenderer: LayeredTileRenderer;
    overlayMap: OverlayMap;
    overlayRenderer: LayeredTileRenderer;
    movementSystem: MovementSystem;
}
