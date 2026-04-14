import type { IEntity } from "./Entity";



type UnitData = {
    unitType: string;
    owner: number; // Player ID or faction
    healthPoint: number;
    ammo: number;
    fuel: number;
    attackRange: number;
    attackPower: number;
    movementRange: number;
}

export interface Unit extends IEntity {
    data: UnitData;
}
