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
    const map = await GameMap.load('/maps/battleDemo.json');
    const manager = new GameMapManager(map, loader, renderer);
    
    manager.drawAll();
    
    const cursor = new Cursor(manager);
    cursor.moveTo(0, 0);

    const players = [
        new Player('blue', 'Player 1', true, 0),
        new Player('red', 'Player 2', true, 0),
    ];
    const input = new InputManager(app, world, cursor, map);
    const controller = new ActionController(players[0], manager, input, defs);
    const turnManager = new TurnManager(players, manager, controller);
    controller.turnManager = turnManager;

    input.on('cellhover', (c, r) => {
        cursor.moveTo(c, r);
        controller.onHover(c, r);
    });

    input.on('cellselect', (c, r) => {
        cursor.moveTo(c, r);
        controller.onSelect(c, r);
    });

    input.on('cancel', () => {
        controller.onCancel();
    });

    input.on('endturn', () => {
        turnManager.endTurn();
        controller.transition(new HoverState(controller, manager));
        console.log(`Turn ${turnManager.turnCount} — ${turnManager.activePlayer.name}'s turn (funds: ${turnManager.activePlayer.funds})`);

        
        const victor = turnManager.winner();
        if (victor) {
            input.disable();
            console.log(`${victor.name} wins!`);
        }
    });

    console.log(`${map.name}: ${map.w}x${map.h}, ${loader.tileCount} tiles`);
    console.log(`Turn ${turnManager.turnCount} — ${turnManager.activePlayer.name}'s turn`);
}

main().catch(console.error);
