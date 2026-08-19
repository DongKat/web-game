import { Container, Sprite } from 'pixi.js';
import { LAYER_ORDER, TILE_SIZE } from './constant';
import type { SpriteLoader } from './spriteLoader';

export type LayerName = typeof LAYER_ORDER[number];

/**
 * Puts sprites on the right layer, and nothing else.
 *
 * Deliberately stateless beyond the layer table: `draw` hands the sprite back and
 * forgets it, so the caller owns it (the map owns terrain, an entity owns its unit
 * sprite). Nothing here can answer "what is at cell (3,5)?" -- that truth belongs
 * to the map, not to the display list.
 */
export class SpriteRenderer {
    readonly world: Container;
    private readonly loader: SpriteLoader;
    private readonly layers: Map<LayerName, Container>;

    constructor(loader: SpriteLoader, world: Container) {
        this.loader = loader;
        this.world = world;
        this.layers = new Map();

        // All layers up front, in declared order -- lazy creation would let
        // z-order follow first use, which puts terrain over units.
        for (const name of LAYER_ORDER) {
            const container = new Container();
            container.label = `layer:${name}`;
            this.layers.set(name, container);
            world.addChild(container);
        }
    }

    layer(name: LayerName): Container {
        const container = this.layers.get(name);
        if (!container) throw new Error(`unknown layer "${name}" (have: ${LAYER_ORDER.join(', ')})`);
        return container;
    }

    /** Place a labelled tile at a grid cell. Returns the sprite; the caller owns it. */
    draw(name: string, col: number, row: number, layer: LayerName, variant = 0): Sprite {
        const sprite = new Sprite(this.loader.byName(name, variant));
        sprite.label = name;                                  // shows up in @pixi/devtools
        sprite.position.set(col * TILE_SIZE, row * TILE_SIZE);
        this.layer(layer).addChild(sprite);
        return sprite;
    }

    /**
     * Detach every sprite on a layer. Not destroyed -- textures belong to the
     * loader, so the sprites are plain objects the GC can take.
     */
    clear(layer: LayerName): void {
        this.layer(layer).removeChildren();
    }
}
