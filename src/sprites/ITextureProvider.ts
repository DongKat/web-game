import { Texture } from 'pixi.js';
import type { TerrainType, UnitType, BuildingType, UIElementType, TeamColor } from '../shared/constants';

export interface ITextureProvider {
    loadAll(): Promise<void>;
    getTerrainTexture(type: TerrainType): Texture;
    getUnitTexture(type: UnitType, team: TeamColor): Texture;
    getBuildingTexture(type: BuildingType, team: TeamColor): Texture;
    getUITexture(type: UIElementType): Texture;
}