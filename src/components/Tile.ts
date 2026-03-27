import { Unit } from "./Unit.js";
import {Building} from "./Building.js";
import {Terrain} from "./Terrain.js";

export class Tile {
    standingUnit: Unit | null;
    building: Building | null;
    terrain: Terrain | null;

    constructor(
    ) {
        this.standingUnit = null;
        this.building = null;
        this.terrain = null;
    }



}