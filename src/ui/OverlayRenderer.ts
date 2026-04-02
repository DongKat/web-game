// Move rendering of UI layer (cursor, highlights) from TileMapRenderer

import { Container, Texture, Sprite } from 'pixi.js';
import { TileMap } from '../map/TileMap';
import { AssetLoader } from '../core/AssetLoader';
import { TILE_SIZE, SCALE, TILE_ID_MAP } from '../core/constants';
import type { OverlayMap } from './OverlayMap';

const LAYER_ORDER = ['UI', 'Effects'] as const;

export class OverlayRenderer {
    /** The root PixiJS container — add this to your scene */
    readonly container: Container;

    private overlayTexture: Map<number, Texture>;
    private overlayMap: OverlayMap;

    /** One sub-container per layer, in render order */
    private layerContainers: Map<string, Container> = new Map();

    constructor(overlayMap: OverlayMap, overlayTexture: Map<number, Texture>) {
        this.overlayMap = overlayMap;
        this.overlayTexture = overlayTexture;
        this.container = new Container();
        this.container.label = 'TileMapRenderer';

        this.buildLayers();
    }

    /**
     * Build all layer containers and populate them with sprites.
     */
    private buildLayers(): void {
        for (const layerName of LAYER_ORDER) {
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
        const { width, height } = this.overlayMap;

        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const tiledId = this.overlayMap.getTile(col, row, layerName);
                if (tiledId === 0) continue; // empty cell — skip

                const texture = AssetLoader.getTileTextureByTiledId(
                    this.overlayTexture,
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
     * Clears the layer container and re-renders it from the current TileMap state.
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
        for (const layerName of LAYER_ORDER) {
            this.refreshLayer(layerName);
        }
    }
}