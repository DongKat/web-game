import type { InputManager } from './InputManager';
import type { TileMap } from '../map/GameMap';
import type { Renderer } from '../renderer/Renderer';
import type { MovementSystem } from '../systems/MovementSystem';


// Holds everything that a "state" would need to work with
export interface GameContext {
    // TODO: Object are subjected to change in the future
    inputManager: InputManager;
    tileMap: TileMap;
    renderer: Renderer;
    movementSystem: MovementSystem;
}
