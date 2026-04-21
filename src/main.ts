import { Application } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';
import { GameStateMachine } from './core/GameStateMachine';
import './style.css';
import { DemoState } from './core/states/DemoState';


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

  // 2. Boot state machine with main menu
  const stateMachine = new GameStateMachine(app);
  // await stateMachine.changeState(new MainMenuState(stateMachine));
  await stateMachine.changeState(new DemoState());

  // 3. Run game loop through state machine
  app.ticker.add((ticker) => stateMachine.update(ticker.deltaTime));
}

main().catch(console.error);
