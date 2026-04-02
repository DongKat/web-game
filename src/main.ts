import { Application } from 'pixi.js';
import { Game } from './core/Game';
import { initDevtools } from '@pixi/devtools';


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

  const game = new Game();
  await game.initialize(app);
  game.run();

}

main().catch(console.error);
