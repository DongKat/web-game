// Hold the state machine here and instantiate the main game components (TileMap, TileMapRenderer, OverlayMap, etc.)
import { Application, Container } from 'pixi.js';
import { TileMap } from '../map/GameMap';
import { LayeredTileRenderer } from '../renderer/MapRenderer';
import { OverlayMap } from '../ui/OverlayMap';
import { MovementSystem } from '../systems/MovementSystem';
import { InputManager } from '../core/InputManager';
import { AssetLoader } from '../core/AssetLoader';

const TILEMAP_LAYER_ORDER = ['Terrain', 'Objects', 'Vehicles'] as const;
const OVERLAY_LAYER_ORDER = ['Effects', 'UI'] as const;


export class Game {
    private app: Application | null = null;
    private assetLoader: AssetLoader | null = null;
    private tileMap: TileMap | null = null;
    private tileMapRenderer: LayeredTileRenderer | null = null;
    private overlayMap: OverlayMap | null = null;
    private movementSystem: MovementSystem | null = null;
    private overlayRenderer: LayeredTileRenderer | null = null;

    private worldContainer: Container | null = null;

    private instance: Game | null = null;
    constructor() { }
    getInstance(): Game {
        if (!this.instance) {
            this.instance = new Game();
        }
        return this.instance;
    }

    async initialize(app: Application): Promise<void> {
        this.app = app;
        this.assetLoader = new AssetLoader();
        const assets = await AssetLoader.loadAll();
        this.tileMap = new TileMap(assets.mapData);
        this.tileMapRenderer = new LayeredTileRenderer(
            this.tileMap,
            assets.tileTextures,
            TILEMAP_LAYER_ORDER,
            'TileMapRenderer'
        );
        this.overlayMap = new OverlayMap(this.tileMap.width, this.tileMap.height);
        this.movementSystem = new MovementSystem(this.tileMap, this.overlayMap);
        this.overlayRenderer = new LayeredTileRenderer(
            this.overlayMap,
            assets.tileTextures,
            OVERLAY_LAYER_ORDER,
            'OverlayRenderer'
        );

        this.worldContainer = new Container();
        this.worldContainer.addChild(this.tileMapRenderer.container);
        this.worldContainer.addChild(this.overlayRenderer.container);
        this.app.stage.addChild(this.worldContainer);

        InputManager.getInstance().init(window, this.app.view);
        InputManager.getInstance().bindAction('move_up', ['ArrowUp', 'KeyW']);
        InputManager.getInstance().bindAction('move_down', ['ArrowDown', 'KeyS']);
        InputManager.getInstance().bindAction('move_left', ['ArrowLeft', 'KeyA']);
        InputManager.getInstance().bindAction('move_right', ['ArrowRight', 'KeyD']);
        InputManager.getInstance().bindAction('select', ['Enter', 'Space', 'KeyZ']);
        InputManager.getInstance().bindAction('cancel', ['Escape', 'KeyX']);



    }

    async testInitialization(): Promise<void> {
        if (!this.tileMap) {
            throw new Error('TileMap not initialized');
            return;
        }
        if (!this.overlayMap) {
            throw new Error('OverlayMap not initialized');
            return;
        }
        if (!this.movementSystem) {
            throw new Error('MovementSystem not initialized');
            return;
        }
        if (!this.tileMapRenderer) {
            throw new Error('TileMapRenderer not initialized');
            return;
        }
        if (!this.overlayRenderer) {
            throw new Error('OverlayRenderer not initialized');
            return;
        }
        console.log('✅ All game components initialized successfully');
    }

    // Sub loop when player select a unit, show movement range, and can move the unit around
    selectUnitLoop(deltaTime: number): void {
        if (!this.movementSystem || !this.overlayMap) return;
        
        
    
    }



    gameLoop(deltaTime: number): void {
        if (!this.movementSystem || !this.overlayMap) return;


        // Hook up InputManager
        const inputManager = InputManager.getInstance();
        // Cursor movement
        // TODO: Implement for mouse
        let cursorPosition = this.overlayMap.cursorPosition || { col: 0, row: 0 };
        switch (true) {
            case inputManager.isActionPressed('move_up'):
                // console.log('Moving cursor up');
                cursorPosition = { col: cursorPosition!.col, row: cursorPosition!.row - 1 };
                break;
            case inputManager.isActionPressed('move_down'):
                // console.log('Moving cursor down');
                cursorPosition = { col: cursorPosition!.col, row: cursorPosition!.row + 1 };
                break;
            case inputManager.isActionPressed('move_left'):
                // console.log('Moving cursor left');
                cursorPosition = { col: cursorPosition!.col - 1, row: cursorPosition!.row };
                break;
            case inputManager.isActionPressed('move_right'):
                // console.log('Moving cursor right');
                cursorPosition = { col: cursorPosition!.col + 1, row: cursorPosition!.row };
                break;
        }
        this.overlayMap.moveCursor(cursorPosition!.col, cursorPosition!.row);

        // Select a unit and show movement range
        if (inputManager.isActionDown('select')) {
            // Get cursor position
            const cursorPos = this.overlayMap.cursorPosition;
            if (cursorPos) {
                const { col, row } = cursorPos;
                const unitId = this.tileMap?.getTile(col, row, 'Vehicles');
                if (unitId !== 0) {
                    console.log(`Selected unit ${unitId} at (${col}, ${row})`);
                    this.overlayMap.setMovementRangeHighlight(col, row, 2);
                }
            }
            else {
                throw new Error('Cursor position is null somehow!');
            }
        }

        if (inputManager.isActionDown('cancel')) {
            this.overlayMap.clearMovementRangeHighlight();
        }

        







        inputManager.update();
        // Draw map
        this.tileMapRenderer?.refresh();
        // Draw overlays (movement range, cursor)
        this.overlayRenderer?.refresh();
    }

    run(): void {
        if (!this.app) {
            console.error('Game not initialized. Call initialize() first.');
            return;
        }
        this.app.ticker.add((ticker) => this.gameLoop(ticker.deltaTime));

        this.gameLoop(0); // initial render
    }
}