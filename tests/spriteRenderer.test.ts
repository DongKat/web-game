import { Container } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LAYER_ORDER, TILE_SIZE } from '../src/constant';
import type { SpriteLoader } from '../src/spriteLoader';
import { SpriteRenderer } from '../src/spriteRenderer';
import { loadTestLoader } from './testFixture';

let loader: SpriteLoader;
let world: Container;
let renderer: SpriteRenderer;

beforeEach(async () => {
    loader = await loadTestLoader();
    world = new Container();
    renderer = new SpriteRenderer(loader, world);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('layers', () => {
    it('builds every layer up front', () => {
        expect(world.children).toHaveLength(LAYER_ORDER.length);
    });

    it('adds them in declared order, so z-order cannot follow first use', () => {
        expect(world.children.map(c => c.label)).toEqual(LAYER_ORDER.map(n => `layer:${n}`));
    });

    it('puts terrain behind units', () => {
        const order = world.children.map(c => c.label);
        expect(order.indexOf('layer:terrain')).toBeLessThan(order.indexOf('layer:unit'));
    });

    it('returns the same container each time', () => {
        expect(renderer.layer('terrain')).toBe(renderer.layer('terrain'));
    });

    it('keeps the HUD out, since it must not pan with the world', () => {
        expect(LAYER_ORDER).not.toContain('ui');
    });
});

describe('draw', () => {
    it('converts grid cells to pixels', () => {
        const sprite = renderer.draw('terrain.grass', 3, 5, 'terrain');
        expect([sprite.x, sprite.y]).toEqual([3 * TILE_SIZE, 5 * TILE_SIZE]);
    });

    it('places cell (0,0) at the origin', () => {
        const sprite = renderer.draw('terrain.grass', 0, 0, 'terrain');
        expect([sprite.x, sprite.y]).toEqual([0, 0]);
    });

    it('parents the sprite to the named layer only', () => {
        const sprite = renderer.draw('unit.tank.red', 1, 1, 'unit');
        expect(renderer.layer('unit').children).toContain(sprite);
        expect(renderer.layer('terrain').children).toHaveLength(0);
        expect(sprite.parent).toBe(renderer.layer('unit'));
    });

    it('uses the loader texture rather than making its own', () => {
        const sprite = renderer.draw('unit.tank.red', 0, 0, 'unit');
        expect(sprite.texture).toBe(loader.byName('unit.tank.red'));
    });

    it('labels the sprite for devtools', () => {
        expect(renderer.draw('unit.tank.red', 0, 0, 'unit').label).toBe('unit.tank.red');
    });

    it('draws a requested variant', () => {
        const sprite = renderer.draw('terrain.grass', 0, 0, 'terrain', 2);
        expect(sprite.texture).toBe(loader.byName('terrain.grass', 2));
    });

    it('shares one texture across repeated tiles', () => {
        const a = renderer.draw('terrain.grass', 0, 0, 'terrain');
        const b = renderer.draw('terrain.grass', 1, 0, 'terrain');
        expect(a).not.toBe(b);                 // separate sprites
        expect(a.texture).toBe(b.texture);     // one texture, one draw call
    });

    it('propagates a bad tile name from the loader', () => {
        expect(() => renderer.draw('terrain.gras', 0, 0, 'terrain')).toThrow(/unknown tile name/);
    });

    it('leaves nothing on the layer when the lookup fails', () => {
        expect(() => renderer.draw('nope', 0, 0, 'terrain')).toThrow();
        expect(renderer.layer('terrain').children).toHaveLength(0);
    });

    it('does not track what it drew -- the caller owns the sprite', () => {
        renderer.draw('terrain.grass', 3, 5, 'terrain');
        // No cell lookup exists by design; the layer is the only record.
        expect(Object.keys(renderer)).not.toContain('tiles');
    });
});

describe('clear', () => {
    it('empties one layer and leaves the others alone', () => {
        renderer.draw('terrain.grass', 0, 0, 'terrain');
        renderer.draw('terrain.grass', 1, 0, 'terrain');
        renderer.draw('unit.tank.red', 0, 0, 'unit');

        renderer.clear('terrain');

        expect(renderer.layer('terrain').children).toHaveLength(0);
        expect(renderer.layer('unit').children).toHaveLength(1);
    });

    it('keeps the layer containers themselves', () => {
        const terrain = renderer.layer('terrain');
        renderer.clear('terrain');
        expect(renderer.layer('terrain')).toBe(terrain);
        expect(world.children).toHaveLength(LAYER_ORDER.length);
    });

    it('detaches without destroying, since textures belong to the loader', () => {
        const sprite = renderer.draw('terrain.grass', 0, 0, 'terrain');
        renderer.clear('terrain');
        expect(sprite.destroyed).toBe(false);
        expect(sprite.texture).toBe(loader.byName('terrain.grass'));
    });

    it('is safe on an empty layer', () => {
        expect(() => renderer.clear('fx')).not.toThrow();
    });
});

describe('repaint', () => {
    it('supports clear-then-redraw for a whole layer', () => {
        for (let col = 0; col < 4; col++) renderer.draw('terrain.grass', col, 0, 'terrain');
        expect(renderer.layer('terrain').children).toHaveLength(4);

        renderer.clear('terrain');
        for (let col = 0; col < 6; col++) renderer.draw('terrain.grass', col, 0, 'terrain');

        expect(renderer.layer('terrain').children).toHaveLength(6);
        expect(renderer.layer('terrain').children.at(-1)!.x).toBe(5 * TILE_SIZE);
    });
});
