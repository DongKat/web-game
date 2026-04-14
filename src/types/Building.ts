import type { IEntity } from "./Entity";

type BuildingData = {
    buildingType: string; // e.g., "Factory", "City", etc.
    owner: number; // Player ID or faction
    healthPoint: number;
    defenseBonus: number;
    passable: boolean;
};

export interface Building extends IEntity {
    data: BuildingData;
}
