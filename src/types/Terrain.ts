// Hold info about terrain such as bonus, passability, etc.

import type { IEntity } from "./Entity.ts";
import type { TerrainType } from "../shared/constants.ts";

export type TerrainData = {
    terrainType: TerrainType;
    defenseBonus: number;
    movementCost: number;
    passable: boolean;
};

export class Terrain implements IEntity {
    data: TerrainData;

    constructor(data?: TerrainData) {
        this.data = data ?? {
            terrainType: "Grass",
            defenseBonus: 0,
            movementCost: 1,
            passable: true,
        };
    }

    getType(): string {
        return this.data.terrainType;
    }

    importFromJson(json: string): void {
        const obj = typeof json === 'string' ? JSON.parse(json) : json;
        if (obj.data) {
            this.data = obj.data;
        } else {
            this.data = obj;
        }
    }

    exportToJson(): string {
        return JSON.stringify({ type: "Terrain", data: this.data });
    }
}