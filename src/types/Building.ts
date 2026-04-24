import { Entity, type IEntity } from "./Entity";

export type BuildingData = {
    buildingType: string; // e.g., "Factory", "City", etc.
    owner: number; // Player ID or faction
    color: string; // TODO: Remove this as it's a hack for Renderer
    healthPoint: number;
    defenseBonus: number;
    passable: boolean;
};

export class Building extends Entity{
    private data: BuildingData;

    constructor() {
        super();
        this.data = {
            buildingType: "",
            owner: 0,
            healthPoint: 0,
            defenseBonus: 0,
            passable: true,
        } as BuildingData;
    }

    importFromJson(json: string): void {
        const obj = JSON.parse(json);
        this.data.buildingType = obj.buildingType;
        this.data.owner = obj.owner;
    }

    exportToJson(): string {
        return JSON.stringify({
            buildingType: this.data.buildingType,
            owner: this.data.owner,
        });
    }

    getType(): string {
        return this.data.buildingType;
    }

    getOwner(): number {
        return this.data.owner;
    }

    getColor(): string {
        return this.data.color;
    }
}
