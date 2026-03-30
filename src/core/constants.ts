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
export const SPRITESHEET_PATH = '/assets/Tilemap/tilemap_packed.png';

/** Path to the map data JSON */
export const DEFAULT_MAP_DATA_PATH = '/assets/maps/sample.json';

/**
 * Team colors used for units and buildings
 */
export const Team = {
  Blue: 'blue',
  Red: 'red',
  Green: 'green',
  Orange: 'orange',
  Gray: 'gray',
} as const;

export type Team = (typeof Team)[keyof typeof Team];

export const Layers = {
  Terrain: 'Terrain',
  Objects: 'Objects',
  Shadows: 'Shadows',
  Vehicles: 'Vehicles',
  UI: 'UI'
} as const;


