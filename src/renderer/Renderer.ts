import { Container, Sprite, Texture } from 'pixi.js';
import type { GameMap } from '../map/GameMap';
import type { ITextureProvider } from '../sprites/ITextureProvider';
import { SCALE, TILE_SIZE, OWNER_TO_TEAM } from '../shared/constants';
import type { TerrainType, BuildingType, UnitType, TeamColor } from '../shared/constants';
import { EntityDefinitionManager } from '../schema/EntityDefinitionManager';


export class Renderer {
    private gameMap: GameMap;
    readonly rootContainer: Container;
    private layerContainers: Map<string, Container> = new Map();

    private static instance: Renderer;

    private textureProvider: ITextureProvider;
    private defManager = EntityDefinitionManager.getInstance();

    private updateFlag: number = 0;

    public static getInstance(gameMap: GameMap, textureProvider: ITextureProvider): Renderer {
        if (!Renderer.instance) {
            Renderer.instance = new Renderer(gameMap, textureProvider);
        }
        return Renderer.instance;
    }

    constructor(
        gameMap: GameMap,
        textureProvider: ITextureProvider,
    ) {
        this.gameMap = gameMap;
        this.textureProvider = textureProvider;
        this.rootContainer = new Container();
    }

    public initialize(): void {
        this.layerContainers.set('Terrain', new Container());
        this.layerContainers.set('Building', new Container());
        this.layerContainers.set('Unit', new Container());
        // this.layerContainers.set('Shadows', new Container()); // TODO: No plane yet
        this.layerContainers.set('Effects', new Container());
        this.layerContainers.set('UI', new Container());
        for (const layerContainer of this.layerContainers.values()) {
            this.rootContainer.addChild(layerContainer);
        }

        this.updateFlag = 0b111;
    }

    private ownerToTeam(owner: number): TeamColor {
        return OWNER_TO_TEAM[owner] ?? 'Gray';
    }

    private autotile(col: number, row: number, neighborType: string, diagonalCheck: boolean): number {
        const directions = [
            { dx: 0, dy: -1 },  // Up
            { dx: 1, dy: -1 },  // Up-Right
            { dx: 1, dy: 0 },   // Right
            { dx: 1, dy: 1 },   // Down-Right
            { dx: 0, dy: 1 },   // Down
            { dx: -1, dy: 1 },  // Down-Left
            { dx: -1, dy: 0 },  // Left
            { dx: -1, dy: -1 }, // Up-Left
        ];
        let bitmask = 0;

        for (let i = 0; i < directions.length; i++) {
            const { dx, dy } = directions[i];
            const adjacentCol = col + dx;
            const adjacentRow = row + dy;
            if (!this.gameMap.inBounds(adjacentCol, adjacentRow)) continue;
            const tile = this.gameMap.getTile(adjacentCol, adjacentRow, 'Terrain');
            if (tile && tile.getType() === neighborType) {
                bitmask |= (1 << i);
            }
        }

        // Reset the diagonal bits
        if (!diagonalCheck) {
            bitmask &= 0b01010101; // Keep only orthogonal bits
        }


        return bitmask;
    }

    private createSprite(col: number, row: number, texture: Texture): Sprite {
        const sprite = new Sprite();
        sprite.x = col * TILE_SIZE * SCALE;
        sprite.y = row * TILE_SIZE * SCALE;

        texture.source.scaleMode = "nearest";

        sprite.texture = texture;
        sprite.anchor.set(0, 0);
        sprite.scale.set(SCALE);
        return sprite;
    }

    private renderTerrain(): void {
        const terrainLayerData = this.gameMap.getLayer('Terrain');
        const terrainContainer = this.layerContainers.get('Terrain')!;
        terrainContainer.removeChildren();

        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const terrainTile = terrainLayerData[row * this.gameMap.mapWidth + col];
                if (!terrainTile) continue;

                const type = terrainTile.getType() as TerrainType;
                const def = this.defManager.getTerrainDef(type);


                if (def.overlay) {                        // Overlay terrain (Mountain, Forest) — render grass base + overlay
                    const grassTexture = this.textureProvider.getTerrainTexture('Grass', 0);
                    const grassSprite = this.createSprite(col, row, grassTexture);
                    terrainContainer.addChild(grassSprite);

                }

                if (def.autoTile) {
                    // Autotile terrain (Water, Road, Bridge)
                    let bitmask: number = 0;
                    switch (type) {
                        case 'Water':
                            bitmask = this.autotile(col, row, 'Grass', true);
                            break;
                        case 'Road':
                            bitmask = this.autotile(col, row, 'Road', false);
                            const bridgeBitmask = this.autotile(col, row, 'Bridge', false);
                            // Combine road and bridge bitmasks, prioritizing bridge connections
                            bitmask = (bitmask & ~bridgeBitmask) | bridgeBitmask;
                            break;
                        case 'Bridge':
                            bitmask = this.autotile(col, row, 'Road', false);
                            break;
                    }

                    const texture = this.textureProvider.getAutoTileTexture(type, bitmask);
                    const sprite = this.createSprite(col, row, texture);
                    terrainContainer.addChild(sprite);
                }
                else {
                    // Simple terrain (Grass) -— pick random variant
                    const variantCount = (def.spriteIds as number[]).length;
                    // const variant = Math.floor(Math.random() * variantCount);
                    // const texture = this.textureProvider.getTerrainTexture(type, variant);
                    const texture = this.textureProvider.getTerrainTexture(type, 1);
                    const sprite = this.createSprite(col, row, texture);
                    terrainContainer.addChild(sprite);
                }
            }
        }
    }

    private renderBuildings(): void {
        const buildingLayerData = this.gameMap.getLayer('Building');
        const buildingContainer = this.layerContainers.get('Building')!;
        buildingContainer.removeChildren();

        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const buildingTile = buildingLayerData[row * this.gameMap.mapWidth + col];
                if (!buildingTile) continue;

                const buildingType = buildingTile.getType() as BuildingType;
                const team = this.ownerToTeam(buildingTile.getOwner());
                const texture = this.textureProvider.getBuildingTexture(buildingType, team);
                const sprite = this.createSprite(col, row, texture);
                buildingContainer.addChild(sprite);
            }
        }
    }

    private renderUnits(): void {
        const unitLayerData = this.gameMap.getLayer('Unit');
        const unitContainer = this.layerContainers.get('Unit')!;
        unitContainer.removeChildren();

        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const unitTile = unitLayerData[row * this.gameMap.mapWidth + col];
                if (!unitTile) continue;

                const unitType = unitTile.getType() as UnitType;
                const team = this.ownerToTeam(unitTile.getOwner());
                const texture = this.textureProvider.getUnitTexture(unitType, team);
                const sprite = this.createSprite(col, row, texture);

                // TODO:
                // // Center the unit sprite within the tile
                // sprite.anchor.set(0.5, 0.5);
                // sprite.x = col * TILE_SIZE * SCALE + (TILE_SIZE * SCALE) / 2;
                // sprite.y = row * TILE_SIZE * SCALE + (TILE_SIZE * SCALE) / 2;
                // // Special SCALE for unit to make building more visible
                // sprite.scale.set(SCALE * 0.8);


                unitContainer.addChild(sprite);
            }
        }
    }

    public renderEffects(): void {
        // Health bar
    }

    public renderUI(): void {
        // Movement Highlights
        
        
        // Cursor
    }








    public updateUnits(): void {
        this.updateFlag |= 0b100;
    }

    public updateBuildings(): void {
        this.updateFlag |= 0b010;
    }



    public update(): void {
        if (this.updateFlag & 0b001) this.renderTerrain();
        if (this.updateFlag & 0b010) this.renderBuildings();
        if (this.updateFlag & 0b100) this.renderUnits();

        this.updateFlag = 0;
    }
}
