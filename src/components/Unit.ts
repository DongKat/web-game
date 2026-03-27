
const UnitTypes = {
    NONE: 0,
    INFANTRY: 1,
    LIGHT_TANK: 2,
    MEDIUM_TANK: 3,
    RECON: 4,
    ARTILLERY: 5,
    ROCKET_ARTILLERY: 6,
    ANTI_AIR: 7,
    FIGHTER: 8,
    BOMBER: 9
} as const;

export class Unit {
    constructor(
        public id: number,
        public name: string,
        public health: number,
        public attack: number,
        public defense: number,
        public range: number,
        public movement: number,
    ) {}
}