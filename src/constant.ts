// Served from public/, so these are URLs rooted at "/" -- never include "public/".
export const TILEMAP_PATH = "/assets/Tilemap/tilemap_packed.png";
export const TILESET_PATH = "/tilesets/tiny-battle.csv";

// Sheet geometry. Must match the PNG in TILEMAP_PATH:
//   tilemap_packed.png -> 288x176, spacing 0
//   tilemap.png        -> 305x186, spacing 1
export const TILE_SIZE = 16;
export const SHEET_COLS = 18;
export const SHEET_ROWS = 11;
export const SHEET_SPACING = 0;
export const SHEET_MARGIN = 0;

export const STRUCTURE_SCALE = 1;
export const UNIT_SCALE = 0.8;

export const SHEET_GEOMETRY = {
    tileSize: TILE_SIZE,
    cols: SHEET_COLS,
    rows: SHEET_ROWS,
    spacing: SHEET_SPACING,
    margin: SHEET_MARGIN,
};

/** Pixel art: sample without interpolation. Application `antialias: false` does not cover this. */
export const TEXTURE_SCALE_MODE = "nearest";

/** Allowed values of the tileset CSV `kind` column. TileKind is derived from this. */
export const TILE_KINDS = ["terrain", "overlay", "structure", "unit", "ui"] as const;

/** TileDef fields that query()/pick() can filter on. Order sets intersection order. */
export const QUERY_FACETS = [
    "kind",
    "material",
    "team",
    "subtype",
    "facing",
    "edge",
    "variant"
] as const;

/** Columns the tileset CSV must declare. Order in the file does not matter. */
export const CSV_COLUMNS = [
    "id",
    "name",
    "kind",
    "material",
    "team",
    "subtype",
    "facing",
    "edge",
    "variant",
    "note",
] as const;

/** Lines starting with this in the tileset CSV are documentation, not data. */
export const CSV_COMMENT = "#";

/**
 * World layers, back to front. Built in this order at construction so z-order is
 * declared here rather than following whichever layer happened to be drawn first.
 * HUD is deliberately absent -- it must be a sibling of the camera's world
 * container, not a child, or it pans with the map.
 */
export const LAYER_ORDER = ["terrain", "overlay", "structure", "unit", "fx"] as const;

export const INCOME_PER_PROPERTY = 1000;

/** 4-bit autotile mask: sides where the same material continues. */
export const EDGE_NORTH = 1;
export const EDGE_EAST = 2;
export const EDGE_SOUTH = 4;
export const EDGE_WEST = 8;
export const EDGE_MASK_MAX = EDGE_NORTH | EDGE_EAST | EDGE_SOUTH | EDGE_WEST;
