import { Application, Container } from 'pixi.js';
import { SpriteLoader } from './spriteLoader';
import { SpriteRenderer } from './spriteRenderer';
import { GameMap } from './gameMap';
import { GameMapManager } from './gameMapManager';

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

    console.log(`${map.name}: ${map.w}x${map.h}, ${loader.tileCount} tiles`);
}

main().catch(console.error);
