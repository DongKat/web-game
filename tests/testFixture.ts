import { readFileSync } from 'node:fs';
import { Assets, Texture, TextureSource } from 'pixi.js';
import { vi } from 'vitest';
import { SpriteLoader, type SheetGeometry } from '../src/spriteLoader';

export const CSV_FILE = 'public/tilesets/tiny-battle.csv';

/** Geometry stated outright so these tests survive edits to constant.ts. */
export const PACKED: SheetGeometry = { tileSize: 16, cols: 18, rows: 11, spacing: 0, margin: 0 };
export const SPACED: SheetGeometry = { tileSize: 16, cols: 18, rows: 11, spacing: 1, margin: 0 };

export function readRealCsv(): string {
    return readFileSync(CSV_FILE, 'utf8');
}

/** A real Texture over a CPU-side source -- no GPU, no renderer, no jsdom. */
export function fakeSheet(width: number, height: number): Texture {
    return new Texture({ source: new TextureSource({ width, height, resolution: 1 }) });
}

export function sheetFor(geometry: SheetGeometry): Texture {
    const { margin, cols, rows, tileSize, spacing } = geometry;
    return fakeSheet(
        margin * 2 + cols * tileSize + (cols - 1) * spacing,
        margin * 2 + rows * tileSize + (rows - 1) * spacing,
    );
}

/**
 * Build a real SpriteLoader by stubbing only the two I/O calls: Assets.load for the
 * PNG and global fetch for the CSV. Everything else -- parsing, validation,
 * indexing, framing -- is the production code path.
 */
export async function loadTestLoader(options: {
    csv?: string;
    geometry?: SheetGeometry;
    sheet?: Texture;
    status?: number;
} = {}): Promise<SpriteLoader> {
    const geometry = options.geometry ?? PACKED;
    const csv = options.csv ?? readRealCsv();
    const sheet = options.sheet ?? sheetFor(geometry);
    const status = options.status ?? 200;

    vi.spyOn(Assets, 'load').mockImplementation((() => Promise.resolve(sheet)) as never);
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Not Found',
        text: () => Promise.resolve(csv),
    })));

    return SpriteLoader.load('/fake.png', '/fake.csv', geometry);
}
