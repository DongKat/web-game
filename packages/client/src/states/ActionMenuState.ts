import type { GameContext } from '../core/GameContext';
import type { GameState, StateHandler } from '../core/StateHandler';

export class ActionMenuState implements StateHandler {
    onEnter(_context: GameContext): void {
        // TODO: show action menu UI (Wait, Attack, Capture)
    }

    onUpdate(_context: GameContext, _dt: number): GameState | null {
        // TODO: read menu selection, dispatch to chosen state
        // Stub: immediately go back to idle
        return 'idle';
    }

    onExit(_context: GameContext): void {
        // TODO: hide action menu
    }
}
