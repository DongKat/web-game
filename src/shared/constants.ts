// TODO: Put this in shared for now because I feel it will be reused. Split up in the future


/**
 * Core game constants
 */

/** Size of each tile in the spritesheet (pixels) */
export const TILE_SIZE = 16;

/** Spacing between tiles in the packed spritesheet (pixels) */
export const TILE_SPACING = 1;

/** Number of tile columns in the spritesheet */
export const SHEET_COLUMNS = 18;

/** Number of tile rows in the spritesheet */
export const SHEET_ROWS = 11;

/** Total number of tiles in the spritesheet */
export const TOTAL_TILES = SHEET_COLUMNS * SHEET_ROWS; // 198

/** Display scale — how many screen pixels per tile pixel */
export const SCALE = 3;

/** Path to the packed tilemap spritesheet */
export const KENNY_SPRITESHEET_PATH = '/assets/Tilemap/tilemap_packed.png';

/** Path to the map data JSON */
export const DEFAULT_MAP_DATA_PATH = '/assets/maps/default-map.json';

export type TerrainType = 'Grass' | 'Mountain' | 'Water' | 'Road' | 'Bridge' | 'Forest';
export type UnitType = 'Infantry' | 'Tank' | 'Artillery' | 'Jet' | 'Heli' | 'Boat' | 'Sub';
export type BuildingType = 'City' | 'Factory' | 'Airport' | 'Port' | 'Tower';
export type UIElementType = 'Cursor' | 'MovementHighlight' | 'Health' | 'Shadow' | 'PathArrow';
export type TeamColor = 'Blue' | 'Red' | 'Green' | 'Orange' | 'Gray' | 'Yellow';


export type LAYER_NAME = 'Terrain' | 'Building' | 'Unit'
export type UI_LAYER_NAME = 'Shadow' | 'Effect' | 'UI';

export type SPRITE_ID = number;