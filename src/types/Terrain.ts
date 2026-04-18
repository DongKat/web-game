// Hold info about terrain such as bonus, passability, etc.

import type { Texture } from "pixi.js";
import type { IEntity } from "./Entity.ts";
import type { TerrainType } from "../shared/constants.ts";

export type TerrainData = {
    terrainType: TerrainType;
    defenseBonus: number;
    movementCost: number;
    passable: boolean;
};

export class Terrain implements IEntity {
    texture: Texture;
    data: TerrainData;

    constructor(texture: Texture, data: TerrainData) {
        this.texture = texture;
        this.data = data;
    }

    getTexture(): Texture {
        return this.texture;
    }
}