import { Texture } from 'pixi.js';
import type { TerrainType, UnitType, BuildingType, UIElementType, TeamColor, SPRITE_ID } from '../shared/constants';

export interface ITextureProvider {
    loadAll(): Promise<void>;
    getTextureById(id: SPRITE_ID): Texture;
    getTerrainTexture(type: TerrainType, variant?: number): Texture;
    getAutoTileTexture(type: TerrainType, bitmask: number): Texture;
    getUnitTexture(type: UnitType, team: TeamColor): Texture;
    getBuildingTexture(type: BuildingType, team: TeamColor): Texture;
    getUITexture(type: UIElementType): Texture;
}