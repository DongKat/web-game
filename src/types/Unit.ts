import type { IEntity } from "./Entity";
import type { TeamColor } from "../shared/constants";

export type UnitData = {
    unitType: string;
    team: TeamColor;
    healthPoint: number;
    ammo: number;
    fuel: number;
    attackRange: number;
    attackPower: number;
    defense: number;
    movementRange: number;
};

export class Unit implements IEntity {
    data: UnitData;
    exhausted: boolean = false;

    constructor(data?: UnitData) {
        this.data = data ?? {
            unitType: "Infantry",
            team: "Red",
            healthPoint: 10,
            ammo: 0,
            fuel: 99,
            attackRange: 1,
            attackPower: 5,
            defense: 0,
            movementRange: 3,
        };
    }

    getType(): string {
        return this.data.unitType;
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
        return JSON.stringify({ type: "Unit", data: this.data });
    }
}
