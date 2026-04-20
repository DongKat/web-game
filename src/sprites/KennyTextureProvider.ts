import { Assets, Rectangle, Texture } from 'pixi.js';
import type { ITextureProvider } from './ITextureProvider.ts';
import { KENNY_SPRITESHEET_PATH, SHEET_COLUMNS, SHEET_ROWS, TILE_SIZE, TILE_SPACING } from '../shared/constants.ts';
import type { BuildingType, SPRITE_ID, TeamColor, TerrainType, UIElementType, UnitType } from '../shared/constants.ts';
import spriteMetadata from '../schema/KennySpriteMetadata.json';


type SpriteEntry = {
    id: SPRITE_ID;
    name: string;
    type: string;
    team?: TeamColor;
    variant?: number | string;
    frame?: number;
    value?: number | string;
};

type KennySpriteMetadata = {
    terrain: {
        grass: SpriteEntry[];
        mountain: SpriteEntry[];
        lake: SpriteEntry[];
        river: SpriteEntry[];
        forest: SpriteEntry[];
    };
    infrastructure: {
        roadBlocks: SpriteEntry[];
        roads: SpriteEntry[];
        bridges: SpriteEntry[];
        paths: SpriteEntry[];
    };
    props: SpriteEntry[];
    buildings: Record<TeamColor, SpriteEntry[]>;
    units: Record<TeamColor, SpriteEntry[]>;
    ui: SpriteEntry[];
    status: {
        health: SpriteEntry[];
        emotes: SpriteEntry[];
    };
    effects: SpriteEntry[];
};

const metadata = spriteMetadata as KennySpriteMetadata;

function flattenMetadata({ terrain, infrastructure, props, buildings, units, ui, status, effects }: KennySpriteMetadata): SpriteEntry[] {
    return [
        ...terrain.grass,
        ...terrain.mountain,
        ...terrain.lake,
        ...terrain.river,
        ...terrain.forest,
        ...infrastructure.roadBlocks,
        ...infrastructure.roads,
        ...infrastructure.bridges,
        ...infrastructure.paths,
        ...props,
        ...buildings.Gray,
        ...buildings.Green,
        ...buildings.Blue,
        ...buildings.Red,
        ...buildings.Yellow,
        ...units.Gray,
        ...units.Green,
        ...units.Blue,
        ...units.Red,
        ...units.Yellow,
        ...ui,
        ...status.health,
        ...status.emotes,
        ...effects,
    ];
}

const allSpriteEntries = flattenMetadata(metadata);

const terrainLookup: Record<TerrainType, SPRITE_ID> = {
    Grass: metadata.terrain.grass[0].id,
    Mountain: metadata.terrain.mountain[0].id,
    Lake: metadata.terrain.lake[0].id,
    River: metadata.terrain.river[0].id,
    Road: metadata.infrastructure.roads[0].id,
    Bridge: metadata.infrastructure.bridges[0].id,
    Forest: metadata.terrain.forest[0].id,
};

const uiLookup: Record<UIElementType, SPRITE_ID> = {
    Cursor: metadata.ui.find((entry) => entry.type === 'Cursor' && entry.variant === 'Default')?.id ?? metadata.ui[0].id,
    MovementHighlight: metadata.ui.find((entry) => entry.type === 'MovementHighlight')?.id ?? metadata.ui[0].id,
    Health: metadata.status.health.find((entry) => entry.value === 'Unknown')?.id ?? metadata.status.health[0].id,
    Shadow: metadata.effects.find((entry) => entry.type === 'Shadow')?.id ?? metadata.effects[0].id,
    PathArrow: metadata.infrastructure.paths.find((entry) => entry.variant === 'Horizontal')?.id ?? metadata.infrastructure.paths[0].id,
};

const availableTeams = new Set<TeamColor>(['Gray', 'Green', 'Blue', 'Red', 'Yellow']);

export class KennySpriteProvider implements ITextureProvider {
    private spritesheetTexture: Texture | null = null;
    private textureMap: Map<SPRITE_ID, Texture> = new Map();
    private spriteEntriesById: Map<SPRITE_ID, SpriteEntry> = new Map(
        allSpriteEntries.map((entry) => [entry.id, entry] as const),
    );

    private static instance: KennySpriteProvider;

    private constructor() {}

    public static getInstance(): KennySpriteProvider {
        if (!KennySpriteProvider.instance) {
            KennySpriteProvider.instance = new KennySpriteProvider();
        }
        return KennySpriteProvider.instance;
    }

    async loadAll(): Promise<void> {
        this.spritesheetTexture = await Assets.load<Texture>(KENNY_SPRITESHEET_PATH);
        this.textureMap = this.sliceSpriteSheet();
    }

    isSpriteSheetLoaded(): boolean {
        if (!this.spritesheetTexture) {
            throw new Error('Sprite sheet texture not loaded. Call loadAll() before accessing textures.');
        }
        return true;
    }

    private sliceSpriteSheet(): Map<SPRITE_ID, Texture> {
        this.isSpriteSheetLoaded();

        const textures = new Map<SPRITE_ID, Texture>();
        let spriteId = 1 as SPRITE_ID;

        for (let row = 0; row < SHEET_ROWS; row++) {
            for (let col = 0; col < SHEET_COLUMNS; col++) {
                const x = col * ((TILE_SIZE - 1) + TILE_SPACING);
                const y = row * ((TILE_SIZE - 1) + TILE_SPACING);
                const frame = new Rectangle(x, y, TILE_SIZE, TILE_SIZE);

                textures.set(
                    spriteId,
                    new Texture({
                        source: this.spritesheetTexture?.source,
                        frame,
                    }),
                );

                spriteId = (spriteId + 1) as SPRITE_ID;
            }
        }

        return textures;
    }

    private getGroupedSpriteId(collection: Record<TeamColor, SpriteEntry[]>, type: string, team: TeamColor): SPRITE_ID {
        if (!availableTeams.has(team)) {
            throw new Error(`Invalid team color: ${team}`);
        }
        
        const entry = collection[team].find((item) => item.type === type); 
        if (!entry) {
            throw new Error(`Sprite for type ${type} and team ${team} not found`);
        }
        return entry.id;
    }

    getTextureById(tileId: SPRITE_ID): Texture {
        const texture = this.textureMap.get(tileId);

        if (!texture) {
            throw new Error(`Texture for tile ID ${tileId} not found`);
        }

        return texture;
    }

    getTextureByName(name: string): Texture {
        const entry = allSpriteEntries.find((item) => item.name === name);

        if (!entry) {
            throw new Error(`Sprite named ${name} not found`);
        }

        return this.getTextureById(entry.id);
    }

    getSpriteMetadata(id: SPRITE_ID): SpriteEntry | undefined {
        return this.spriteEntriesById.get(id);
    }

    getTerrainTexture(type: TerrainType): Texture {
        return this.getTextureById(terrainLookup[type]);
    }

    getUnitTexture(type: UnitType, team: TeamColor): Texture {
        return this.getTextureById(this.getGroupedSpriteId(metadata.units, type, team));
    }

    getBuildingTexture(type: BuildingType, team: TeamColor): Texture {
        return this.getTextureById(this.getGroupedSpriteId(metadata.buildings, type, team));
    }

    getUITexture(type: UIElementType): Texture {
        return this.getTextureById(uiLookup[type]);
    }
}

