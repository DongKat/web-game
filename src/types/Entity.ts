import type { Texture } from "pixi.js";

// Just for reporting sprite id to be drawn
export interface IEntity {
    texture: Texture;
    getTexture(): Texture;
}

export class Entity implements IEntity {
    texture: Texture;

    constructor(texture: Texture) {
        this.texture = texture;
    }

    getTexture(): Texture {
        return this.texture;
    }
}