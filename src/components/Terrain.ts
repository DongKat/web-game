

const TerrainTypes = {
    VOID: 0,
    GRASS: 1,
    WATER: 2,
    MOUNTAIN: 3,
    FOREST: 4,
    ROAD: 5
} as const;

export class Terrain {
    constructor(
        public id: number,
        public name: string,
        public defense: number,
        public movementCost: number,
    ) {}
}