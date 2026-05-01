import { Building } from "./Building.ts";
import { Unit } from "./Unit.ts";
import { Terrain } from "./Terrain.ts";
import type { TerrainType, UnitType, BuildingType } from "../shared/constants.ts";
import { EntityDefinitionManager } from "../schema/EntityDefinitionManager.ts";

export class EntityFactory {
    private static defManager = EntityDefinitionManager.getInstance();

    public static createTerrain(type: TerrainType): Terrain {
        const def = this.defManager.getTerrainDef(type);
        const terrain = new Terrain();
        terrain.data.terrainType = type;
        terrain.data.defenseBonus = def.defaults.defenseBonus;
        terrain.data.movementCost = def.defaults.movementCost;
        terrain.data.passable = def.defaults.passable;
        return terrain;
    }

    public static createUnit(type: UnitType, owner: number): Unit {
        const def = this.defManager.getUnitDef(type);
        const unit = new Unit();
        unit.data.unitType = type;
        unit.data.owner = owner;
        unit.data.healthPoint = def.defaults.healthPoint;
        unit.data.ammo = def.defaults.ammo;
        unit.data.fuel = def.defaults.fuel;
        unit.data.attackRange = def.defaults.attackRange;
        unit.data.attackPower = def.defaults.attackPower;
        unit.data.movementRange = def.defaults.movementRange;
        return unit;
    }

    public static createBuilding(type: BuildingType, owner: number): Building {
        const def = this.defManager.getBuildingDef(type);
        const building = new Building();
        building.data.buildingType = type;
        building.data.owner = owner;
        building.data.healthPoint = def.defaults.healthPoint;
        building.data.defenseBonus = def.defaults.defenseBonus;
        building.data.passable = def.defaults.passable;
        return building;
    }
}