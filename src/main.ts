import { Application, Container } from 'pixi.js';
import { SpriteLoader } from './spriteLoader';
import { SpriteRenderer } from './spriteRenderer';

async function main(): Promise<void> {
    const app = new Application();
    await app.init({
        background: '#1a1a2e',
        resizeTo: window,
        antialias: false,       // keep pixel-art crisp
        roundPixels: true,      // snap sprites to pixel grid
    });

    document.getElementById('app')!.appendChild(app.canvas);

    // The camera will move `world`. A HUD would go on a sibling of it, never
    // inside, or it pans off screen with the map.
    const world = new Container();
    app.stage.addChild(world);
    world.scale.set(4);         // integer scale only, or 16px tiles blur

    const loader = await SpriteLoader.load();
    const renderer = new SpriteRenderer(loader, world);

    const grass = renderer.draw('terrain.grass', 0, 0, 'terrain');
    const tank = renderer.draw('unit.tank.green', 1, 0, 'unit');

    console.log(loader.tileCount, 'tiles labelled');
    console.log(grass.label, grass.x, grass.y);
    console.log(tank.label, tank.x, tank.y);
}

main().catch(console.error);
