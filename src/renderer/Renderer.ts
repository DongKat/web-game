import { Container, Sprite } from 'pixi.js';
import { TILE_SIZE, SCALE } from '../shared/constants';
import type { GameMap } from '../map/GameMap';
import { Terrain } from '../types/Terrain';
import { Unit } from '../types/Unit';
import type { ITextureProvider } from '../sprites/ITextureProvider';
import type { TeamColor, UnitType } from '../shared/constants';



export class Renderer {
    private gameMap: GameMap;
    readonly rootContainer: Container;
    private layerContainers: Map<string, Container> = new Map();

    private textureProvider: ITextureProvider;

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
    }

    public getLayerContainer(name: string): Container | undefined {
        return this.layerContainers.get(name);
    }

    private autoTile(col: number, row: number, terrainType: string): number {
        let bitmask = 0;
        const neighbors = [
            { dCol: 0, dRow: -1 }, // N
            { dCol: 1, dRow: 0 },  // E
            { dCol: 0, dRow: 1 },  // S
            { dCol: -1, dRow: 0 }, // W
        ];

        neighbors.forEach((neighbor, index) => {
            const neighborTile = this.gameMap.getTile(col + neighbor.dCol, row + neighbor.dRow, 'Terrain');
            if (neighborTile && neighborTile.getType() === terrainType) {
                bitmask |= (1 << index);
            }
        });

        return bitmask;
    }


    renderTerrain(): void {
        const terrainLayer = this.layerContainers.get('Terrain');
        if (!terrainLayer) {
            throw new Error("Terrain layer container not found");
        }

        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const terrainEntity = this.gameMap.getTile(col, row, 'Terrain');
                if (!terrainEntity) {
                    continue;
                }

                const terrainType = terrainEntity.getType();
                switch (terrainType) {
                    case 'Grass': {
                        // Random variant 0 - 2
                        const variant = Math.floor(Math.random() * 3);
                        const grassTexture = this.textureProvider.getTerrainTexture('Grass', variant);
                        const sprite = new Sprite(grassTexture);
                        sprite.x = col * TILE_SIZE * SCALE;
                        sprite.y = row * TILE_SIZE * SCALE;
                        sprite.scale.set(SCALE);
                        sprite.texture.source.scaleMode = 'nearest';

                        terrainLayer.addChild(sprite);
                        break;
                    }

                    case 'Mountain': {
                        // Combine grass + mountain textures
                        const grassBase = this.textureProvider.getTerrainTexture('Grass', 0);
                        const mountainOverlay = this.textureProvider.getTerrainTexture('Mountain', 0);
                        const grassSprite = new Sprite(grassBase);
                        grassSprite.x = col * TILE_SIZE * SCALE;
                        grassSprite.y = row * TILE_SIZE * SCALE;
                        grassSprite.scale.set(SCALE);
                        grassSprite.texture.source.scaleMode = 'nearest';

                        const mountainSprite = new Sprite(mountainOverlay);
                        mountainSprite.x = col * TILE_SIZE * SCALE;
                        mountainSprite.y = row * TILE_SIZE * SCALE;
                        mountainSprite.scale.set(SCALE);
                        mountainSprite.texture.source.scaleMode = 'nearest';

                        terrainLayer.addChild(grassSprite);
                        terrainLayer.addChild(mountainSprite);
                        break;
                    }

                    case 'Water': {
                        const bitmask = this.autoTile(col, row, 'Water');

                        // TODO: Debug this :v
                        const waterTexture = this.textureProvider.getTerrainTexture('Water', bitmask);
                        const waterSprite = new Sprite(waterTexture);
                        waterSprite.x = col * TILE_SIZE * SCALE;
                        waterSprite.y = row * TILE_SIZE * SCALE;
                        waterSprite.scale.set(SCALE);
                        waterSprite.texture.source.scaleMode = 'nearest';

                        terrainLayer.addChild(waterSprite);
                        break;
                    }

                    case 'Road': {
                        const bitmask = this.autoTile(col, row, 'Road');

                        const roadTexture = this.textureProvider.getTerrainTexture('Road', bitmask);
                        const roadSprite = new Sprite(roadTexture);
                        roadSprite.x = col * TILE_SIZE * SCALE;
                        roadSprite.y = row * TILE_SIZE * SCALE;
                        roadSprite.scale.set(SCALE);
                        roadSprite.texture.source.scaleMode = 'nearest';

                        terrainLayer.addChild(roadSprite);
                        break;
                    }

                    case 'Bridge': {
                        // Check terrain data for bridge variant
                        const bridgeData = terrainEntity instanceof Terrain ? terrainEntity.data : null;
                        const variant = bridgeData ? 0 : 0; // default to vertical
                        const bridgeTexture = this.textureProvider.getTerrainTexture('Bridge', variant);
                        const bridgeSprite = new Sprite(bridgeTexture);
                        bridgeSprite.x = col * TILE_SIZE * SCALE;
                        bridgeSprite.y = row * TILE_SIZE * SCALE;
                        bridgeSprite.scale.set(SCALE);
                        bridgeSprite.texture.source.scaleMode = 'nearest';
                        terrainLayer.addChild(bridgeSprite);
                        break;
                    }



                    case 'Forest': {
                        const variant = Math.floor(Math.random() * 2);

                        const grassBase = this.textureProvider.getTerrainTexture('Grass', 0);
                        const treeOverlay = this.textureProvider.getTerrainTexture('Forest', variant);

                        const grassSprite = new Sprite(grassBase);
                        grassSprite.x = col * TILE_SIZE * SCALE;
                        grassSprite.y = row * TILE_SIZE * SCALE;
                        grassSprite.scale.set(SCALE);
                        grassSprite.texture.source.scaleMode = 'nearest';

                        const treeSprite = new Sprite(treeOverlay);
                        treeSprite.x = col * TILE_SIZE * SCALE;
                        treeSprite.y = row * TILE_SIZE * SCALE;
                        treeSprite.scale.set(SCALE);
                        treeSprite.texture.source.scaleMode = 'nearest';

                        terrainLayer.addChild(grassSprite);
                        terrainLayer.addChild(treeSprite);
                        break;
                    }
                    default:
                        console.warn(`Unknown terrain type: ${terrainType} at (${col}, ${row})`);
                }




            }
        }
    }

    renderUnits(): void {
        const unitContainer = this.layerContainers.get('Unit');
        if (!unitContainer) return;
        unitContainer.removeChildren();

        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const unitEntity = this.gameMap.getTile(col, row, 'Unit');
                if (!unitEntity || !(unitEntity instanceof Unit)) continue;

                const unit = unitEntity;
                const unitTexture = this.textureProvider.getUnitTexture(
                    unit.data.unitType as UnitType,
                    unit.data.team as TeamColor,
                );
                const sprite = new Sprite(unitTexture);
                sprite.x = col * TILE_SIZE * SCALE;
                sprite.y = row * TILE_SIZE * SCALE;
                sprite.scale.set(SCALE);
                sprite.texture.source.scaleMode = 'nearest';

                // Exhausted units get dimmed
                if (unit.exhausted) {
                    sprite.alpha = 0.4;
                }

                unitContainer.addChild(sprite);

                // Render shadow under the unit
                const shadowContainer = this.layerContainers.get('Shadows');
                if (shadowContainer) {
                    const shadowTexture = this.textureProvider.getUITexture('Shadow');
                    const shadowSprite = new Sprite(shadowTexture);
                    shadowSprite.x = col * TILE_SIZE * SCALE;
                    shadowSprite.y = row * TILE_SIZE * SCALE;
                    shadowSprite.scale.set(SCALE);
                    shadowSprite.texture.source.scaleMode = 'nearest';
                    shadowSprite.alpha = 0.3;
                    shadowContainer.addChild(shadowSprite);
                }
            }
        }
    }

    clearLayer(layerName: string): void {
        const container = this.layerContainers.get(layerName);
        if (container) container.removeChildren();
    }

    public update(): void {
        this.clearLayer('Shadows');
        this.renderUnits();
    }
}
