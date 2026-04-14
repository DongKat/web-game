// Hold info about terrain such as bonus, passability, etc.

import type { IEntity } from "./Entity.ts";

type TerrainData = {
    defenseBonus: number;
    movementCost: number;
    passable: boolean;
};

export interface Terrain extends IEntity {
    data: TerrainData;
}