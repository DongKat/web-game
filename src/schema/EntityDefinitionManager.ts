import type { TerrainType, UnitType, BuildingType, TeamColor, SPRITE_ID } from '../shared/constants';
import entityDefs from './EntityDefinitions.json';

export type TerrainDefVariant = {
    spriteIds: number[];
    overlay: boolean;
    autoTile: false;
    defaults: { defenseBonus: number; movementCost: number; passable: boolean };
};

export type TerrainDefAutoTile = {
    spriteIds: Record<string, number>;
    overlay: boolean;
    autoTile: true;
    defaults: { defenseBonus: number; movementCost: number; passable: boolean };
};

export type TerrainDef = TerrainDefVariant | TerrainDefAutoTile;

export type UnitDef = {
    spriteIds: Record<TeamColor, number>;
    defaults: { healthPoint: number; ammo: number; fuel: number; attackRange: number; attackPower: number; movementRange: number };
};

export type BuildingDef = {
    spriteIds: Record<TeamColor, number>;
    defaults: { healthPoint: number; defenseBonus: number; passable: boolean };
};

const terrainDefs = entityDefs.terrain as Record<string, TerrainDef>;
const unitDefs = entityDefs.units as Record<string, UnitDef>;
const buildingDefs = entityDefs.buildings as Record<string, BuildingDef>;

export class EntityDefinitionManager {
    private static instance: EntityDefinitionManager;

    private constructor() {}

    public static getInstance(): EntityDefinitionManager {
        if (!EntityDefinitionManager.instance) {
            EntityDefinitionManager.instance = new EntityDefinitionManager();
        }
        return EntityDefinitionManager.instance;
    }

    getTerrainDef(type: TerrainType): TerrainDef {
        const def = terrainDefs[type];
        if (!def) throw new Error(`No terrain definition for type: ${type}`);
        return def;
    }

    getUnitDef(type: UnitType): UnitDef {
        const def = unitDefs[type];
        if (!def) throw new Error(`No unit definition for type: ${type}`);
        return def;
    }

    getBuildingDef(type: BuildingType): BuildingDef {
        const def = buildingDefs[type];
        if (!def) throw new Error(`No building definition for type: ${type}`);
        return def;
    }

    getTerrainSpriteId(type: TerrainType, variant?: number): SPRITE_ID {
        const def = this.getTerrainDef(type);
        if (def.autoTile) {
            // For autotile, variant is not applicable; use getAutoTileSpriteId instead
            const ids = def.spriteIds as Record<string, number>;
            return ids['0'] ?? Object.values(ids)[0];
        }
        const ids = def.spriteIds as number[];
        const idx = variant !== undefined ? variant % ids.length : 0;
        return ids[idx];
    }

    getAutoTileSpriteId(type: TerrainType, bitmask: number): SPRITE_ID {
        const def = this.getTerrainDef(type);
        if (!def.autoTile) {
            throw new Error(`Terrain type ${type} is not an autotile type`);
        }
        const ids = def.spriteIds as Record<string, number>;
        const id = ids[String(bitmask)];
        if (id !== undefined) return id;
        // Fallback to bitmask 0
        const fallback = ids['0'];
        if (fallback !== undefined) return fallback;
        throw new Error(`No autotile sprite for type ${type} with bitmask ${bitmask}`);
    }

    getUnitSpriteId(type: UnitType, team: TeamColor): SPRITE_ID {
        const def = this.getUnitDef(type);
        const id = def.spriteIds[team];
        if (id === undefined) throw new Error(`No unit sprite for type ${type}, team ${team}`);
        return id;
    }

    getBuildingSpriteId(type: BuildingType, team: TeamColor): SPRITE_ID {
        const def = this.getBuildingDef(type);
        const id = def.spriteIds[team];
        if (id === undefined) throw new Error(`No building sprite for type ${type}, team ${team}`);
        return id;
    }
}
