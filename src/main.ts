import { Application } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';

async function main(): Promise<void> {
    const app = new Application();
    await app.init({
        background: '#1a1a2e',
        resizeTo: window!,
        antialias: false,       // keep pixel-art crisp
        roundPixels: true,      // snap sprites to pixel grid
    });

    document.getElementById('app')!.appendChild(app.canvas);
    initDevtools({ app });

}

main().catch(console.error);