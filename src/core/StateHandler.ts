import type { Application } from 'pixi.js';

export interface StateHandler {
    enter(app: Application): Promise<void> | void;
    exit(): void;
    update(deltaTime: number): void;
}
