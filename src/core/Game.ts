// Hold the state machine here and instantiate the main game components
import { Application, Container, Sprite } from 'pixi.js';
import { GameMap } from '../map/GameMap';
import { Renderer } from '../renderer/Renderer';
import { KennySpriteProvider } from '../sprites/KennyTextureProvider';
import { DEFAULT_MAP_DATA_PATH } from '../shared/constants';


export class Game {
    private app: Application | null = null;
    private gameMap: GameMap | null = null;
    private renderer: Renderer | null = null;
    private worldContainer: Container | null = null;

    constructor() { }

    async initialize(app: Application): Promise<void> {
        this.app = app;

        // Load spritesheet
        const spriteProvider = KennySpriteProvider.getInstance();
        await spriteProvider.loadAll();

        // // DEBUG
        // const sprite = new Sprite(spriteProvider.getTextureById(95));
        // sprite.scale.set(3);
        // this.app.stage.addChild(sprite); // Test rendering a sprite


        // Load map
        this.gameMap = new GameMap();
        // await this.gameMap.loadFromJSON("../assets/maps/test.json"); // DEBUG
        await this.gameMap.loadFromJSON(DEFAULT_MAP_DATA_PATH);


        // Setup renderer
        this.renderer = new Renderer(this.gameMap, spriteProvider);
        this.renderer.initialize();

        // Add renderer to stage
        this.worldContainer = new Container();
        this.worldContainer.addChild(this.renderer.rootContainer);
        this.app.stage.addChild(this.worldContainer);
    }

    gameLoop(_deltaTime: number): void {
        this.renderer?.update();
    }

    run(): void {
        // if (!this.app) {
        //     console.error('Game not initialized. Call initialize() first.');
        //     return;
        // }
        // this.app.ticker.add((ticker) => this.gameLoop(ticker.deltaTime));

        this.gameLoop(0); // initial render
    }
}