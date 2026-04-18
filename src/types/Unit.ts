import type { Texture } from "pixi.js";
import type { IEntity } from "./Entity";

export type UnitData = {
    unitType: string;
    owner: number; // Player ID or faction
    healthPoint: number;
    ammo: number;
    fuel: number;
    attackRange: number;
    attackPower: number;
    movementRange: number;
};

export class Unit implements IEntity {
    texture: Texture;
    data: UnitData;

    constructor(texture: Texture, data: UnitData) {
        this.texture = texture;
        this.data = data;
    }

    getTexture(): Texture {
        return this.texture;
    }
}
