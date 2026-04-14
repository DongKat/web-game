import { Container, Sprite, Texture } from 'pixi.js';
import { AssetLoader } from '../sprites/KennySpriteProvider';
import { TILE_SIZE, SCALE } from '../shared/constants';

export class LayeredTileRenderer {
  /** The root PixiJS container — add this to your scene */
  readonly container: Container;

  private textures: Map<number, Texture>;
  private source: ITileSource;
  private layerOrder: readonly string[];

  /** One sub-container per layer, in render order */
  private layerContainers: Map<string, Container> = new Map();

  constructor(
    source: ITileSource,
    textures: Map<number, Texture>,
    layerOrder: readonly string[],
    label: string = 'LayeredTileRenderer'
  ) {
    this.source = source;
    this.textures = textures;
    this.layerOrder = layerOrder;
    this.container = new Container();
    this.container.label = label;

    this.buildLayers();
  }

  /**
   * Build all layer containers and populate them with sprites.
   */
  private buildLayers(): void {
    for (const layerName of this.layerOrder) {
      const layerContainer = new Container();
      layerContainer.label = `Layer:${layerName}`;
      this.container.addChild(layerContainer);
      this.layerContainers.set(layerName, layerContainer);

      this.renderLayer(layerName, layerContainer);
    }
  }

  /**
   * Iterate every cell of the given layer and create a Sprite
   * for each non-empty tile.
   */
  private renderLayer(layerName: string, container: Container): void {
    const { width, height } = this.source;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const tiledId = this.source.getTile(col, row, layerName);
        if (tiledId === 0) continue; // empty cell — skip

        const texture = AssetLoader.getTileTextureByTiledId(
          this.textures,
          tiledId
        );
        if (!texture) continue;

        const sprite = new Sprite(texture);

        // Position: col/row → pixel coords scaled up
        sprite.x = col * TILE_SIZE * SCALE;
        sprite.y = row * TILE_SIZE * SCALE;

        // Scale the 16×16 pixel-art tile up to display size
        sprite.scale.set(SCALE);

        // Disable texture smoothing — critical for pixel art!
        sprite.texture.source.scaleMode = 'nearest';

        container.addChild(sprite);
      }
    }
  }

  /**
   * Refresh a single layer (e.g., after a unit moves or a building is captured).
   * Clears the layer container and re-renders it from the current map state.
   */
  refreshLayer(layerName: string): void {
    const container = this.layerContainers.get(layerName);
    if (!container) return;

    container.removeChildren();
    this.renderLayer(layerName, container);
  }

  /**
   * Full re-render of all layers.
   * Use sparingly — prefer refreshLayer() for targeted updates.
   */
  refresh(): void {
    for (const layerName of this.layerOrder) {
      this.refreshLayer(layerName);
    }
  }
}
