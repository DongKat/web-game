import { Texture } from 'pixi.js';

/**
 * Interface for sprite/asset providers
 * 
 * Abstracts the loading and retrieval of game sprites and map data,
 * allowing different implementations (Kenney, real AW sprites, etc.)
 */
export interface ISpriteProvider {
    /**
     * Load all game assets (spritesheet + map data)
     */
    loadAll(): Promise<void>;

    // getTerrainTexture(terrainName: string): Texture;
    // getBuildingTexture(buildingName: string, team: string): Texture;
    // getUnitTexture(unitName: string, team: string): Texture;
    // getShadowTexture(shadowName: string): Texture;
    // getEffectTexture(effectName: string): Texture;
    // getUITexture(uiElementName: string): Texture;
    getTextureById(tileId: number): Texture;
}