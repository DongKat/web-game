import { parse } from 'csv-parse/browser/esm/sync';
import { Assets, Rectangle, Texture } from 'pixi.js';
import {
    CSV_COLUMNS,
    CSV_COMMENT,
    EDGE_MASK_MAX,
    QUERY_FACETS,
    SHEET_GEOMETRY,
    TEXTURE_SCALE_MODE,
    TILE_KINDS,
    TILEMAP_PATH,
    TILESET_PATH,
} from './constant';

export type TileKind = typeof TILE_KINDS[number];

/** One labelled tile, straight out of the tileset CSV. */
export interface TileDef {
    id: number;
    name: string;
    kind: TileKind;
    material?: string;
    team?: string;
    subtype?: string;
    facing?: string;
    /** 4-bit autotile mask of sides where the same material continues: N=1 E=2 S=4 W=8. */
    edge?: number;
    variant: number;
    note?: string;
}

/** Facets accepted by query()/pick(). Every given facet must match. */
export type TileQuery = Partial<Pick<TileDef, typeof QUERY_FACETS[number]>>;

export interface SheetGeometry {
    tileSize: number;
    cols: number;
    rows: number;
    spacing: number;
    margin: number;
}

function optional(cell: string | undefined): string | undefined {
    const v = cell?.trim();
    return v ? v : undefined;
}

function optionalInt(cell: string | undefined, where: string, field: string): number | undefined {
    const v = optional(cell);
    if (v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isInteger(n)) throw new Error(`${where}: ${field} is not an integer: "${v}"`);
    return n;
}

type CsvRow = Partial<Record<typeof CSV_COLUMNS[number], string>>;

/**
 * Parse the tileset CSV. csv-parse handles quoting, CRLF, comment lines and the
 * header row; everything below it is validation, so a bad edit fails at load with
 * the offending line number instead of rendering the wrong tile.
 */
export function parseTileCsv(text: string, geometry: SheetGeometry): TileDef[] {
    const records = parse(text, {
        columns: true,          // header row -> keys, so column order in the file is free
        comment: CSV_COMMENT,
        skip_empty_lines: true,
        trim: true,
        info: true,             // carries info.lines, for error messages that name the line
    }) as { record: CsvRow; info: { lines: number } }[];

    if (records.length === 0) throw new Error('tileset CSV has no data rows');

    for (const column of CSV_COLUMNS) {
        if (!(column in records[0].record)) {
            throw new Error(`tileset CSV is missing the "${column}" column`);
        }
    }

    const maxId = geometry.cols * geometry.rows - 1;
    const defs: TileDef[] = [];
    const seen = new Set<number>();

    for (const { record, info } of records) {
        const where = `tileset CSV line ${info.lines}`;

        const id = optionalInt(record.id, where, 'id');
        if (id === undefined) throw new Error(`${where}: missing id`);
        if (id < 0 || id > maxId) throw new Error(`${where}: id ${id} outside sheet (0..${maxId})`);
        if (seen.has(id)) throw new Error(`${where}: duplicate id ${id}`);
        seen.add(id);

        const name = optional(record.name);
        if (name === undefined) throw new Error(`${where}: missing name`);

        const rawKind = optional(record.kind);
        if (rawKind === undefined || !(TILE_KINDS as readonly string[]).includes(rawKind)) {
            throw new Error(`${where}: kind must be one of ${TILE_KINDS.join('|')}, got "${record.kind}"`);
        }
        const kind = rawKind as TileKind;

        const edge = optionalInt(record.edge, where, 'edge');
        if (edge !== undefined && (edge < 0 || edge > EDGE_MASK_MAX)) {
            throw new Error(`${where}: edge ${edge} outside 0..${EDGE_MASK_MAX}`);
        }

        defs.push({
            id,
            name,
            kind,
            material: optional(record.material),
            team: optional(record.team),
            subtype: optional(record.subtype),
            facing: optional(record.facing),
            edge,
            variant: optionalInt(record.variant, where, 'variant') ?? 0,
            note: optional(record.note),
        });
    }

    return defs;
}

/**
 * Loads the tile sheet plus its CSV labels and hands out `Texture`s by name or
 * by facet query. Owns the single shared `TextureSource`, so every tile it
 * returns batches into one draw call.
 *
 * Never returns a `Sprite` -- building the scene graph is the renderer's job.
 */
export class SpriteLoader {
    private readonly sheet: Texture;
    private readonly geometry: SheetGeometry;
    private readonly defsById: Map<number, TileDef>;
    /** name -> defs, ascending by variant. */
    private readonly byNameIndex: Map<string, TileDef[]>;
    /** "facet:value" -> tile ids. */
    private readonly facetIndex: Map<string, Set<number>>;
    /** "material:edge" -> defs, ascending by variant. */
    private readonly autotileIndex: Map<string, TileDef[]>;
    private readonly textureCache: Map<number, Texture>;

    private constructor(sheet: Texture, defs: TileDef[], geometry: SheetGeometry) {
        this.sheet = sheet;
        this.geometry = geometry;
        this.textureCache = new Map();
        this.defsById = new Map();
        this.byNameIndex = new Map();
        this.facetIndex = new Map();
        this.autotileIndex = new Map();

        for (const def of defs) {
            this.defsById.set(def.id, def);

            const sameName = this.byNameIndex.get(def.name);
            if (sameName) sameName.push(def);
            else this.byNameIndex.set(def.name, [def]);

            for (const facet of QUERY_FACETS) {
                const value = def[facet];
                if (value === undefined) continue;
                const key = `${facet}:${value}`;
                const bucket = this.facetIndex.get(key);
                if (bucket) bucket.add(def.id);
                else this.facetIndex.set(key, new Set([def.id]));
            }

            if (def.material !== undefined && def.edge !== undefined) {
                const key = `${def.material}:${def.edge}`;
                const bucket = this.autotileIndex.get(key);
                if (bucket) bucket.push(def);
                else this.autotileIndex.set(key, [def]);
            }
        }

        for (const list of this.byNameIndex.values()) list.sort((a, b) => a.variant - b.variant);
        for (const list of this.autotileIndex.values()) list.sort((a, b) => a.variant - b.variant);
    }

    /**
     * Fetch the sheet and the labels, then build the indexes. Async work happens
     * here rather than in the constructor, so there is no half-built instance.
     */
    static async load(
        pngUrl: string = TILEMAP_PATH,
        csvUrl: string = TILESET_PATH,
        geometry: SheetGeometry = SHEET_GEOMETRY,
    ): Promise<SpriteLoader> {
        const [sheet, csvText] = await Promise.all([
            Assets.load<Texture>(pngUrl),
            fetch(csvUrl).then(res => {
                if (!res.ok) throw new Error(`tileset CSV ${csvUrl} failed: ${res.status} ${res.statusText}`);
                return res.text();
            }),
        ]);

        sheet.source.scaleMode = TEXTURE_SCALE_MODE;

        const expectedW = geometry.margin * 2 + geometry.cols * geometry.tileSize + (geometry.cols - 1) * geometry.spacing;
        const expectedH = geometry.margin * 2 + geometry.rows * geometry.tileSize + (geometry.rows - 1) * geometry.spacing;
        if (sheet.width !== expectedW || sheet.height !== expectedH) {
            throw new Error(
                `${pngUrl} is ${sheet.width}x${sheet.height} but the geometry in constant.ts ` +
                `implies ${expectedW}x${expectedH} -- check SHEET_SPACING (packed sheets use 0, spaced use 1)`,
            );
        }

        return new SpriteLoader(sheet, parseTileCsv(csvText, geometry), geometry);
    }

    get tileSize(): number {
        return this.geometry.tileSize;
    }

    get tileCount(): number {
        return this.defsById.size;
    }

    /** Every tile carrying an UNVERIFIED note -- best-guess labels worth reviewing. */
    unverified(): TileDef[] {
        return [...this.defsById.values()].filter(def => def.note?.includes('UNVERIFIED'));
    }

    has(name: string, variant = 0): boolean {
        return this.byNameIndex.get(name)?.some(def => def.variant === variant) ?? false;
    }

    def(name: string, variant = 0): TileDef {
        const candidates = this.byNameIndex.get(name);
        if (!candidates) throw new Error(`unknown tile name "${name}"`);
        const def = candidates.find(d => d.variant === variant);
        if (!def) {
            const have = candidates.map(d => d.variant).join(', ');
            throw new Error(`tile "${name}" has no variant ${variant} (have: ${have})`);
        }
        return def;
    }

    defById(id: number): TileDef {
        const def = this.defsById.get(id);
        if (!def) throw new Error(`no tile labelled with id ${id}`);
        return def;
    }

    /** How many interchangeable variants exist for a name. */
    variantCount(name: string): number {
        return this.byNameIndex.get(name)?.length ?? 0;
    }

    /** Texture for a labelled name, e.g. "unit.tank.red" or "terrain.grass". */
    byName(name: string, variant = 0): Texture {
        return this.texture(this.def(name, variant).id);
    }

    /** Texture for a raw sheet id. Prefer byName() -- ids are a sheet detail. */
    byId(id: number): Texture {
        return this.texture(this.defById(id).id);
    }

    /** Defs matching every given facet, ascending by id. */
    query(facets: TileQuery): TileDef[] {
        const keys: string[] = [];
        for (const facet of QUERY_FACETS) {
            const value = facets[facet];
            if (value !== undefined) keys.push(`${facet}:${value}`);
        }
        if (keys.length === 0) return [...this.defsById.values()].sort((a, b) => a.id - b.id);

        const buckets = keys.map(key => this.facetIndex.get(key));
        if (buckets.some(bucket => bucket === undefined)) return [];

        const sets = (buckets as Set<number>[]).sort((a, b) => a.size - b.size);
        const [smallest, ...rest] = sets;
        const hits: TileDef[] = [];
        for (const id of smallest) {
            if (rest.every(set => set.has(id))) hits.push(this.defsById.get(id)!);
        }
        return hits.sort((a, b) => a.id - b.id);
    }

    /** Same as query(), as textures. */
    textures(facets: TileQuery): Texture[] {
        return this.query(facets).map(def => this.texture(def.id));
    }

    /**
     * Autotile lookup: the tile for `material` whose neighbours continue on the
     * sides in `mask` (N=1 E=2 S=4 W=8).
     *
     * Not every material covers all 16 masks -- "pavement" does, "water" only
     * has the 9-slice masks, so an isolated water cell has no tile.
     */
    autotile(material: string, mask: number, variant = 0): Texture {
        const candidates = this.autotileIndex.get(`${material}:${mask}`);
        if (!candidates) {
            const have = this.masksFor(material);
            throw new Error(
                `no "${material}" tile for edge mask ${mask}` +
                (have.length ? ` (have: ${have.join(', ')})` : ' (material has no autotile set)'),
            );
        }
        const def = candidates.find(d => d.variant === variant) ?? candidates[0];
        return this.texture(def.id);
    }

    /** Masks a material actually covers -- use to validate a map before drawing it. */
    masksFor(material: string): number[] {
        const masks: number[] = [];
        for (const key of this.autotileIndex.keys()) {
            const sep = key.lastIndexOf(':');
            if (key.slice(0, sep) === material) masks.push(Number(key.slice(sep + 1)));
        }
        return masks.sort((a, b) => a - b);
    }

    /** Random interchangeable variant matching the facets, e.g. a grass tuft. */
    pick(facets: TileQuery, rng: () => number = Math.random): Texture {
        const candidates = this.query(facets);
        if (candidates.length === 0) throw new Error(`no tile matches ${JSON.stringify(facets)}`);
        const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length));
        return this.texture(candidates[index].id);
    }

    /** Lazily frame the shared source, then memoise -- one Texture per id, forever. */
    private texture(id: number): Texture {
        const cached = this.textureCache.get(id);
        if (cached) return cached;

        const { tileSize, cols, spacing, margin } = this.geometry;
        const frame = new Rectangle(
            margin + (id % cols) * (tileSize + spacing),
            margin + Math.floor(id / cols) * (tileSize + spacing),
            tileSize,
            tileSize,
        );
        const texture = new Texture({ source: this.sheet.source, frame });
        this.textureCache.set(id, texture);
        return texture;
    }
 


}
