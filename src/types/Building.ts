import { Entity } from "./Entity";

export type BuildingData = {
    buildingType: string;
    owner: number;
    healthPoint: number;
    defenseBonus: number;
    passable: boolean;
};

export class Building extends Entity {
    data: BuildingData;

    constructor() {
        super();
        this.data = {
            buildingType: "",
            owner: 0,
            healthPoint: 0,
            defenseBonus: 0,
            passable: true,
        };
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
}
