import { TILE_SIZE } from './constant';
import { seededVariant } from './gameMap';
import type { Sprite } from 'pixi.js';
import type { GameMap, Placement } from './gameMap';
import type { SpriteLoader, TileQuery } from './spriteLoader';
import type { SpriteRenderer } from './spriteRenderer';

export class GameMapManager {
    readonly map: GameMap;
    private readonly loader: SpriteLoader;
    private readonly renderer: SpriteRenderer;
    private readonly sprites: {
        terrain: Map<number, Sprite>;
        overlay: Map<number, Sprite>;
        structure: Map<number, Sprite>;
        unit: Map<number, Sprite>;
        fx: Map<number, Sprite>;
        cursor: Map<number, Sprite>;
    };

    constructor(map: GameMap, loader: SpriteLoader, renderer: SpriteRenderer) {
        this.map = map;
        this.loader = loader;
        this.renderer = renderer;
        this.sprites = {
            terrain: new Map(),
            overlay: new Map(),
            structure: new Map(),
            unit: new Map(),
            fx: new Map(),
            cursor: new Map(),
        };
    }

    private key(c: number, r: number): number {
        return r * this.map.w + c;
    }

    // ── Full draw ──────────────────────────────────────────────

    drawAll(): void {
        for (const m of Object.values(this.sprites)) m.clear();
        this.renderer.clear('terrain');
        this.renderer.clear('overlay');
        this.renderer.clear('structure');
        this.renderer.clear('unit');

        for (let r = 0; r < this.map.h; r++) {
            for (let c = 0; c < this.map.w; c++) {
                this.drawTerrainCell(c, r);
            }
        }
        for (const o of this.map.overlays) this.drawPlacement(o, 'overlay');
        for (const s of this.map.structures) this.drawPlacement(s, 'structure');
        for (const u of this.map.units) this.drawPlacement(u, 'unit');
    }

    // ── Terrain ────────────────────────────────────────────────

    setTerrain(c: number, r: number, material: string): void {
        this.map.set(c, r, material);
        this.drawTerrainCell(c, r);
        if (r > 0) this.drawTerrainCell(c, r - 1);
        if (c < this.map.w - 1) this.drawTerrainCell(c + 1, r);
        if (r < this.map.h - 1) this.drawTerrainCell(c, r + 1);
        if (c > 0) this.drawTerrainCell(c - 1, r);
    }

    private drawTerrainCell(c: number, r: number): void {
        const k = this.key(c, r);
        this.sprites.terrain.get(k)?.destroy();

        const material = this.map.at(c, r);
        const masks = this.loader.masksFor(material);
        let sprite: Sprite;

        if (masks.length <= 1) {
            const name = `terrain.${material}`;
            const v = seededVariant(this.map.seed, c, r, this.loader.variantCount(name));
            sprite = this.renderer.draw(name, c, r, 'terrain', v);
        } else {
            const tex = this.loader.autotile(material, this.map.mask(c, r));
            sprite = this.renderer.drawTexture(tex, c, r, 'terrain', `terrain.${material}`);
        }

        this.sprites.terrain.set(k, sprite);
    }

    // ── Units ──────────────────────────────────────────────────

    placeUnit(type: string, team: string, c: number, r: number): Sprite {
        this.removeUnit(c, r);
        const p: Placement = { type, team, c, r };
        this.map.units.push(p);
        return this.drawPlacement(p, 'unit');
    }

    removeUnit(c: number, r: number): void {
        this.removePlacement(c, r, 'unit', this.map.units);
    }

    moveUnit(fromC: number, fromR: number, toC: number, toR: number): void {
        const fromK = this.key(fromC, fromR);
        const sprite = this.sprites.unit.get(fromK);
        if (!sprite) throw new Error(`no unit at (${fromC},${fromR})`);

        const unit = this.map.units.find(u => u.c === fromC && u.r === fromR);
        if (!unit) throw new Error(`no unit data at (${fromC},${fromR})`);

        unit.c = toC;
        unit.r = toR;
        sprite.position.set(toC * TILE_SIZE + TILE_SIZE / 2, toR * TILE_SIZE + TILE_SIZE);
        this.sprites.unit.delete(fromK);
        this.sprites.unit.set(this.key(toC, toR), sprite);
        // Set alpha to indicate that the unit has moved
        sprite.alpha = 0.5;
    }

    setUnitAlpha(c: number, r: number, alpha: number): void {
        const sprite = this.sprites.unit.get(this.key(c, r));
        if (sprite) sprite.alpha = alpha;
    }

    resetUnitAlpha(team: string): void {
        for (const unit of this.map.units) {
            if (unit.team === team) {
                this.setUnitAlpha(unit.c, unit.r, 1);
            }
        }
    }

    unitAt(c: number, r: number): Placement | undefined {
        return this.map.units.find(u => u.c === c && u.r === r);
    }

    // ── Structures ─────────────────────────────────────────────

    placeStructure(type: string, team: string, c: number, r: number): Sprite {
        this.removeStructure(c, r);
        const p: Placement = { type, team, c, r };
        this.map.structures.push(p);
        return this.drawPlacement(p, 'structure');
    }

    removeStructure(c: number, r: number): void {
        this.removePlacement(c, r, 'structure', this.map.structures);
    }

    structureAt(c: number, r: number): Placement | undefined {
        return this.map.structures.find(s => s.c === c && s.r === r);
    }

    // ── Overlays ───────────────────────────────────────────────

    placeOverlay(type: string, c: number, r: number): Sprite {
        this.removeOverlay(c, r);
        const p: Placement = { type, c, r };
        this.map.overlays.push(p);
        return this.drawPlacement(p, 'overlay');
    }

    removeOverlay(c: number, r: number): void {
        this.removePlacement(c, r, 'overlay', this.map.overlays);
    }

    overlayAt(c: number, r: number): Placement | undefined {
        return this.map.overlays.find(o => o.c === c && o.r === r);
    }

    // ── FX (temporary UI: path arrows, highlights) ──────────

    placeFx(name: string, c: number, r: number): Sprite {
        this.removeFx(c, r);
        const sprite = this.renderer.draw(name, c, r, 'fx');
        this.sprites.fx.set(this.key(c, r), sprite);
        return sprite;
    }

    placeFxByQuery(query: TileQuery, c: number, r: number): Sprite | null {
        const defs = this.loader.query(query);
        if (defs.length === 0) return null;
        this.removeFx(c, r);
        const tex = this.loader.byId(defs[0].id);
        const sprite = this.renderer.drawTexture(tex, c, r, 'fx');
        this.sprites.fx.set(this.key(c, r), sprite);
        return sprite;
    }

    removeFx(c: number, r: number): void {
        const k = this.key(c, r);
        this.sprites.fx.get(k)?.destroy();
        this.sprites.fx.delete(k);
    }

    clearFx(): void {
        for (const sprite of this.sprites.fx.values()) sprite.destroy();
        this.sprites.fx.clear();
        this.renderer.clear('fx');
    }

    // ── Cursor ─────────────────────────────────────────────────

    placeCursor(name: string, c: number, r: number): Sprite {
        this.removeCursor(c, r);
        const sprite = this.renderer.draw(name, c, r, 'cursor');
        this.sprites.cursor.set(this.key(c, r), sprite);
        return sprite;
    }

    removeCursor(c: number, r: number): void {
        const k = this.key(c, r);
        this.sprites.cursor.get(k)?.destroy();
        this.sprites.cursor.delete(k);
    }

    clearCursor(): void {
        for (const sprite of this.sprites.cursor.values()) sprite.destroy();
        this.sprites.cursor.clear();
        this.renderer.clear('cursor');
    }

    // ── Shared helpers ─────────────────────────────────────────

    private drawPlacement(p: Placement, layer: 'overlay' | 'structure' | 'unit'): Sprite {
        const name = p.team ? `${layer}.${p.type}.${p.team}` : `${layer}.${p.type}`;
        const sprite = this.renderer.draw(name, p.c, p.r, layer);
        this.sprites[layer].set(this.key(p.c, p.r), sprite);
        return sprite;
    }

    private removePlacement(c: number, r: number, layer: 'overlay' | 'structure' | 'unit', list: Placement[]): void {
        const k = this.key(c, r);
        this.sprites[layer].get(k)?.destroy();
        this.sprites[layer].delete(k);
        const idx = list.findIndex(p => p.c === c && p.r === r);
        if (idx >= 0) list.splice(idx, 1);
    }
}
