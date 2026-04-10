import type { GameContext } from '../core/GameContext';
import type { GameState, StateHandler } from '../core/StateHandler';

export class CombatResolveState implements StateHandler {
    onEnter(_context: GameContext): void {
        // TODO: calculate damage, start combat animation
    }

    onUpdate(_context: GameContext, _dt: number): GameState | null {
        // TODO: tick animation, on complete → idle
        // Stub: immediately go back to idle
        return 'idle';
    }

    onExit(_context: GameContext): void {
        // TODO: remove dead units, mark acting unit as done
    }
}
