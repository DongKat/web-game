import { Application, Container } from 'pixi.js';
import { SpriteLoader } from './spriteLoader';
import { SpriteRenderer } from './spriteRenderer';
import { GameMap } from './gameMap';
import { GameMapManager } from './gameMapManager';
import { InputManager } from './inputManager';
import { Cursor } from './cursor';
import { ActionController, HoverState } from './actionState';
import { Player } from './player';
import { loadDefs } from './defsLoader';
import { TurnManager } from './turnManager';
import { AI } from './ai';
import { UIManager } from './uiManager';

async function main(): Promise<void> {
    const app = new Application();
    await app.init({
        background: '#1a1a2e',
        resizeTo: window,
        antialias: false,
        roundPixels: true,
    });

    document.getElementById('app')!.appendChild(app.canvas);

    const world = new Container();
    app.stage.addChild(world);
    world.scale.set(4);

    // Load entity definitions
    const defs = await loadDefs();

    const loader = await SpriteLoader.load();
    const renderer = new SpriteRenderer(loader, world);
    const map = await GameMap.load('/maps/aiSkirmish.json');
    const manager = new GameMapManager(map, loader, renderer);
    
    manager.drawAll();
    
    const cursor = new Cursor(manager);
    cursor.moveTo(0, 0);

    const players = [
        new Player('blue', 'Player 1', true, 0),
        new Player('red', 'Player 2', false, 0),
    ];
    const input = new InputManager(app, world, cursor, map);
    const controller = new ActionController(players[0], manager, input, defs);
    const turnManager = new TurnManager(players, manager, controller);
    controller.turnManager = turnManager;

    const appEl = document.getElementById('app')!;
    const ui = new UIManager(appEl, manager, defs);
    ui.updateTurn(turnManager);
    ui.updatePhase('move');

    input.on('cellhover', (c, r) => {
        cursor.moveTo(c, r);
        controller.onHover(c, r);
        ui.updateHover(c, r, turnManager);
    });

    input.on('cellselect', (c, r) => {
        cursor.moveTo(c, r);
        controller.onSelect(c, r);
    });

    input.on('cancel', () => {
        controller.onCancel();
    });

    const ai = new AI(controller, manager, defs, turnManager);

    // One end-of-turn path for both humans and the AI, so an AI turn ends exactly the
    // way a human's does. Recursive: an AI turn ends by calling back into this.
    function endTurn(): void {
        turnManager.endTurn();
        controller.transition(new HoverState(controller, manager));
        ui.updateTurn(turnManager);
        ui.updatePhase('move');

        const victor = turnManager.winner();
        if (victor) {
            controller.onWin?.(victor);
            return;
        }

        const next = turnManager.activePlayer;
        if (!next.human) {
            ai.takeTurn(next).then(() => {
                if (!turnManager.winner()) endTurn();
            });
        }
    }

    input.on('endturn', endTurn);

    controller.onPhaseChange = (phase: string) => {
        ui.updatePhase(phase);
        ui.updateTurn(turnManager);
    };

    controller.onWin = (victor) => {
        input.disable();
        ui.showWinner(victor);
    };

    console.log(`${map.name}: ${map.w}x${map.h}, ${loader.tileCount} tiles`);
}

main().catch(console.error);
