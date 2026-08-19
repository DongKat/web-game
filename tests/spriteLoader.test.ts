import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseTileCsv } from '../src/spriteLoader';
import { PACKED, SPACED, fakeSheet, loadTestLoader, readRealCsv, sheetFor } from './testFixture';

const HEADER = 'id,name,kind,material,team,subtype,facing,edge,variant,note';

/** Minimal valid CSV, so each error test changes exactly one thing. */
function csv(...rows: string[]): string {
    return [HEADER, ...rows].join('\n');
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('parseTileCsv', () => {
    it('parses every row of the real tileset', () => {
        const defs = parseTileCsv(readRealCsv(), PACKED);
        expect(defs).toHaveLength(198);
        expect(new Set(defs.map(d => d.id)).size).toBe(198);
    });

    it('types values rather than leaving them strings', () => {
        const def = parseTileCsv(readRealCsv(), PACKED).find(d => d.id === 120)!;
        expect(def).toMatchObject({
            id: 120,
            name: 'unit.antiair.green',
            kind: 'unit',
            team: 'green',
            subtype: 'antiair',
            facing: 'e',
            variant: 0,
        });
        expect(typeof def.id).toBe('number');
        expect(typeof def.variant).toBe('number');
    });

    it('turns empty cells into undefined, not empty strings', () => {
        const [def] = parseTileCsv(csv('0,terrain.grass,terrain,grass,,,,15,0,'), PACKED);
        expect(def.material).toBe('grass');
        expect(def.team).toBeUndefined();
        expect(def.subtype).toBeUndefined();
        expect(def.facing).toBeUndefined();
        expect(def.note).toBeUndefined();
        expect(def.edge).toBe(15);
    });

    it('omits edge entirely when the cell is blank', () => {
        const [def] = parseTileCsv(csv('0,terrain.water.corner,terrain,water,,,nw,,1,'), PACKED);
        expect(def.edge).toBeUndefined();
        expect(def.facing).toBe('nw');
        expect(def.variant).toBe(1);
    });

    it('defaults a blank variant to 0', () => {
        const [def] = parseTileCsv(csv('5,overlay.mountain,overlay,mountain,,mountain,,,,'), PACKED);
        expect(def.variant).toBe(0);
    });

    it('skips comment lines and blank lines', () => {
        const defs = parseTileCsv(
            ['# a banner', '# more docs', '', HEADER, '0,a,terrain,,,,,,0,', '', '1,b,ui,,,,,,0,'].join('\n'),
            PACKED,
        );
        expect(defs.map(d => d.name)).toEqual(['a', 'b']);
    });

    it('resolves columns by name, so file order does not matter', () => {
        const reordered = [
            'note,variant,edge,facing,subtype,team,material,kind,name,id',
            'medium tracked tank,0,,e,tank,red,,unit,unit.tank.red,152',
        ].join('\n');
        const [def] = parseTileCsv(reordered, PACKED);
        expect(def).toMatchObject({ id: 152, name: 'unit.tank.red', kind: 'unit', team: 'red' });
    });

    it('tolerates CRLF line endings', () => {
        const defs = parseTileCsv(csv('0,a,terrain,,,,,,0,', '1,b,ui,,,,,,0,').replace(/\n/g, '\r\n'), PACKED);
        expect(defs.map(d => d.kind)).toEqual(['terrain', 'ui']);
    });

    describe('rejects bad data', () => {
        it('a missing column', () => {
            expect(() => parseTileCsv('id,name,kind\n0,a,terrain', PACKED))
                .toThrow(/missing the "material" column/);
        });

        it('no data rows', () => {
            expect(() => parseTileCsv(HEADER, PACKED)).toThrow(/no data rows/);
        });

        it('a missing id', () => {
            expect(() => parseTileCsv(csv(',a,terrain,,,,,,0,'), PACKED)).toThrow(/line 2: missing id/);
        });

        it('a non-integer id', () => {
            expect(() => parseTileCsv(csv('1.5,a,terrain,,,,,,0,'), PACKED))
                .toThrow(/line 2: id is not an integer: "1.5"/);
        });

        it('an id past the end of the sheet', () => {
            expect(() => parseTileCsv(csv('198,a,terrain,,,,,,0,'), PACKED))
                .toThrow(/id 198 outside sheet \(0\.\.197\)/);
        });

        it('a duplicate id', () => {
            expect(() => parseTileCsv(csv('7,a,terrain,,,,,,0,', '7,b,ui,,,,,,0,'), PACKED))
                .toThrow(/line 3: duplicate id 7/);
        });

        it('a missing name', () => {
            expect(() => parseTileCsv(csv('0,,terrain,,,,,,0,'), PACKED)).toThrow(/line 2: missing name/);
        });

        it('an unknown kind', () => {
            expect(() => parseTileCsv(csv('0,a,scenery,,,,,,0,'), PACKED))
                .toThrow(/kind must be one of terrain\|overlay\|structure\|unit\|ui, got "scenery"/);
        });

        it('an edge mask above 15', () => {
            expect(() => parseTileCsv(csv('0,a,terrain,grass,,,,16,0,'), PACKED))
                .toThrow(/line 2: edge 16 outside 0\.\.15/);
        });

        it('and counts physical lines, so comments do not shift the number', () => {
            const withBanner = ['# one', '# two', '# three', HEADER, '0,a,terrain,grass,,,,99,0,'].join('\n');
            expect(() => parseTileCsv(withBanner, PACKED)).toThrow(/line 5: edge 99 outside/);
        });
    });
});

describe('SpriteLoader.load', () => {
    it('indexes the whole sheet', async () => {
        const loader = await loadTestLoader();
        expect(loader.tileCount).toBe(198);
        expect(loader.tileSize).toBe(16);
    });

    it('disables texture interpolation on the shared source', async () => {
        const sheet = sheetFor(PACKED);
        expect(sheet.source.scaleMode).toBe('linear');       // Pixi default
        await loadTestLoader({ sheet });
        expect(sheet.source.scaleMode).toBe('nearest');
    });

    it('rejects a sheet whose size contradicts the geometry', async () => {
        // The spaced PNG loaded while spacing is declared as 0.
        await expect(loadTestLoader({ sheet: fakeSheet(305, 186), geometry: PACKED }))
            .rejects.toThrow(/is 305x186 but the geometry in constant.ts implies 288x176/);
    });

    it('accepts the spaced sheet when spacing says 1', async () => {
        const loader = await loadTestLoader({ geometry: SPACED });
        expect(loader.tileCount).toBe(198);
    });

    it('turns an HTTP error into a real failure', async () => {
        await expect(loadTestLoader({ status: 404 }))
            .rejects.toThrow(/tileset CSV \/fake.csv failed: 404 Not Found/);
    });
});

describe('lookups', () => {
    it('frames a tile from its sheet position', async () => {
        const loader = await loadTestLoader();
        const { frame } = loader.byName('unit.antiair.green');   // id 120 -> r6 c12
        expect([frame.x, frame.y, frame.width, frame.height]).toEqual([192, 96, 16, 16]);
    });

    it('accounts for spacing when framing', async () => {
        const loader = await loadTestLoader({ geometry: SPACED });
        const { frame } = loader.byName('unit.antiair.green');   // 12 * 17, 6 * 17
        expect([frame.x, frame.y]).toEqual([204, 102]);
    });

    it('returns the same Texture object for repeat lookups', async () => {
        const loader = await loadTestLoader();
        expect(loader.byName('terrain.grass')).toBe(loader.byName('terrain.grass'));
    });

    it('shares one TextureSource across every tile, so they batch', async () => {
        const loader = await loadTestLoader();
        const sources = new Set(loader.textures({}).map(t => t.source));
        expect(sources.size).toBe(1);
    });

    it('reaches a specific variant', async () => {
        const loader = await loadTestLoader();
        expect(loader.variantCount('terrain.grass')).toBe(3);
        expect(loader.def('terrain.grass', 2).note).toBe('flowers');
        expect(loader.def('terrain.grass').variant).toBe(0);     // defaults to 0
    });

    it('names the problem for an unknown tile', async () => {
        const loader = await loadTestLoader();
        expect(() => loader.byName('terrain.gras')).toThrow(/unknown tile name "terrain.gras"/);
        expect(() => loader.byName('terrain.grass', 7))
            .toThrow(/has no variant 7 \(have: 0, 1, 2\)/);
        expect(() => loader.byId(9999)).toThrow(/no tile labelled with id 9999/);
    });

    it('answers has() without throwing', async () => {
        const loader = await loadTestLoader();
        expect(loader.has('terrain.grass', 2)).toBe(true);
        expect(loader.has('terrain.grass', 9)).toBe(false);
        expect(loader.has('nope')).toBe(false);
    });
});

describe('query', () => {
    it('intersects facets', async () => {
        const loader = await loadTestLoader();
        const redUnits = loader.query({ kind: 'unit', team: 'red' });
        expect(redUnits).toHaveLength(13);
        expect(redUnits.every(d => d.kind === 'unit' && d.team === 'red')).toBe(true);
    });

    it('matches one facet across teams', async () => {
        const loader = await loadTestLoader();
        expect(loader.query({ subtype: 'tank' }).map(d => d.team))
            .toEqual(['neutral', 'green', 'blue', 'red', 'orange']);
    });

    it('returns everything for an empty query, sorted by id', async () => {
        const loader = await loadTestLoader();
        const all = loader.query({});
        expect(all).toHaveLength(198);
        expect(all.map(d => d.id)).toEqual([...all.map(d => d.id)].sort((a, b) => a - b));
    });

    it('returns nothing for a value that was never indexed', async () => {
        const loader = await loadTestLoader();
        expect(loader.query({ team: 'purple' })).toEqual([]);
        expect(loader.query({ kind: 'unit', team: 'purple' })).toEqual([]);
    });

    it('never matches tiles whose facet cell was blank', async () => {
        const loader = await loadTestLoader();
        // Terrain rows leave team blank; they must not fall into any team bucket.
        const teamed = loader.query({ kind: 'terrain' }).filter(d => d.team !== undefined);
        expect(teamed).toEqual([]);
    });
});

describe('autotile', () => {
    it('covers all 16 masks for pavement', async () => {
        const loader = await loadTestLoader();
        expect(loader.masksFor('pavement')).toEqual([...Array(16).keys()]);
        for (let mask = 0; mask <= 15; mask++) {
            expect(() => loader.autotile('pavement', mask)).not.toThrow();
        }
    });

    it('reports which masks water actually has', async () => {
        const loader = await loadTestLoader();
        expect(loader.masksFor('water')).toEqual([3, 5, 6, 7, 9, 11, 12, 13, 14, 15]);
    });

    it('throws rather than draw a wrong tile for a missing mask', async () => {
        const loader = await loadTestLoader();
        // An isolated 1-cell lake: water continues on no side.
        expect(() => loader.autotile('water', 0))
            .toThrow(/no "water" tile for edge mask 0 \(have: 3, 5, 6, 7, 9, 11, 12, 13, 14, 15\)/);
    });

    it('says so when a material has no autotile set at all', async () => {
        const loader = await loadTestLoader();
        expect(() => loader.autotile('mountain', 15)).toThrow(/material has no autotile set/);
    });

    it('falls back to the lowest variant when the asked-for one is absent', async () => {
        const loader = await loadTestLoader();
        // Mask 6 has two water variants (lake corner 0, pond corner 1); 9 has none.
        expect(loader.autotile('water', 6, 9)).toBe(loader.autotile('water', 6, 0));
        expect(loader.autotile('water', 6, 1)).not.toBe(loader.autotile('water', 6, 0));
    });
});

describe('pick', () => {
    it('is deterministic given a seeded rng', async () => {
        const loader = await loadTestLoader();
        const facets = { kind: 'terrain', material: 'grass' } as const;
        expect(loader.pick(facets, () => 0)).toBe(loader.byName('terrain.grass', 0));
        expect(loader.pick(facets, () => 0.5)).toBe(loader.byName('terrain.grass', 1));
        expect(loader.pick(facets, () => 0.99)).toBe(loader.byName('terrain.grass', 2));
    });

    it('clamps an rng that returns 1', async () => {
        const loader = await loadTestLoader();
        expect(() => loader.pick({ material: 'grass' }, () => 1)).not.toThrow();
    });

    it('throws when nothing matches', async () => {
        const loader = await loadTestLoader();
        expect(() => loader.pick({ material: 'lava' })).toThrow(/no tile matches \{"material":"lava"\}/);
    });
});

describe('unverified', () => {
    it('lists the best-guess labels', async () => {
        const loader = await loadTestLoader();
        const flagged = loader.unverified();
        expect(flagged).toHaveLength(15);
        expect(new Set(flagged.map(d => d.subtype)))
            .toEqual(new Set(['machine', 'lamp', 'turret', 'fence', 'silo', 'antiair']));
    });
});
