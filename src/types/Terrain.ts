// Hold info about terrain such as bonus, passability, etc.

import { Entity } from "./Entity.ts";
import type { TerrainType } from "../shared/constants.ts";

export type TerrainData = {
    terrainType: TerrainType;
    defenseBonus: number;
    movementCost: number;
    passable: boolean;
};

export class Terrain extends Entity {
    data: TerrainData;

    constructor() {
        super();
        this.data = {
            terrainType: "Grass",
            defenseBonus: 0,
            movementCost: 1,
            passable: true,
        } as TerrainData;
    }

    importFromJson(json: string): void {
        const obj = JSON.parse(json);
        this.data.terrainType = obj.terrainType;
        this.data.defenseBonus = obj.defenseBonus;
        this.data.movementCost = obj.movementCost;
        this.data.passable = obj.passable;
    }


    exportToJson(): string {
        return JSON.stringify({
            terrainType: this.data.terrainType,
        });
    }
}