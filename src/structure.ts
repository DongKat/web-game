export class Structure {
    readonly name: string
    readonly defenseBonus: number;
    
    // TODO: Capture mechanics
    // private buildingHealth: number; 
    // private owner: Player; // TODO: Not yet implemented ownership
    // private income: number; // TODO: Not yet implemented income generation

    constructor(name: string, defenseBonus: number) {
        this.name = name;
        this.defenseBonus = defenseBonus;
    }

    // TODO: Not yet implemented manufacturing
} 