import { Assets, Texture, Rectangle } from 'pixi.js';
import type { ISpriteProvider } from './ISpriteProvider';
import {
    SPRITE_ID,
    KENNY_SPRITESHEET_PATH,
} from '../shared/constants.ts';


const SHEET_COLUMNS = 18;
const SHEET_ROWS = 11;
const TILE_SIZE = 16;
const TILE_SPACING = 1;



export class KennySpriteProvider implements ISpriteProvider {
    private spritesheetTexture: Texture | null = null;
    private textureMap: Map<number, Texture> = new Map();

    constructor() {
    }

    /**
     * Load all game assets: spritesheet + map data
     */
    async loadAll(): Promise<void> {
        const spritesheetTexture = await Promise.resolve(Assets.load<Texture>(KENNY_SPRITESHEET_PATH));
        this.spritesheetTexture = spritesheetTexture;
        this.textureMap = this.sliceSpriteSheet();
    }

    private checkSpritesheetLoaded(): void {
        if (!this.spritesheetTexture) {
            throw new Error('Spritesheet not loaded yet');
        }
    }

    private sliceSpriteSheet(): Map<number, Texture> {
        const textures = new Map<number, Texture>();

        for (let row = 0; row < SHEET_ROWS; row++) {
            for (let col = 0; col < SHEET_COLUMNS; col++) {
                const tileId = row * SHEET_COLUMNS + col;

                // Calculate pixel position in the spritesheet
                const x = col * ((TILE_SIZE - 1) + TILE_SPACING);
                const y = row * ((TILE_SIZE - 1) + TILE_SPACING);

                // Create a new Texture that references a sub-region of the spritesheet
                const frame = new Rectangle(x, y, TILE_SIZE, TILE_SIZE);
                const tileTexture = new Texture({
                    source: this.spritesheetTexture?.source,
                    frame,
                });

                textures.set(tileId, tileTexture);
            }
        }
        return textures;
    }

    getTextureById(tileId: SPRITE_ID): Texture {
        if (!this.textureMap.has(tileId)) {
            throw new Error(`Texture for tile ID ${tileId} not found`);
        }
        return this.textureMap.get(tileId)!;
    }

    
}

