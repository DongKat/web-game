import { Application, Container } from 'pixi.js';
import { TileMap } from '../map/TileMap';
import { TileMapRenderer } from '../map/TileMapRenderer';
import { OverlayMap } from '../ui/OverlayMap';
import { OverlayRenderer } from '../ui/OverlayRenderer';
import { MovementSystem } from '../systems/MovementSystem';
import { InputManager } from '../core/InputManager';
import { AssetLoader } from '../core/AssetLoader';
import { GameStateMachine } from '../core/GameStateMachine';
import type { GameContext } from '../core/GameContext';
import { IdleState } from '../states/IdleState';
import { UnitSelectedState } from '../states/UnitSelectedState';
import { MovingUnitState } from '../states/MovingUnitState';
import { ActionMenuState } from '../states/ActionMenuState';
import { SelectingTargetState } from '../states/SelectingTargetState';
import { CombatResolveState } from '../states/CombatResolveState';

export class Game {
    private app: Application | null = null;
    private inputManager = InputManager.getInstance();

    private tileMapRenderer: TileMapRenderer | null = null;
    private overlayRenderer: OverlayRenderer | null = null;

    private stateMachine: GameStateMachine | null = null;

    private static instance: Game | null = null;

    private constructor() { }

    static getInstance(): Game {
        if (!Game.instance) {
            Game.instance = new Game();
        }
        return Game.instance;
    }

    async initialize(app: Application): Promise<void> {
        this.app = app;
        const assets = await AssetLoader.loadAll();

        const tileMap = new TileMap(assets.mapData);
        const tileMapRenderer = new TileMapRenderer(tileMap, assets.tileTextures);
        const overlayMap = new OverlayMap(tileMap.width, tileMap.height);
        const movementSystem = new MovementSystem(tileMap, overlayMap);
        const overlayRenderer = new OverlayRenderer(overlayMap, assets.tileTextures);

        this.tileMapRenderer = tileMapRenderer;
        this.overlayRenderer = overlayRenderer;

        // Scene graph
        const worldContainer = new Container();
        worldContainer.addChild(tileMapRenderer.container);
        worldContainer.addChild(overlayRenderer.container);
        this.app.stage.addChild(worldContainer);

        // Input bindings
        this.inputManager.init(window, this.app.view);
        this.inputManager.bindAction('move_up', ['ArrowUp', 'KeyW']);
        this.inputManager.bindAction('move_down', ['ArrowDown', 'KeyS']);
        this.inputManager.bindAction('move_left', ['ArrowLeft', 'KeyA']);
        this.inputManager.bindAction('move_right', ['ArrowRight', 'KeyD']);
        this.inputManager.bindAction('select', ['Enter', 'Space', 'KeyZ']);
        this.inputManager.bindAction('cancel', ['Escape', 'KeyX']);

        // Build shared context
        const context: GameContext = {
            inputManager: this.inputManager,
            tileMap,
            tileMapRenderer,
            overlayMap,
            overlayRenderer,
            movementSystem,
        };

        // State machine
        this.stateMachine = new GameStateMachine('idle', context);
        this.stateMachine.registerState('idle', new IdleState());
        this.stateMachine.registerState('unitSelected', new UnitSelectedState());
        this.stateMachine.registerState('movingUnit', new MovingUnitState());
        this.stateMachine.registerState('actionMenu', new ActionMenuState());
        this.stateMachine.registerState('selectingTarget', new SelectingTargetState());
        this.stateMachine.registerState('combatResolve', new CombatResolveState());
        this.stateMachine.start();
    }

    async testInitialization(): Promise<void> {
        if (!this.stateMachine) {
            throw new Error('Game not initialized — call initialize() first');
        }
        if (!this.tileMapRenderer) {
            throw new Error('TileMapRenderer not initialized');
        }
        if (!this.overlayRenderer) {
            throw new Error('OverlayRenderer not initialized');
        }
        console.log('✅ All game components initialized successfully');
    }

    gameLoop(deltaTime: number): void {
        // 1. Update: state machine reads input + runs game logic
        this.stateMachine!.update(deltaTime);
        // 2. Render: pure state → sprite rebuild
        this.tileMapRenderer!.refresh();
        this.overlayRenderer!.refresh();
        // 3. End-of-frame: reset pressed/released flags
        this.inputManager.update();
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