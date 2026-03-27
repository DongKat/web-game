import { Unit } from "components/Unit";
import {Building} from "./Building.js";
import {Terrain} from "./Terrain.js";

export class Tile {
    standingUnit: Unit | null;
    building: Building | null;
    terrain: Terrain | null;

    constructor(
        standingUnit: Unit | null,
        building: Building | null,
        terrain: Terrain | null
    ) {
        this.standingUnit = standingUnit;
        this.building = building;
        this.terrain = terrain;
    }
}