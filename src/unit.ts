

export class Unit {
    readonly name: string
    readonly attack: number;
    readonly defense: number
    readonly movementRange: number;
    readonly attackRange: number;

    readonly cost: number; // Use this for scoring

    private currentHealth: number = 100;
    private ammo: number = 100; // TODO: Not yet implemented ammo system
    private fuel: number = 100; // TODO: Not yet implemented fuel system
    private hasMoved: boolean = false;

    constructor(name: string, attack: number, defense: number, movementRange: number, attackRange: number, cost: number) {
        this.name = name;
        this.attack = attack;
        this.defense = defense;
        this.movementRange = movementRange;
        this.attackRange = attackRange;
        this.cost = cost;
    }




}