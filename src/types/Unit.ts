import { Entity } from "./Entity";

export type UnitData = {
    unitType: string;
    owner: number;
    healthPoint: number;
    ammo: number;
    fuel: number;
    attackRange: number;
    attackPower: number;
    movementRange: number;
};

export class Unit extends Entity {
    data: UnitData;

    constructor() {
        super();
        this.data = {
            unitType: "",
            owner: 0,
            healthPoint: 0,
            ammo: 0,
            fuel: 0,
            attackRange: 0,
            attackPower: 0,
            movementRange: 0,
        };
    }

    importFromJson(json: string): void {
        const obj = JSON.parse(json);
        this.data.unitType = obj.unitType;
        this.data.owner = obj.owner;
    }

    exportToJson(): string {
        return JSON.stringify({
            unitType: this.data.unitType,
            owner: this.data.owner,
        });
    }

    getType(): string {
        return this.data.unitType;
    }

    getOwner(): number {
        return this.data.owner;
    }
}
