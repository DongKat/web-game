import { type LAYER_NAME } from "../shared/constants.ts";
import type { TerrainType, UnitType, BuildingType } from "../shared/constants.ts";
import type { IEntity } from "../types/Entity";
import { EntityFactory } from "../types/EntityFactory.ts";

type Layers = Record<LAYER_NAME, IEntity[]>;
export type TileMap = GameMap;

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
                        const obj = JSON.parse(entityJson);
                        let entity: IEntity;
                        switch (layerName) {
                            case 'Terrain':
                                entity = EntityFactory.createTerrain(obj.terrainType as TerrainType);
                                break;
                            case 'Unit':
                                entity = EntityFactory.createUnit(obj.unitType as UnitType, obj.owner ?? 0);
                                break;
                            case 'Building':
                                entity = EntityFactory.createBuilding(obj.buildingType as BuildingType, obj.owner ?? 0);
                                break;
                        }
                        this.setTile(col, row, layerName, entity);
                    }
                }
            }
        }
    }

    async loadFromJSON(url: string): Promise<void> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load map data from ${url}: ${response.statusText}`);
        }
        const json = await response.text();
        this.importFromJson(json);
    }

}
