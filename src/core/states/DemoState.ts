import type { Application } from 'pixi.js';
import type { StateHandler } from '../StateHandler';
import { Game } from '../Game';

export class DemoState implements StateHandler {
    private game: Game | null = null;

    async enter(app: Application): Promise<void> {
        this.game = new Game();
        await this.game.initialize(app);
        console.log('🎮 Demo state entered');
    }

    exit(): void {
        if (this.game) {
            this.game.destroyHUD();
            this.game = null;
        }
    }

    update(deltaTime: number): void {
        if (this.game) {
            this.game.gameLoop(deltaTime);
        }
    }
}
