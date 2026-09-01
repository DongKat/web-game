

export class Terrain {
    readonly name: string;
    readonly defenseBonus: number;

    // TODO: Not yet implemented
    // TODO: Movement cost differ for different unit types, e.g. flying units ignore terrain costs. tanks travel better on roads.
    // private movementCost: number;
    // private isPassable: boolean;
    
    
    constructor(name: string, defenseBonus: number) {
        this.name = name;
        this.defenseBonus = defenseBonus;
    }
}