import { type LAYER_NAME } from "../shared/constants.ts";
import type { IEntity } from "../types/Entity";
import { Building, type BuildingData } from "../types/Building.ts";
import { Unit, type UnitData } from "../types/Unit.ts";
import { Terrain, type TerrainData } from "../types/Terrain.ts";
import { KennySpriteProvider } from "../sprites/KennyTextureProvider.ts";
import type { TeamColor, BuildingType, UnitType } from "../shared/constants.ts";

type Layers = Record<LAYER_NAME, IEntity[]>;

type SerializedEntity = {
    type: "Terrain" | "Building" | "Unit" | "Effect" | "Shadow" | "UI";
    data: any;
};

type GameMapJSON = {
    mapWidth: number;
    mapHeight: number;
    mapLayers: Record<LAYER_NAME, SerializedEntity[]>;
};

// Alias for GameMap used in other parts of the codebase
export type TileMap = GameMap;

// Receive GameMapData and provide APIs to manipulate map data
export class GameMap {
    mapWidth: number;
    mapHeight: number;
    mapLayers: Layers;
    private textureProvider: KennySpriteProvider;

    constructor() {
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.mapLayers = {
            "Terrain": [] as IEntity[],
            "Building": [] as IEntity[],
            "Unit": [] as IEntity[],
            "Shadows": [] as IEntity[],
            "Effects": [] as IEntity[],
            "UI": [] as IEntity[],
        };
        this.textureProvider = KennySpriteProvider.getInstance();
    }

    private mapOwnerToTeam(owner: number): TeamColor {
        const teams: Record<number, TeamColor> = {
            0: "Gray",
            1: "Green",
            2: "Blue",
            3: "Red",
            4: "Yellow",
            5: "Orange",
        };
        return teams[owner] || "Gray";
    }

    inBounds(col: number, row: number): boolean {
        return col >= 0 && col < this.mapWidth && row >= 0 && row < this.mapHeight;
    }

    getLayer(layerName: LAYER_NAME): IEntity[]{
        const layer = this.mapLayers[layerName];
        if (!layer)
            throw new Error(`Layer ${layerName} does not exist`);
        return layer;
    }

    getMapSize() : { width: number, height: number } {
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

    exportToJSON(): string {
        const mapData: GameMapJSON = {
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight,
            mapLayers: {
                "Terrain": [],
                "Building": [],
                "Unit": [],
                "Shadows": [],
                "Effects": [],
                "UI": [],
            },
        };

        // Serialize each layer
        for (const [layerName, entities] of Object.entries(this.mapLayers)) {
            const serialized: SerializedEntity[] = [];
            for (const entity of entities) {
                if (entity instanceof Terrain) {
                    serialized.push({
                        type: "Terrain",
                        data: entity.data,
                    });
                } else if (entity instanceof Building) {
                    serialized.push({
                        type: "Building",
                        data: entity.data,
                    });
                } else if (entity instanceof Unit) {
                    serialized.push({
                        type: "Unit",
                        data: entity.data,
                    });
                } else {
                    // For Shadows, Effects, UI - just store minimal data
                    serialized.push({
                        type: "UI",
                        data: {},
                    });
                }
            }
            mapData.mapLayers[layerName as LAYER_NAME] = serialized;
        }

        return JSON.stringify(mapData);
    }

    importFromJSON(json: string): void {
        const data: GameMapJSON = JSON.parse(json);
        
        // Validate
        if (typeof data.mapWidth !== "number" || typeof data.mapHeight !== "number") {
            throw new Error("Invalid map data: mapWidth and mapHeight must be numbers");
        }

        this.mapWidth = data.mapWidth;
        this.mapHeight = data.mapHeight;
        const expectedTileCount = this.mapWidth * this.mapHeight;

        // Reconstruct layers
        for (const [layerName, serializedEntities] of Object.entries(data.mapLayers)) {
            const entities: IEntity[] = [];

            for (let i = 0; i < expectedTileCount; i++) {
                const serialized = serializedEntities[i];
                
                if (!serialized) {
                    // For empty tiles, create default terrain or skip
                    // For now, we'll just push undefined which the renderer should handle
                    entities.push(null as any);
                    continue;
                }

                let entity: IEntity | null = null;

                switch (serialized.type) {
                    case "Terrain": {
                        const terrainData: TerrainData = serialized.data;
                        const texture = this.textureProvider.getTerrainTexture(terrainData.terrainType);
                        entity = new Terrain(texture, terrainData);
                        break;
                    }

                    case "Building": {
                        const buildingData: BuildingData = serialized.data;
                        const texture = this.textureProvider.getBuildingTexture(
                            buildingData.buildingType as BuildingType,
                            this.mapOwnerToTeam(buildingData.owner)
                        );
                        entity = new Building(texture, buildingData);
                        break;
                    }

                    case "Unit": {
                        const unitData: UnitData = serialized.data;
                        const texture = this.textureProvider.getUnitTexture(
                            unitData.unitType as UnitType,
                            this.mapOwnerToTeam(unitData.owner)
                        );
                        entity = new Unit(texture, unitData);
                        break;
                    }

                    default:
                        // Skip unknown entity types
                        break;
                }

                entities.push(entity as any);
            }

            this.mapLayers[layerName as LAYER_NAME] = entities;
        }
    }

    async loadFromJSON(path: string): Promise<void> {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to fetch map data from ${path}: ${response.statusText}`);
            }
            const json = await response.text();
            this.importFromJSON(json);
        } catch (error) {
            throw new Error(`Failed to load map from ${path}: ${error}`);
        }
    }
}
