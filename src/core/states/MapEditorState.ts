import type { Application } from 'pixi.js';
import type { StateHandler } from '../StateHandler';
import { Game } from '../Game';

export class MapEditorState implements StateHandler {
    private game: Game | null = null;

    async enter(app: Application): Promise<void> {
        this.game = new Game();
        await this.game.initialize(app);
        console.log('🗺️ Map Editor state entered');
    }

    exit(): void {
        this.game = null;
    }

    update(deltaTime: number): void {
        if (this.game) {
            this.game.gameLoop(deltaTime);
        }
    }
}
