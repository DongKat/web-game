import { Container, Sprite } from 'pixi.js';
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

    public intialize(): void {
        this.layerContainers.set('Terrain', new Container());
        this.layerContainers.set('Building', new Container());
        this.layerContainers.set('Unit', new Container());
        this.layerContainers.set('Shadows', new Container());
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

    private autotile(col: number, row: number, neighborType: string): number {
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
        return bitmask;
    }

    private createSprite(col: number, row: number): Sprite {
        const sprite = new Sprite();
        sprite.x = col * TILE_SIZE * SCALE;
        sprite.y = row * TILE_SIZE * SCALE;
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

                if (def.autoTile) {
                    // Autotile terrain (Water, Road, Bridge)
                    const bitmask = this.autotile(col, row, type);
                    const texture = this.textureProvider.getAutoTileTexture(type, bitmask);
                    const sprite = this.createSprite(col, row);
                    sprite.texture = texture;
                    terrainContainer.addChild(sprite);
                } else if (def.overlay) {
                    // Overlay terrain (Mountain, Forest) — render grass base + overlay
                    const grassDef = this.defManager.getTerrainDef('Grass');
                    const grassVariant = Math.floor(Math.random() * (grassDef as any).spriteIds.length);
                    const grassTexture = this.textureProvider.getTerrainTexture('Grass', 0);
                    const grassSprite = this.createSprite(col, row);
                    grassSprite.texture = grassTexture;
                    terrainContainer.addChild(grassSprite);

                    const overlayVariant = Math.floor(Math.random() * (def.spriteIds as number[]).length);
                    const overlayTexture = this.textureProvider.getTerrainTexture(type, overlayVariant);
                    const overlaySprite = this.createSprite(col, row);
                    overlaySprite.texture = overlayTexture;
                    terrainContainer.addChild(overlaySprite);
                } else {
                    // Simple terrain (Grass) — pick random variant
                    const variantCount = (def.spriteIds as number[]).length;
                    const variant = Math.floor(Math.random() * variantCount);
                    const texture = this.textureProvider.getTerrainTexture(type, variant);
                    const sprite = this.createSprite(col, row);
                    sprite.texture = texture;
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
                const sprite = this.createSprite(col, row);
                sprite.texture = texture;
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
                const sprite = this.createSprite(col, row);
                sprite.texture = texture;
                unitContainer.addChild(sprite);
            }
        }
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
    }
}
