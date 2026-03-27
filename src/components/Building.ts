
const BuildingTypes = {
    NONE: 0,
    CITY: 1,
    FACTORY: 2,
    AIRPORT: 3,
    PORT: 4
} as const;

export class Building {
    constructor(
        public id: number,
        public name: string,
        public health: number,
        public defense: number,
        public owner: number,
    ) {}
}