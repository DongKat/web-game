import type { Texture } from "pixi.js";
import type { IEntity } from "./Entity";

export type BuildingData = {
    buildingType: string; // e.g., "Factory", "City", etc.
    owner: number; // Player ID or faction
    healthPoint: number;
    defenseBonus: number;
    passable: boolean;
};

export class Building implements IEntity {
    texture: Texture;
    data: BuildingData;

    constructor(texture: Texture, data: BuildingData) {
        this.texture = texture;
        this.data = data;
    }

    getTexture(): Texture {
        return this.texture;
    }
}
