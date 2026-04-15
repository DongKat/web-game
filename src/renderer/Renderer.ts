import { Container, Sprite, Texture } from 'pixi.js';
import { TILE_SIZE, SCALE } from '../shared/constants';
import type { GameMap } from '../map/GameMap';
import type { ISpriteProvider } from '../sprites/ISpriteProvider';



export class Renderer {
    /** The root PixiJS container — add this to your scene */

    // Hold refrence to GameMap to read tile data from
    private gameMap: GameMap;
    private spriteProvider: ISpriteProvider;


    readonly rootContainer: Container;
    private layerContainers: Map<string, Container> = new Map();

    constructor(
        gameMap: GameMap,
        spriteProvider: ISpriteProvider,
    ) {
        this.gameMap = gameMap;
        this.spriteProvider = spriteProvider;
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
        
        
    }

}
