import { Container, Sprite } from 'pixi.js';
import type { GameMap } from '../map/GameMap';
import type { ITextureProvider } from '../sprites/ITextureProvider';
import { SCALE, TILE_SIZE } from '../sprite/SpriteConstants';


const AUTOTILE_BITMASKS: { [key: number]: number } = {
    0: 0,   // No adjacent water
    1: 1,   // Up
    2: 2,   // Up-Right
    3: 3,   // Right
    4: 4,   // Down-Right
    5: 5,   // Down
    6: 6,   // Down-Left
    7: 7,   // Left
    8: 8,   // Up-Left
}


export class Renderer {
    private gameMap: GameMap;
    // private spriteProvider: ITextureProvider;
    readonly rootContainer: Container;
    private layerContainers: Map<string, Container> = new Map();

    private static instance: Renderer;

    private textureProvider: ITextureProvider;

    private updateFlag : number = 0;
    // Bit 0: Terrain needs update
    // Bit 1: Building needs update
    // Bit 2: Unit needs update
    // TODO: Bit 3: UI needs update



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
        // Create a container for each layer and add to root container
        this.layerContainers.set('Terrain', new Container());
        this.layerContainers.set('Building', new Container());
        this.layerContainers.set('Unit', new Container());
        this.layerContainers.set('Shadows', new Container());
        this.layerContainers.set('Effects', new Container());
        this.layerContainers.set('UI', new Container());
        for (const layerContainer of this.layerContainers.values()) {
            this.rootContainer.addChild(layerContainer);
        }

        this.updateFlag = 0b111; // Set all bits to indicate all layers need initial rendering
    }

    private autotile(col: number, row: number, neighborType: string): number {
        // Check adjacent tiles to determine which water tile to use
        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 1, dy: -1 },  // Up-Right
            { dx: 1, dy: 0 },  // Right
            { dx: 1, dy: 1 },   // Down-Right
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 1 },   // Down-Left
            { dx: -1, dy: 0 }, // Left
            { dx: -1, dy: -1 }, // Up-Left
        ];

        let bitmask = 0;

        for (let i = 0; i < directions.length; i++) {
            const { dx, dy } = directions[i];
            const adjacentCol = col + dx;
            const adjacentRow = row + dy;
            const tile = this.gameMap.getTile(adjacentCol, adjacentRow, 'Terrain');
            if (tile && tile.getType() === neighborType) {
                bitmask |= (1 << i);
            }
        }
        return AUTOTILE_BITMASKS[bitmask] || 0;
    }



    private renderTerrain(): void {
        // Terrain don't change so render once
        const terrainLayerData = this.gameMap.getLayer('Terrain');
        const terrainContainer = this.layerContainers.get('Terrain');
        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const terrainTile = terrainLayerData[row * this.gameMap.mapWidth + col];
                if (terrainTile) {
                    switch (terrainTile.getType()) {
                        case 'Water':
                            const bitmask = this.autotile(col, row, 'Grass'); // I accidentally assign bitmask with grass instead of water
                            const texture = this.textureProvider.getAutoTileTexture('Water', bitmask);
                            const sprite = new Sprite(texture);
                            sprite.x = col * TILE_SIZE * SCALE;
                            sprite.y = row * TILE_SIZE * SCALE;
                            sprite.scale.set(SCALE);
                            terrainContainer?.addChild(sprite);
                            break;

                        case 'Grass':
                            {
                                // TODO: It should be "plain" type :v
                                const randomVariant = Math.floor(Math.random() * 3);
                                const grassTexture = this.textureProvider.getTerrainTexture('Grass', randomVariant);
                                const grassSprite = new Sprite(grassTexture);
                                grassSprite.x = col * TILE_SIZE * SCALE;
                                grassSprite.y = row * TILE_SIZE * SCALE;
                                grassSprite.scale.set(SCALE);
                                terrainContainer?.addChild(grassSprite);
                                break;
                            }

                        case 'Mountain':
                            {
                                const randomVariant = Math.floor(Math.random() * 3);
                                const grassTexture = this.textureProvider.getTerrainTexture('Grass', randomVariant);
                                const mountainOverlayTexture = this.textureProvider.getTerrainTexture('Mountain');
                                const grassSprite = new Sprite(grassTexture);
                                grassSprite.x = col * TILE_SIZE * SCALE;
                                grassSprite.y = row * TILE_SIZE * SCALE;
                                grassSprite.scale.set(SCALE);
                                const mountainSprite = new Sprite(mountainOverlayTexture);
                                mountainSprite.x = col * TILE_SIZE * SCALE;
                                mountainSprite.y = row * TILE_SIZE * SCALE;
                                mountainSprite.scale.set(SCALE);
                                terrainContainer?.addChild(grassSprite);
                                terrainContainer?.addChild(mountainSprite);
                                break;
                            }

                        case 'Road':
                            {
                                const bitmask = this.autotile(col, row, 'Road');
                                const texture = this.textureProvider.getAutoTileTexture('Road', bitmask);
                                const sprite = new Sprite(texture);
                                sprite.x = col * TILE_SIZE * SCALE;
                                sprite.y = row * TILE_SIZE * SCALE;
                                sprite.scale.set(SCALE);
                                terrainContainer?.addChild(sprite);
                                break;
                            }

                        case 'Bridge':
                            {
                                const bitmask = this.autotile(col, row, 'Road'); // TODO: Merge bridge with road?
                                const texture = this.textureProvider.getAutoTileTexture('Bridge', bitmask);
                                const sprite = new Sprite(texture);
                                sprite.x = col * TILE_SIZE * SCALE;
                                sprite.y = row * TILE_SIZE * SCALE;
                                sprite.scale.set(SCALE);
                                terrainContainer?.addChild(sprite);
                                break;
                            }

                        case 'Forest':
                            {
                                // TODO: Merge forest with mountain and grass?
                                const randomGrassVariant = Math.floor(Math.random() * 3);
                                const grassTexture = this.textureProvider.getTerrainTexture('Grass', randomGrassVariant);
                                const randomForestVariant = Math.floor(Math.random() * 2);
                                const forestOverlayTexture = this.textureProvider.getTerrainTexture('Forest', randomForestVariant);
                                const grassSprite = new Sprite(grassTexture);
                                grassSprite.x = col * TILE_SIZE * SCALE;
                                grassSprite.y = row * TILE_SIZE * SCALE;
                                grassSprite.scale.set(SCALE);
                                const forestSprite = new Sprite(forestOverlayTexture);
                                forestSprite.x = col * TILE_SIZE * SCALE;
                                forestSprite.y = row * TILE_SIZE * SCALE;
                                forestSprite.scale.set(SCALE);
                                terrainContainer?.addChild(grassSprite);
                                terrainContainer?.addChild(forestSprite);
                                break;
                            }

                        default:
                            throw new Error(`Unsupported terrain type: ${terrainTile.getType()}`);
                    }
                }
            }
        }
    }

    private renderBuildings(): void {
        const buildingLayerData = this.gameMap.getLayer('Building');
        const buildingContainer = this.layerContainers.get('Building');
        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const buildingTile = buildingLayerData[row * this.gameMap.mapWidth + col];
                const buildingType = buildingTile?.getType();
                const buildingOwner = buildingTile?.getColor();
                if (buildingTile) {
                    const texture = this.textureProvider.getBuildingTexture(buildingType, buildingOwner);
                    const sprite = new Sprite(texture);
                    sprite.x = col * TILE_SIZE * SCALE;
                    sprite.y = row * TILE_SIZE * SCALE;
                    sprite.scale.set(SCALE);
                    buildingContainer?.addChild(sprite);
                }
            }
        }
    }

    private renderUnits(): void {
        const unitLayerData = this.gameMap.getLayer('Unit');
        const unitContainer = this.layerContainers.get('Unit');
        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const unitTile = unitLayerData[row * this.gameMap.mapWidth + col];
                const unitType = unitTile?.getType();
                const unitOwner = unitTile?.getColor();
                if (unitTile) {
                    const texture = this.textureProvider.getUnitTexture(unitType, unitOwner);
                    const sprite = new Sprite(texture);
                    sprite.x = col * TILE_SIZE * SCALE;
                    sprite.y = row * TILE_SIZE * SCALE;
                    sprite.scale.set(SCALE);
                    unitContainer?.addChild(sprite);
                }
            }
        }
    }

    public updateUnits(): void {
        // To be called when unit move
        this.updateFlag |= 0b100; // Set bit 2 to indicate unit layer needs update
    }

    public updateBuildings(): void {
        // To be called when building is captured
        this.updateFlag |= 0b010; // Set bit 1 to indicate building layer needs update
    }
    


    public update(): void {
        switch (this.updateFlag) {
            case 0b001:
                this.renderTerrain();
                break;
            case 0b010:
                this.renderBuildings();
                break;
            case 0b100:
                this.renderUnits();
                break;
        }
        this.updateFlag = 0; // Reset the update flag after updating
    }
}
