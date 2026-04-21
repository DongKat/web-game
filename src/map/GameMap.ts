import { type LAYER_NAME } from "../shared/constants.ts";
import type { IEntity } from "../types/Entity";
import { Building } from "../types/Building.ts";
import { Unit } from "../types/Unit.ts";
import { Terrain, type TerrainData } from "../types/Terrain.ts";
import type { UnitData } from "../types/Unit.ts";
import type { BuildingData } from "../types/Building.ts";

type Layers = Record<LAYER_NAME, (IEntity | null)[]>;
// Alias for GameMap used in other parts of the codebase
export type TileMap = GameMap;

// Receive GameMapData and provide APIs to manipulate map data
export class GameMap {
    mapWidth: number;
    mapHeight: number;
    mapLayers: Layers;

    constructor() {
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.mapLayers = {
            "Terrain": [],
            "Building": [],
            "Unit": [],
        };
    }

    inBounds(col: number, row: number): boolean {
        return col >= 0 && col < this.mapWidth && row >= 0 && row < this.mapHeight;
    }

    getLayer(layerName: LAYER_NAME): (IEntity | null)[] {
        const layer = this.mapLayers[layerName];
        if (!layer)
            throw new Error(`Layer ${layerName} does not exist`);
        return layer;
    }

    getMapSize(): { width: number, height: number } {
        return { width: this.mapWidth, height: this.mapHeight };
    }

    getTile(col: number, row: number, layerName: LAYER_NAME): IEntity | null {
        if (!this.inBounds(col, row)) return null;
        const layer = this.mapLayers[layerName];
        if (!layer)
            throw new Error(`Layer ${layerName} does not exist`);

        const idx = row * this.mapWidth + col;
        return layer[idx];
    }

    setTile(col: number, row: number, layerName: LAYER_NAME, entity: IEntity | null): void {
        const layer = this.mapLayers[layerName];
        if (!layer)
            throw new Error(`Layer ${layerName} does not exist`);

        const idx = row * this.mapWidth + col;
        layer[idx] = entity;
    }

    exportToJson(): string {
        const mapData = {
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight,
            mapLayers: Object.fromEntries(
                Object.entries(this.mapLayers).map(([name, entities]) => [
                    name,
                    entities.map(entity => entity ? JSON.parse(entity.exportToJson()) : null),
                ]),
            ),
        };
        return JSON.stringify(mapData, null, 2);
    }

    async loadFromJSON(path: string): Promise<void> {
        const response = await fetch(path);
        const mapData = await response.json();
        this.mapWidth = mapData.mapWidth;
        this.mapHeight = mapData.mapHeight;

        for (const [layerName, entitiesJson] of Object.entries(mapData.mapLayers)) {
            const entities = entitiesJson as (unknown | null)[];
            for (let i = 0; i < entities.length; i++) {
                const raw = entities[i];
                if (!raw) {
                    this.mapLayers[layerName as LAYER_NAME][i] = null;
                    continue;
                }
                const serialized = raw as { type: string; data: unknown };
                let entity: IEntity | null = null;
                switch (serialized.type) {
                    case "Terrain":
                        entity = new Terrain(serialized.data as TerrainData);
                        break;
                    case "Building":
                        entity = new Building(serialized.data as BuildingData);
                        break;
                    case "Unit":
                        entity = new Unit(serialized.data as UnitData);
                        break;
                }
                this.mapLayers[layerName as LAYER_NAME][i] = entity;
            }
        }
    }
}

