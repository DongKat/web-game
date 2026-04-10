import type { GameContext } from '../core/GameContext';
import type { GameState, StateHandler } from '../core/StateHandler';

export class SelectingTargetState implements StateHandler {
    onEnter(_context: GameContext): void {
        // TODO: highlight attackable enemies
    }

    onUpdate(context: GameContext, _dt: number): GameState | null {
        const { inputManager } = context;

        if (inputManager.isActionPressed('cancel')) {
            return 'actionMenu';
        }

        // TODO: cursor constrained to targets, select → combatResolve
        // Stub: go back to idle on select
        if (inputManager.isActionPressed('select')) {
            return 'combatResolve';
        }

        return null;
    }

    onExit(_context: GameContext): void {
        // TODO: clear target highlights
    }
}
