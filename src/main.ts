import { Application, Container } from 'pixi.js';
import { SpriteLoader } from './spriteLoader';
import { SpriteRenderer } from './spriteRenderer';
import { GameMap } from './gameMap';
import { GameMapManager } from './gameMapManager';
import { InputManager } from './inputManager';
import { Cursor } from './cursor';
import { ActionController } from './actionState';
import { Player } from './player';

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

    const loader = await SpriteLoader.load();
    const renderer = new SpriteRenderer(loader, world);
    const map = await GameMap.load('/maps/demo.json');
    const manager = new GameMapManager(map, loader, renderer);
    
    manager.drawAll();
    
    const cursor = new Cursor(manager);
    cursor.moveTo(0, 0);

    const player = new Player('blue', 'Player 1', true, 0);
    const input = new InputManager(app, world, cursor, map);

    const controller = new ActionController(player, manager, input);

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

    console.log(`${map.name}: ${map.w}x${map.h}, ${loader.tileCount} tiles`);
}

main().catch(console.error);
