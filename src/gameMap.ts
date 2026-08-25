import { EDGE_EAST, EDGE_NORTH, EDGE_SOUTH, EDGE_WEST } from './constant';
import type { SpriteLoader } from './spriteLoader';
import type { SpriteRenderer } from './spriteRenderer';

export interface Placement {
    type: string;
    team?: string;
    c: number;
    r: number;
}

export interface MapFile {
    name: string;
    w: number;
    h: number;
    seed?: number;
    terrain: string;
    legend: Record<string, string>;
    overlays?: Placement[];
    structures?: Placement[];
    units?: Placement[];
}

export function seededVariant(seed: number, c: number, r: number, count: number): number {
    if (count <= 1) return 0;
    let h = (seed ^ (c * 374761393 + r * 668265263)) >>> 0;
    h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) % count;
}

export class GameMap {
    readonly name: string;
    readonly w: number;
    readonly h: number;
    readonly seed: number;
    readonly overlays: Placement[];
    readonly structures: Placement[];
    readonly units: Placement[];
    private readonly cells: string[];

    private constructor(
        name: string, w: number, h: number, seed: number,
        cells: string[], overlays: Placement[], structures: Placement[], units: Placement[],
    ) {
        this.name = name;
        this.w = w;
        this.h = h;
        this.seed = seed;
        this.cells = cells;
        this.overlays = overlays;
        this.structures = structures;
        this.units = units;
    }

    static async load(url: string): Promise<GameMap> {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`map ${url} failed: ${res.status} ${res.statusText}`);
        const file: MapFile = await res.json();
        return GameMap.fromFile(file);
    }

    static fromFile(file: MapFile): GameMap {
        const { name, w, h, terrain, legend } = file;
        if (terrain.length !== w * h) {
            throw new Error(
                `map "${name}": terrain length ${terrain.length} !== w*h (${w}*${h}=${w * h})`,
            );
        }

        const reverse = new Map<string, string>();
        for (const [ch, material] of Object.entries(legend)) {
            reverse.set(ch, material);
        }

        const cells: string[] = [];
        for (let i = 0; i < terrain.length; i++) {
            const ch = terrain[i];
            const material = reverse.get(ch);
            if (!material) throw new Error(`map "${name}": unknown legend char "${ch}" at index ${i}`);
            cells.push(material);
        }

        return new GameMap(
            name, w, h, file.seed ?? 0, cells,
            file.overlays ?? [], file.structures ?? [], file.units ?? [],
        );
    }

    at(c: number, r: number): string {
        if (c < 0 || c >= this.w || r < 0 || r >= this.h) {
            throw new Error(`(${c},${r}) out of bounds (${this.w}x${this.h})`);
        }
        return this.cells[r * this.w + c];
    }

    set(c: number, r: number, material: string): void {
        if (c < 0 || c >= this.w || r < 0 || r >= this.h) {
            throw new Error(`(${c},${r}) out of bounds (${this.w}x${this.h})`);
        }
        this.cells[r * this.w + c] = material;
    }

    /** 4-bit autotile mask. Off-map neighbours count as "continues". */
    mask(c: number, r: number): number {
        const m = this.at(c, r);
        const same = (dc: number, dr: number) => {
            const nc = c + dc, nr = r + dr;
            if (nc < 0 || nc >= this.w || nr < 0 || nr >= this.h) return true;
            return this.cells[nr * this.w + nc] === m;
        };
        return (same(0, -1) ? EDGE_NORTH : 0)
             | (same(1, 0) ? EDGE_EAST : 0)
             | (same(0, 1) ? EDGE_SOUTH : 0)
             | (same(-1, 0) ? EDGE_WEST : 0);
    }
}

export function drawMap(map: GameMap, loader: SpriteLoader, renderer: SpriteRenderer): void {
    renderer.clear('terrain');
    renderer.clear('overlay');
    renderer.clear('structure');
    renderer.clear('unit');

    for (let r = 0; r < map.h; r++) {
        for (let c = 0; c < map.w; c++) {
            const material = map.at(c, r);
            const masks = loader.masksFor(material);

            if (masks.length <= 1) {
                const name = `terrain.${material}`;
                const v = seededVariant(map.seed, c, r, loader.variantCount(name));
                renderer.draw(name, c, r, 'terrain', v);
            } else {
                const tex = loader.autotile(material, map.mask(c, r));
                renderer.drawTexture(tex, c, r, 'terrain', `terrain.${material}`);
            }
        }
    }

    for (const o of map.overlays) {
        renderer.draw(`overlay.${o.type}`, o.c, o.r, 'overlay');
    }

    for (const s of map.structures) {
        renderer.draw(`structure.${s.type}.${s.team}`, s.c, s.r, 'structure');
    }

    for (const u of map.units) {
        renderer.draw(`unit.${u.type}.${u.team}`, u.c, u.r, 'unit');
    }
}
