import { Container, Sprite, Texture } from 'pixi.js';
import { TILE_SIZE, SCALE } from '../shared/constants';
import type { GameMap } from '../map/GameMap';
// import type { ITextureProvider } from '../sprites/ITextureProvider';



export class Renderer {
    private gameMap: GameMap;
    // private spriteProvider: ITextureProvider;
    readonly rootContainer: Container;
    private layerContainers: Map<string, Container> = new Map();

    constructor(
        gameMap: GameMap,
        // spriteProvider: ITextureProvider,
    ) {
        this.gameMap = gameMap;
        // this.spriteProvider = spriteProvider;
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

    public update(): void {
        // Render each layer in order
        this.renderLayer('Terrain');
        this.renderLayer('Building');
        this.renderLayer('Unit');
        this.renderLayer('Shadows');
        this.renderLayer('Effects');
        this.renderLayer('UI');
    }

    private renderLayer(layerName: string): void {
        const layerContainer = this.layerContainers.get(layerName);
        if (!layerContainer) {
            throw new Error(`Layer container for ${layerName} not found`);
        }
        layerContainer.removeChildren(); // Clear previous frame

        const { width, height } = this.gameMap.getMapSize();
        const layerData = this.gameMap.getLayer(layerName as any);

        for (let colIdx = 0; colIdx < width; colIdx++) {
            for (let rowIdx = 0; rowIdx < height; rowIdx++) {
                const entity = layerData[rowIdx * width + colIdx];
                if (entity) {
                    const entityTexture : Texture = entity.getTexture(); // TODO: Re think about this
                    const sprite = new Sprite(entityTexture);
                    sprite.x = colIdx * TILE_SIZE * SCALE;
                    sprite.y = rowIdx * TILE_SIZE * SCALE;
                    sprite.scale.set(SCALE);
                    layerContainer.addChild(sprite);
                }
            }
        }
    }

}
