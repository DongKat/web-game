import type { GameContext } from './GameContext';

export type GameState =
    | 'idle'
    | 'unitSelected'
    | 'movingUnit'
    | 'actionMenu'
    | 'selectingTarget'
    | 'combatResolve';

export interface StateHandler {
    onEnter(context: GameContext): void;
    onUpdate(context: GameContext, dt: number): GameState | null;
    onExit(context: GameContext): void;
}
