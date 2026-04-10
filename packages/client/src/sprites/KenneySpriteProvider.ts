import { Assets, Texture, Rectangle } from 'pixi.js';
import type { UnitType, TeamColor, TerrainType } from '@web-game/shared';
import type { ISpriteProvider, UnitAction, OverlayType, SpriteTexture } from '../rendering/ISpriteProvider';
import {
  TILE_SIZE,
  TILE_SPACING,
  SHEET_COLUMNS,
  SHEET_ROWS,
  SPRITESHEET_PATH,
  TILE_ID_MAP,
} from '../core/constants';

// Kenney tile mapping tables use TILE_ID_MAP values (1-based IDs)

// ── Mapping tables: semantic types → Kenney tile IDs ──

const UNIT_TILE_MAP: Partial<Record<`${TeamColor}_${UnitType}`, number>> = {
  blue_infantry: TILE_ID_MAP.BLUE_INF,
  blue_mech: TILE_ID_MAP.BLUE_AT_INF,
  blue_tank: TILE_ID_MAP.BLUE_TANK,
  blue_artillery: TILE_ID_MAP.BLUE_ARTY,
  blue_apc: TILE_ID_MAP.BLUE_APC,
  blue_battlecopter: TILE_ID_MAP.BLUE_HELI,
  blue_transportcopter: TILE_ID_MAP.BLUE_TRANSPORT_HELI,
  blue_fighter: TILE_ID_MAP.BLUE_JET,
  blue_battleship: TILE_ID_MAP.BLUE_BATTLESHIP,
  blue_sub: TILE_ID_MAP.BLUE_SUB,
  blue_cruiser: TILE_ID_MAP.BLUE_BOAT,
  blue_recon: TILE_ID_MAP.BLUE_TRUCK_1,
  blue_rocket: TILE_ID_MAP.BLUE_TRUCK_2,

  red_infantry: TILE_ID_MAP.RED_INF,
  red_mech: TILE_ID_MAP.RED_AT_INF,
  red_tank: TILE_ID_MAP.RED_TANK,
  red_artillery: TILE_ID_MAP.RED_ARTY,
  red_apc: TILE_ID_MAP.RED_APC,
  red_battlecopter: TILE_ID_MAP.RED_HELI,
  red_transportcopter: TILE_ID_MAP.RED_TRANSPORT_HELI,
  red_fighter: TILE_ID_MAP.RED_JET,
  red_battleship: TILE_ID_MAP.RED_BATTLESHIP,
  red_sub: TILE_ID_MAP.RED_SUB,
  red_cruiser: TILE_ID_MAP.RED_BOAT,
  red_recon: TILE_ID_MAP.RED_TRUCK_1,
  red_rocket: TILE_ID_MAP.RED_TRUCK_2,

  green_infantry: TILE_ID_MAP.GREEN_INF,
  green_mech: TILE_ID_MAP.GREEN_AT_INF,
  green_tank: TILE_ID_MAP.GREEN_TANK,
  green_artillery: TILE_ID_MAP.GREEN_ARTY,
  green_apc: TILE_ID_MAP.GREEN_APC,
  green_battlecopter: TILE_ID_MAP.GREEN_HELI,
  green_transportcopter: TILE_ID_MAP.GREEN_TRANSPORT_HELI,
  green_fighter: TILE_ID_MAP.GREEN_JET,
  green_battleship: TILE_ID_MAP.GREEN_BATTLESHIP,
  green_sub: TILE_ID_MAP.GREEN_SUB,
  green_cruiser: TILE_ID_MAP.GREEN_BOAT,
  green_recon: TILE_ID_MAP.GREEN_TRUCK_1,
  green_rocket: TILE_ID_MAP.GREEN_TRUCK_2,

  orange_infantry: TILE_ID_MAP.YELLOW_INF,
  orange_mech: TILE_ID_MAP.YELLOW_AT_INF,
  orange_tank: TILE_ID_MAP.YELLOW_TANK,
  orange_artillery: TILE_ID_MAP.YELLOW_ARTY,
  orange_apc: TILE_ID_MAP.YELLOW_APC,
  orange_battlecopter: TILE_ID_MAP.YELLOW_HELI,
  orange_transportcopter: TILE_ID_MAP.YELLOW_TRANSPORT_HELI,
  orange_fighter: TILE_ID_MAP.YELLOW_JET,
  orange_battleship: TILE_ID_MAP.YELLOW_BATTLESHIP,
  orange_sub: TILE_ID_MAP.YELLOW_SUB,
  orange_cruiser: TILE_ID_MAP.YELLOW_BOAT,
  orange_recon: TILE_ID_MAP.YELLOW_TRUCK_1,
  orange_rocket: TILE_ID_MAP.YELLOW_TRUCK_2,

  gray_infantry: TILE_ID_MAP.GRAY_INF,
  gray_mech: TILE_ID_MAP.GRAY_AT_INF,
  gray_tank: TILE_ID_MAP.GRAY_TANK,
  gray_artillery: TILE_ID_MAP.GRAY_ARTY,
  gray_apc: TILE_ID_MAP.GRAY_APC,
  gray_battlecopter: TILE_ID_MAP.GRAY_HELI,
  gray_transportcopter: TILE_ID_MAP.GRAY_TRANSPORT_HELI,
  gray_fighter: TILE_ID_MAP.GRAY_JET,
  gray_battleship: TILE_ID_MAP.GRAY_BATTLESHIP,
  gray_sub: TILE_ID_MAP.GRAY_SUB,
  gray_cruiser: TILE_ID_MAP.GRAY_BOAT,
  gray_recon: TILE_ID_MAP.GRAY_TRUCK_1,
  gray_rocket: TILE_ID_MAP.GRAY_TRUCK_2,
};

const BUILDING_TILE_MAP: Partial<Record<`${TeamColor | 'neutral'}_${TerrainType}`, number>> = {
  blue_city: TILE_ID_MAP.BLUE_CITY,
  blue_hq: TILE_ID_MAP.BLUE_TOWER,
  blue_factory: TILE_ID_MAP.BLUE_FACTORY,
  blue_airport: TILE_ID_MAP.BLUE_AIRPORT,
  blue_port: TILE_ID_MAP.BLUE_PORT,
  blue_comtower: TILE_ID_MAP.BLUE_COMN,
  blue_silo: TILE_ID_MAP.BLUE_SILO,

  red_city: TILE_ID_MAP.RED_CITY,
  red_hq: TILE_ID_MAP.RED_TOWER,
  red_factory: TILE_ID_MAP.RED_FACTORY,
  red_airport: TILE_ID_MAP.RED_AIRPORT,
  red_port: TILE_ID_MAP.RED_PORT,
  red_comtower: TILE_ID_MAP.RED_COMN,
  red_silo: TILE_ID_MAP.RED_SILO,

  green_city: TILE_ID_MAP.GREEN_CITY,
  green_hq: TILE_ID_MAP.GREEN_TOWER,
  green_factory: TILE_ID_MAP.GREEN_FACTORY,
  green_airport: TILE_ID_MAP.GREEN_AIRPORT,
  green_port: TILE_ID_MAP.GREEN_PORT,
  green_comtower: TILE_ID_MAP.GREEN_COMN,
  green_silo: TILE_ID_MAP.GREEN_SILO,

  orange_city: TILE_ID_MAP.YELLOW_CITY,
  orange_hq: TILE_ID_MAP.YELLOW_TOWER,
  orange_factory: TILE_ID_MAP.YELLOW_FACTORY,
  orange_airport: TILE_ID_MAP.YELLOW_AIRPORT,
  orange_port: TILE_ID_MAP.YELLOW_PORT,
  orange_comtower: TILE_ID_MAP.YELLOW_COMN,
  orange_silo: TILE_ID_MAP.YELLOW_SILO,

  neutral_city: TILE_ID_MAP.GRAY_CITY,
  neutral_hq: TILE_ID_MAP.GRAY_TOWER,
  neutral_factory: TILE_ID_MAP.GRAY_FACTORY,
  neutral_airport: TILE_ID_MAP.GRAY_AIRPORT,
  neutral_port: TILE_ID_MAP.GRAY_PORT,
  neutral_comtower: TILE_ID_MAP.GRAY_COMN,
  neutral_silo: TILE_ID_MAP.GRAY_SILO,

  gray_city: TILE_ID_MAP.GRAY_CITY,
  gray_hq: TILE_ID_MAP.GRAY_TOWER,
  gray_factory: TILE_ID_MAP.GRAY_FACTORY,
  gray_airport: TILE_ID_MAP.GRAY_AIRPORT,
  gray_port: TILE_ID_MAP.GRAY_PORT,
  gray_comtower: TILE_ID_MAP.GRAY_COMN,
  gray_silo: TILE_ID_MAP.GRAY_SILO,
};

const TERRAIN_TILE_MAP: Partial<Record<TerrainType, number>> = {
  plain: TILE_ID_MAP.GRASS_0,
  road: TILE_ID_MAP.ROAD_1,
  bridge: TILE_ID_MAP.BRIDGE,
  forest: TILE_ID_MAP.FOREST_1,
  mountain: TILE_ID_MAP.MOUNTAIN,
  river: TILE_ID_MAP.RIVER_0,
  sea: TILE_ID_MAP.LAKE_0,
};

const OVERLAY_TILE_MAP: Record<OverlayType, number> = {
  cursor: TILE_ID_MAP.CURSOR,
  movementHighlight: TILE_ID_MAP.MOVEMENT_HIGHLIGHT,
  attackHighlight: TILE_ID_MAP.MOVEMENT_HIGHLIGHT, // reuse for now
  arrowUp: TILE_ID_MAP.PATH_ARROW_UP,
  arrowDown: TILE_ID_MAP.PATH_ARROW_DOWN,
  arrowLeft: TILE_ID_MAP.PATH_ARROW_LEFT,
  arrowRight: TILE_ID_MAP.PATH_ARROW_RIGHT,
  arrowHorizontal: TILE_ID_MAP.PATH_HORIZONTAL,
  arrowVertical: TILE_ID_MAP.PATH_VERTICAL,
  arrowTurn1: TILE_ID_MAP.PATH_TURN_1,
  arrowTurn2: TILE_ID_MAP.PATH_TURN_2,
  arrowTurn3: TILE_ID_MAP.PATH_TURN_3,
  arrowTurn4: TILE_ID_MAP.PATH_TURN_4,
};

const HEALTH_TILE_MAP: Record<number, number> = {
  0: TILE_ID_MAP.HEALTH_0,
  1: TILE_ID_MAP.HEALTH_1,
  2: TILE_ID_MAP.HEALTH_2,
  3: TILE_ID_MAP.HEALTH_3,
  4: TILE_ID_MAP.HEALTH_4,
  5: TILE_ID_MAP.HEALTH_5,
  6: TILE_ID_MAP.HEALTH_6,
  7: TILE_ID_MAP.HEALTH_7,
  8: TILE_ID_MAP.HEALTH_8,
  9: TILE_ID_MAP.HEALTH_9,
};

export class KenneySpriteProvider implements ISpriteProvider {
  readonly id = 'kenney';
  readonly name = 'Kenney Tiny Battle';

  private tileTextures = new Map<number, Texture>();
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    const baseTexture = await Assets.load<Texture>(SPRITESHEET_PATH);
    this.tileTextures = this.sliceSpritesheet(baseTexture);
    this.initialized = true;

    console.log(`📦 KenneySpriteProvider: loaded ${this.tileTextures.size} tiles`);
  }

  getUnitTexture(unitType: UnitType, team: TeamColor, _action?: UnitAction): SpriteTexture {
    const key = `${team}_${unitType}` as const;
    const tileId = UNIT_TILE_MAP[key];
    if (tileId !== undefined) {
      const tex = this.tileTextures.get(tileId - 1); // TILE_ID_MAP is 1-based
      if (tex) return tex;
    }
    // Fallback to gray infantry
    return this.tileTextures.get(TILE_ID_MAP.GRAY_INF - 1)!;
  }

  getBuildingTexture(buildingType: TerrainType, team: TeamColor | null): SpriteTexture {
    const teamKey = team ?? 'neutral';
    const key = `${teamKey}_${buildingType}` as const;
    const tileId = BUILDING_TILE_MAP[key];
    if (tileId !== undefined) {
      const tex = this.tileTextures.get(tileId - 1);
      if (tex) return tex;
    }
    return this.tileTextures.get(TILE_ID_MAP.GRAY_CITY - 1)!;
  }

  getTerrainTexture(terrainType: TerrainType, _variant?: number): SpriteTexture {
    const tileId = TERRAIN_TILE_MAP[terrainType];
    if (tileId !== undefined) {
      const tex = this.tileTextures.get(tileId - 1);
      if (tex) return tex;
    }
    return this.tileTextures.get(TILE_ID_MAP.GRASS_0 - 1)!;
  }

  getOverlayTexture(overlayType: OverlayType): Texture {
    const tileId = OVERLAY_TILE_MAP[overlayType];
    return this.tileTextures.get(tileId - 1)!;
  }

  getHealthTexture(hp: number): Texture {
    const displayHp = Math.min(9, Math.max(0, Math.ceil(hp / 10) - 1));
    const tileId = HEALTH_TILE_MAP[displayHp] ?? TILE_ID_MAP.HEALTH_UNKNOWN;
    return this.tileTextures.get(tileId - 1)!;
  }

  getTileTextureByTiledId(tiledId: number): Texture | undefined {
    if (tiledId === 0) return undefined;

    const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
    const FLIPPED_VERTICALLY_FLAG = 0x40000000;
    const FLIPPED_DIAGONALLY_FLAG = 0x20000000;

    const rawId = tiledId & ~(
      FLIPPED_HORIZONTALLY_FLAG |
      FLIPPED_VERTICALLY_FLAG |
      FLIPPED_DIAGONALLY_FLAG
    );

    return this.tileTextures.get(rawId - 1);
  }

  // ── Internal ──

  private sliceSpritesheet(baseTexture: Texture): Map<number, Texture> {
    const textures = new Map<number, Texture>();

    for (let row = 0; row < SHEET_ROWS; row++) {
      for (let col = 0; col < SHEET_COLUMNS; col++) {
        const tileId = row * SHEET_COLUMNS + col;

        const x = col * ((TILE_SIZE - 1) + TILE_SPACING);
        const y = row * ((TILE_SIZE - 1) + TILE_SPACING);

        const frame = new Rectangle(x, y, TILE_SIZE, TILE_SIZE);
        const tileTexture = new Texture({
          source: baseTexture.source,
          frame,
        });

        textures.set(tileId, tileTexture);
      }
    }

    return textures;
  }
}
