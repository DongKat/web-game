import { Sprite, type Container, type Texture } from 'pixi.js';
import { TILE_SIZE } from './constant';

export class Cursor {
    cell: { c: number; r: number } | null;
    locked: boolean;
    readonly sprite: Sprite;

    constructor(cursorTexture: Texture, layer: Container) {
        this.cell = null;
        this.locked = false;

        this.sprite = new Sprite(cursorTexture);
        this.sprite.anchor.set(0.5, 1);
        this.sprite.visible = true; // Visible on init
        layer.addChild(this.sprite);
    }

    moveTo(c: number, r: number): void {
        this.cell = { c, r };
        this.sprite.position.set(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE);
    }

    hide(): void {
        this.sprite.visible = false;
    }

    // TODO: Not yet implemented
    lock(): void {
        this.locked = true;
    }

    unlock(): void {
        this.locked = false;
    }
}
