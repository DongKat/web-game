import { Assets, Rectangle, Texture } from 'pixi.js';
import type { ITextureProvider } from './ITextureProvider.ts';
import { KENNY_SPRITESHEET_PATH, SHEET_COLUMNS, SHEET_ROWS, TILE_SIZE, TILE_SPACING } from '../shared/constants.ts';
import type { BuildingType, SPRITE_ID, TeamColor, TerrainType, UIElementType, UnitType } from '../shared/constants.ts';
import { EntityDefinitionManager } from '../schema/EntityDefinitionManager.ts';
import spriteMetadata from '../schema/KennySpriteMetadata.json';

const uiLookup: Record<UIElementType, SPRITE_ID> = {
    Cursor: (spriteMetadata.ui.find((e: any) => e.type === 'Cursor' && e.variant === 'Default') ?? spriteMetadata.ui[0]).id,
    MovementHighlight: (spriteMetadata.ui.find((e: any) => e.type === 'MovementHighlight') ?? spriteMetadata.ui[0]).id,
    Health: (spriteMetadata.status.health.find((e: any) => e.value === 'Unknown') ?? spriteMetadata.status.health[0]).id,
    Shadow: (spriteMetadata.effects.find((e: any) => e.type === 'Shadow') ?? spriteMetadata.effects[0]).id,
    PathArrow: (spriteMetadata.paths.find((e: any) => e.variant === 'Horizontal') ?? spriteMetadata.paths[0]).id,
};

export class KennySpriteProvider implements ITextureProvider {
    private spritesheetTexture: Texture | null = null;
    private textureMap: Map<SPRITE_ID, Texture> = new Map();
    private defManager = EntityDefinitionManager.getInstance();

    private static instance: KennySpriteProvider;

    private constructor() { }

    public static getInstance(): KennySpriteProvider {
        if (!KennySpriteProvider.instance) {
            KennySpriteProvider.instance = new KennySpriteProvider();
        }
        return KennySpriteProvider.instance;
    }

    async loadAll(): Promise<void> {
        this.spritesheetTexture = await Assets.load<Texture>(KENNY_SPRITESHEET_PATH);
        // this.spritesheetTexture = await Assets.load<Texture>("assets/tile_0094.png");
        this.textureMap = this.sliceSpriteSheet();
        // Log the spritesheet height and width
        console.log(`Loaded spritesheet with dimensions: ${this.spritesheetTexture.width}x${this.spritesheetTexture.height}`);
    }

    private sliceSpriteSheet(): Map<SPRITE_ID, Texture> {
        if (!this.spritesheetTexture) {
            throw new Error('Sprite sheet texture not loaded. Call loadAll() before accessing textures.');
        }

        const textures = new Map<SPRITE_ID, Texture>();
        let spriteId = 1 as SPRITE_ID;

        const step = TILE_SIZE + TILE_SPACING;

        for (let row = 0; row < SHEET_ROWS; row++) {
            for (let col = 0; col < SHEET_COLUMNS; col++) {
                const frame = new Rectangle(
                    col * step,
                    row * step,
                    TILE_SIZE,
                    TILE_SIZE
                );

                textures.set(
                    spriteId,
                    new Texture({
                        source: this.spritesheetTexture.source,
                        frame,
                    })
                );

                spriteId = (spriteId + 1) as SPRITE_ID;
            }
        }

        return textures;
    }

    getTextureById(tileId: SPRITE_ID): Texture {
        const texture = this.textureMap.get(tileId);
        if (!texture) {
            throw new Error(`Texture for tile ID ${tileId} not found`);
        }
        return texture;
    }

    getTerrainTexture(type: TerrainType, variant?: number): Texture {
        const id = this.defManager.getTerrainSpriteId(type, variant);
        return this.getTextureById(id);
    }

    getAutoTileTexture(type: TerrainType, bitmask: number): Texture {
        const id = this.defManager.getAutoTileSpriteId(type, bitmask);
        return this.getTextureById(id);
    }

    getUnitTexture(type: UnitType, team: TeamColor): Texture {
        const id = this.defManager.getUnitSpriteId(type, team);
        return this.getTextureById(id);
    }

    getBuildingTexture(type: BuildingType, team: TeamColor): Texture {
        const id = this.defManager.getBuildingSpriteId(type, team);
        return this.getTextureById(id);
    }

    getUITexture(type: UIElementType): Texture {
        return this.getTextureById(uiLookup[type]);
    }
}