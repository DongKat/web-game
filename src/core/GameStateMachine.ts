import type { Application } from 'pixi.js';
import type { StateHandler } from './StateHandler';

export class GameStateMachine {
    private currentState: StateHandler | null = null;
    private app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    async changeState(newState: StateHandler): Promise<void> {
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = newState;
        await this.currentState.enter(this.app);
    }

    update(deltaTime: number): void {
        if (this.currentState) {
            this.currentState.update(deltaTime);
        }
    }
}
