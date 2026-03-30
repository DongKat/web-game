import { Application, Container, Sprite } from 'pixi.js';
import { AssetLoader } from './core/AssetLoader';
import { TileMapRenderer } from './map/TileMapRenderer';
import { TileMap } from './map/TileMap';
// import { Camera } from './core/Camera';
// import { InputManager } from './core/InputManager';
// import { TILE_SIZE, SCALE } from './core/constants';

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
  // 2. Load assets (spritesheet + map data)
  const assets = await AssetLoader.loadAll();

  // 3. Create game world container (this is what the camera moves)
  const worldContainer = new Container();
  app.stage.addChild(worldContainer);

  // 4. Parse the tilemap
  const tileMap = new TileMap(assets.mapData);

  // 5. Render the tilemap
  const tileMapRenderer = new TileMapRenderer(tileMap, assets.tileTextures);
  worldContainer.addChild(tileMapRenderer.container);

  // // 6. Set up camera (panning with arrow keys / drag)
  // const camera = new Camera(worldContainer, app.screen);
  // camera.setBounds(
  //   tileMap.width * TILE_SIZE * SCALE,
  //   tileMap.height * TILE_SIZE * SCALE
  // );

  // // 7. Set up input
  // const inputManager = new InputManager(app.canvas as HTMLCanvasElement, camera);

  // // 8. Game loop — for now just handles camera updates
  // app.ticker.add((ticker) => {
  //   inputManager.update();
  //   camera.update(ticker.deltaTime);
  // });

  console.log(
    `🎮 Game initialized! Map: ${tileMap.width}×${tileMap.height} tiles`
  );
}

main().catch(console.error);
