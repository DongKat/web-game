import { Container } from 'pixi.js';
import type { GameMap } from '../map/GameMap';
import type { ITextureProvider } from '../sprites/ITextureProvider';



export class Renderer {
    private gameMap: GameMap;
    // private spriteProvider: ITextureProvider;
    readonly rootContainer: Container;
    private layerContainers: Map<string, Container> = new Map();

    private static instance: Renderer;

    private textureProvider: ITextureProvider;



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
    }


    public renderTerrain(): void {
        // Terrain don't change so render once
        const terrainLayerData = this.gameMap.getLayer('Terrain');
        const terrainContainer = this.layerContainers.get('Terrain');
        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const terrainTile = terrainLayerData[row * this.gameMap.mapWidth + col];
                if (terrainTile) {
                }
            }
        }
    }



    public update(): void {
    }
}
