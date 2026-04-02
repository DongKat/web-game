


type UnitData = {
    healthPoint: number;
    ammo: number;
    fuel: number;
    attackRange: number;
    attackPower: number;
    movementRange: number;
}

export class Unit {
    private id: number;
    private unitType: string; // e.g., "Infantry", "Tank", etc.
    private owner: number; // Player ID or faction

    constructor(
        id: number,
        unitType: string,
        owmer: number,
    ) {
        this.id = id;
        this.unitType = unitType;
        this.owner = owmer;
    }

    // TODO: 
}