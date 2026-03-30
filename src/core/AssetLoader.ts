import { Assets, Texture, Rectangle } from 'pixi.js';
import {
  TILE_SIZE,
  TILE_SPACING,
  SHEET_COLUMNS,
  SHEET_ROWS,
  SPRITESHEET_PATH,
  DEFAULT_MAP_DATA_PATH,
} from './constants';

/**
 * Shape of a single layer in our map JSON
 */
export interface MapLayerData {
  id: number;
  name: string;
  width: number;
  height: number;
  data: number[];
}

/**
 * Shape of the full map JSON file
 */
export interface MapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: MapLayerData[];
}

/**
 * What AssetLoader.loadAll() resolves with
 */
export interface GameAssets {
  /** Map of tileId (0-based) → Texture for that tile */
  tileTextures: Map<number, Texture>;
  /** Parsed map JSON */
  mapData: MapData;
  /** The raw spritesheet base texture (useful for debugging) */
  spritesheetTexture: Texture;
}

/**
 * AssetLoader
 *
 * Responsible for loading and slicing the packed tilemap spritesheet
 * into individual tile textures, and loading map data.
 *
 * The Kenney packed spritesheet is an 18×11 grid of 16×16 tiles
 * with 1px spacing between each tile.
 *
 * Tile IDs in the Tiled map are **1-based** (0 = empty).
 * Our tileTextures map uses **0-based** IDs, so when rendering
 * you'll need to subtract 1 from the Tiled ID to look up the texture.
 */
export class AssetLoader {
  /**
   * Load all game assets: spritesheet + map data
   */
  static async loadAll(): Promise<GameAssets> {
    // Load the spritesheet image and the map JSON in parallel
    const [spritesheetTexture, mapData] = await Promise.all([
      Assets.load<Texture>(SPRITESHEET_PATH),
      AssetLoader.loadMapData(DEFAULT_MAP_DATA_PATH),
    ]);

    // Slice the spritesheet into individual tile textures
    const tileTextures = AssetLoader.sliceSpritesheet(spritesheetTexture);

    console.log(
      `📦 Assets loaded: ${tileTextures.size} tiles, map ${mapData.width}×${mapData.height}`
    );

    return {
      tileTextures,
      mapData,
      spritesheetTexture,
    };
  }

  /**
   * Fetch and parse a Tiled-exported JSON map file.
   */
  private static async loadMapData(path: string): Promise<MapData> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load map data from ${path}: ${response.statusText}`);
    }
    return response.json() as Promise<MapData>;
  }

  /**
   * Slice a packed spritesheet into individual Texture objects.
   *
   * Layout:
   *   - Each tile is TILE_SIZE × TILE_SIZE (16×16)
   *   - Tiles are separated by TILE_SPACING (1px) on each side
   *   - Grid is SHEET_COLUMNS × SHEET_ROWS (18×11)
   *
   * The formula for pixel position of tile at grid (col, row):
   *   x = col * (TILE_SIZE + TILE_SPACING)
   *   y = row * (TILE_SIZE + TILE_SPACING)
   *
   * Returns a Map of 0-based tileId → Texture
   */
  private static sliceSpritesheet(baseTexture: Texture): Map<number, Texture> {
    const textures = new Map<number, Texture>();

    for (let row = 0; row < SHEET_ROWS; row++) {
      for (let col = 0; col < SHEET_COLUMNS; col++) {
        const tileId = row * SHEET_COLUMNS + col;

        // Calculate pixel position in the spritesheet
        const x = col * ((TILE_SIZE - 1) + TILE_SPACING);
        const y = row * ((TILE_SIZE - 1) + TILE_SPACING);

        // Create a new Texture that references a sub-region of the spritesheet
        const frame = new Rectangle(x, y, TILE_SIZE, TILE_SIZE);
        const tileTexture = new Texture({
          source: baseTexture.source,
          frame,
        });
        // Export texture

        textures.set(tileId, tileTexture);
      }
    }

    return textures;
  }

  /**
   * Get a tile texture by its Tiled ID (1-based).
   * Returns undefined for tileId 0 (empty tile).
   *
   * Convenience helper for use during rendering.
   */
  static getTileTextureByTiledId(
    tileTextures: Map<number, Texture>,
    tiledId: number
  ): Texture | undefined {
    if (tiledId === 0) return undefined;

    // Tiled uses 1-based IDs, our map is 0-based
    // Also handle flipped tiles (high bits set by Tiled for rotation)
    const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
    const FLIPPED_VERTICALLY_FLAG = 0x40000000;
    const FLIPPED_DIAGONALLY_FLAG = 0x20000000;

    const rawId = tiledId & ~(
      FLIPPED_HORIZONTALLY_FLAG |
      FLIPPED_VERTICALLY_FLAG |
      FLIPPED_DIAGONALLY_FLAG
    );

    return tileTextures.get(rawId - 1);
  }
}
