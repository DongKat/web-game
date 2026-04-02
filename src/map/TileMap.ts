import type { MapData, MapLayerData } from '../core/AssetLoader';

/**
 * A single cell in the grid, combining data across all layers.
 */
export interface TileCell {
    /** Tiled tile ID on the Terrain layer (1-based, 0 = empty) */
    terrain: number;
    /** Tiled tile ID on the Objects layer (buildings, trees, etc.) */
    object: number;
    /** Tiled tile ID on the Vehicles layer (units) */
    vehicle: number;
    /** Tiled tile ID on the UI layer (overlays, cursor) */
    ui: number;
    /** Tiled tile ID on the Shadows layer */
    shadow: number;
}

/**
 * TileMap
 *
 * Holds the grid state for the entire map.
 * Provides accessors by (col, row) and by layer name.
 *
 * Tile IDs are **1-based** (Tiled convention): 0 = empty cell.
 */
export class TileMap {
    readonly width: number;
    readonly height: number;

    /** Flat arrays per layer, indexed as [row * width + col] */
    private layers: Map<string, number[]>;

    constructor(mapData: MapData) {
        this.width = mapData.width;
        this.height = mapData.height;

        this.layers = new Map();
        for (const layer of mapData.layers) {
            this.layers.set(layer.name, layer.data);
        }
    }

    /**
     * Get the tile ID at (col, row) on a specific layer.
     * Returns 0 if the cell is empty or out of bounds.
     */
    getTile(col: number, row: number, layerName: string): number {
        if (!this.inBounds(col, row)) return 0;
        const layer = this.layers.get(layerName);
        if (!layer) return 0;
        return layer[row * this.width + col] ?? 0;
    }

    /**
     * Set a tile ID at (col, row) on a specific layer.
     * No-op if out of bounds.
     */
    setTile(col: number, row: number, layerName: string, tileId: number): void {
        if (!this.inBounds(col, row)) return;
        const layer = this.layers.get(layerName);
        if (!layer) return;
        layer[row * this.width + col] = tileId;
    }

    /**
     * Get a combined cell snapshot at (col, row) across all layers.
     */
    getCell(col: number, row: number): TileCell {
        return {
            terrain: this.getTile(col, row, 'Terrain'),
            object: this.getTile(col, row, 'Objects'),
            vehicle: this.getTile(col, row, 'Vehicles'),
            ui: this.getTile(col, row, 'UI'),
            shadow: this.getTile(col, row, 'Shadows'),
        };
    }

    /**
     * Returns the flat data array for a layer (read-only view).
     */
    getLayerData(layerName: string): readonly number[] {
        return this.layers.get(layerName) ?? [];
    }

    /**
     * All layer names present in this map.
     */
    get layerNames(): string[] {
        return [...this.layers.keys()];
    }

    /**
     * Check whether (col, row) is within the map bounds.
     */
    inBounds(col: number, row: number): boolean {
        return col >= 0 && col < this.width && row >= 0 && row < this.height;
    }

    moveEntity(fromCol: number, fromRow: number, toCol: number, toRow: number, layerName: string): boolean {
        if (!this.inBounds(fromCol, fromRow) || !this.inBounds(toCol, toRow)) {
            return false; // Out of bounds
        }
        const entityId = this.getTile(fromCol, fromRow, layerName);
        if (entityId === 0) {
            return false; // No entity to move
        }
        this.setTile(fromCol, fromRow, layerName, 0);
        this.setTile(toCol, toRow, layerName, entityId);
        return true;
    }

    placeEntity(entityId: number, col: number, row: number, layerName: string): boolean {
        if (!this.inBounds(col, row)) {
            return false; // Out of bounds
        }
        this.setTile(col, row, layerName, entityId);
        return true;
    }

    deleteEntity(col: number, row: number, layerName: string): boolean {
        if (!this.inBounds(col, row)) {
            return false; // Out of bounds
        }
        this.setTile(col, row, layerName, 0);
        return true;
    }



}
