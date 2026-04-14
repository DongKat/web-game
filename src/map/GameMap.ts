import { LAYER_ID, type LAYER_NAME } from "../shared/constants.ts";
import type { Entity, IEntity } from "../types/Entity";

type Layers = Record<LAYER_NAME, IEntity[]>;

// Receive GameMapData and provide APIs to manipulate map data
export class GameMap {
    mapWidth: number;
    mapHeight: number;
    mapLayers: Layers;

    constructor() {
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.mapLayers = {
            "Terrain": [] as Entity[],
            "Building": [] as Entity[],
            "Unit": [] as Entity[],
            "Shadows": [] as Entity[],
            "Effects": [] as Entity[],
            "UI": [] as Entity[],
        };
    }

    inBounds(col: number, row: number): boolean {
        return col >= 0 && col < this.mapWidth && row >= 0 && row < this.mapHeight;
    }

    getTile(col: number, row: number, layerName: LAYER_NAME): IEntity {
        const layer = this.mapLayers[layerName];
        if (!layer)
            throw new Error(`Layer ${layerName} does not exist`);

        let idx = row * this.mapWidth + col;
        return layer[idx];
    }

    setTile(col: number, row: number, layerName: LAYER_NAME, entity: IEntity): void {
        const layer = this.mapLayers[layerName];
        if (!layer)
            throw new Error(`Layer ${layerName} does not exist`);

        let idx = row * this.mapWidth + col;
        layer[idx] = entity;
    }

    exportToJSON(): string {
        return JSON.stringify(this); // TODO: let's see what this becomes
    }

    // TODO: Test this
    importFromJSON(json: string): void {
        const data = JSON.parse(json);
        this.mapWidth = data.mapWidth;
        this.mapHeight = data.mapHeight;
        this.mapLayers = data.mapLayers;
    }
}
