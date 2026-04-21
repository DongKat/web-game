import type { IEntity } from "./Entity";

export type BuildingData = {
    buildingType: string; // e.g., "Factory", "City", etc.
    owner: number; // Player ID or faction
    healthPoint: number;
    defenseBonus: number;
    passable: boolean;
};

export class Building implements IEntity {
    data: BuildingData;

    constructor(data?: BuildingData) {
        this.data = data ?? {
            buildingType: "City",
            owner: 0,
            healthPoint: 20,
            defenseBonus: 3,
            passable: true,
        };
    }

    getType(): string {
        return this.data.buildingType;
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
        return JSON.stringify({ type: "Building", data: this.data });
    }
}
