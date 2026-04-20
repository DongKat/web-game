import { type LAYER_NAME } from "../shared/constants.ts";
import type { IEntity } from "../types/Entity";
import { Entity } from "../types/Entity.ts";
import { Building } from "../types/Building.ts";
import { Unit } from "../types/Unit.ts";
import { Terrain, type TerrainData } from "../types/Terrain.ts";
import type { TeamColor, TerrainType, SPRITE_ID } from "../shared/constants.ts";
import type { ITextureProvider } from "../sprites/ITextureProvider.ts";

import { EntityFactory } from "../types/EntityFactory.ts";

type Layers = Record<LAYER_NAME, IEntity[]>;
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
            "Terrain": [] as IEntity[],
            "Building": [] as IEntity[],
            "Unit": [] as IEntity[],
            // "Shadow": [] as IEntity[],
            // "Effect": [] as IEntity[],
            // "UI": [] as IEntity[],
        };
    }

    inBounds(col: number, row: number): boolean {
        return col >= 0 && col < this.mapWidth && row >= 0 && row < this.mapHeight;
    }

    getLayer(layerName: LAYER_NAME): IEntity[] {
        const layer = this.mapLayers[layerName];
        if (!layer)
            throw new Error(`Layer ${layerName} does not exist`);
        return layer;
    }

    getMapSize(): { width: number, height: number } {
        return { width: this.mapWidth, height: this.mapHeight };
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

    exportToJson(): string {
        const mapData = {
            width: this.mapWidth,
            height: this.mapHeight,
            layers: Object.entries(this.mapLayers).map(([name, entities]) => ({
                name,
                data: entities.map(entity => {
                    return entity.exportToJson();
                }),
            })),
        };

        return JSON.stringify(mapData, null, 2);
    }

    importFromJson(json: string): void {
        const mapData = JSON.parse(json);
        this.mapWidth = mapData.width;
        this.mapHeight = mapData.height;

        for (const layer of mapData.layers) {
            const layerName = layer.name as LAYER_NAME;
            const entitiesJson = layer.data;
            for (let row = 0; row < this.mapHeight; row++) {
                for (let col = 0; col < this.mapWidth; col++) {
                    const idx = row * this.mapWidth + col;
                    const entityJson = entitiesJson[idx];
                    if (entityJson) {
                        const entity = EntityFactory.createEntity(layerName);
                        if (entity) {
                            entity.importFromJson(entityJson);
                            this.setTile(col, row, layerName, entity);
                        }
                    }
                }
            }
        }
    }
}

// // Test import from Json
// import { readFileSync } from 'fs';
// import { resolve } from 'path';

// function testImportFromJson() {
//     const filePath = resolve('public/assets/maps/converted_sample.json');
//     const jsonFile = readFileSync(filePath, 'utf-8');
//     const gameMap = new GameMap();
//     gameMap.importFromJson(jsonFile);
//     console.log(gameMap);
// }
// testImportFromJson();
