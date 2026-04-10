import type { GameContext } from './GameContext';
import type { GameState, StateHandler } from './StateHandler';

export class GameStateMachine {
    private handlers: Map<GameState, StateHandler> = new Map();
    private currentState: GameState;
    private context: GameContext;

    constructor(initialState: GameState, context: GameContext) {
        this.currentState = initialState;
        this.context = context;
    }

    registerState(state: GameState, handler: StateHandler): void {
        this.handlers.set(state, handler);
    }

    start(): void {
        const handler = this.handlers.get(this.currentState);
        if (handler) {
            console.log(`[StateMachine] Starting in state: ${this.currentState}`);
            handler.onEnter(this.context);
        }
    }

    update(dt: number): void {
        const handler = this.handlers.get(this.currentState);
        if (!handler) {
            console.warn(`[StateMachine] No handler for state: ${this.currentState}`);
            return;
        }

        const nextState = handler.onUpdate(this.context, dt);
        if (nextState !== null && nextState !== this.currentState) {
            this.transition(nextState);
        }
    }

    private transition(nextState: GameState): void {
        const oldHandler = this.handlers.get(this.currentState);
        const newHandler = this.handlers.get(nextState);

        console.log(`[StateMachine] ${this.currentState} → ${nextState}`);

        if (oldHandler) {
            oldHandler.onExit(this.context);
        }

        this.currentState = nextState;

        if (newHandler) {
            newHandler.onEnter(this.context);
        }
    }

    getCurrentState(): GameState {
        return this.currentState;
    }
}
