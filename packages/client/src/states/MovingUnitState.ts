import type { GameContext } from '../core/GameContext';
import type { GameState, StateHandler } from '../core/StateHandler';

export class MovingUnitState implements StateHandler {
    onEnter(_context: GameContext): void {
        // TODO: start path animation
    }

    onUpdate(_context: GameContext, _dt: number): GameState | null {
        // TODO: tick animation, transition to actionMenu when done
        // Stub: immediately go back to idle
        return 'idle';
    }

    onExit(_context: GameContext): void {
        // TODO: finalize unit position on TileMap
    }
}
