import { Application } from 'pixi.js';
import { Game } from './core/Game';
import { initDevtools } from '@pixi/devtools';
import { InputManager } from './core/InputManager.ts';


async function main(): Promise<void> {
    // 1. Create PixiJS Application
    const app = new Application();
    await app.init({
        background: '#1a1a2e',
        resizeTo: window!,
        antialias: false,       // keep pixel-art crisp
        roundPixels: true,      // snap sprites to pixel grid
    });

    document.getElementById('app')!.appendChild(app.canvas);
    initDevtools({ app });

    window.__PIXI_DEVTOOLS__ = {
        app: app,
    };

    // Init InputManager
    InputManager.getInstance().init(window, app.canvas);
    InputManager.bindAction('select', ['KeyZ', 'Enter']);
    InputManager.bindAction('cancel', ['KeyX', 'Escape']);
    InputManager.bindAction('up', ['ArrowUp', 'KeyW']);
    InputManager.bindAction('down', ['ArrowDown', 'KeyS']);
    InputManager.bindAction('left', ['ArrowLeft', 'KeyA']);
    InputManager.bindAction('right', ['ArrowRight', 'KeyD']);
    




    const game = new Game();
    await game.initialize(app);
    game.run();

}

main().catch(console.error);
