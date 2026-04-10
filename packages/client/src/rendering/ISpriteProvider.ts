import type { Texture } from 'pixi.js';
import type { UnitType, TeamColor, TerrainType } from '@web-game/shared';

export type UnitAction = 'idle' | 'move' | 'attack' | 'hit' | 'done';

export interface AnimatedTexture {
  frames: Texture[];
  fps: number;
}

export type SpriteTexture = Texture | AnimatedTexture;

export function isAnimated(tex: SpriteTexture): tex is AnimatedTexture {
  return typeof tex === 'object' && 'frames' in tex;
}

export type OverlayType = 'cursor' | 'movementHighlight' | 'attackHighlight' |
  'arrowUp' | 'arrowDown' | 'arrowLeft' | 'arrowRight' |
  'arrowHorizontal' | 'arrowVertical' |
  'arrowTurn1' | 'arrowTurn2' | 'arrowTurn3' | 'arrowTurn4';

export interface ISpriteProvider {
  readonly id: string;
  readonly name: string;

  init(): Promise<void>;

  getUnitTexture(unitType: UnitType, team: TeamColor, action?: UnitAction): SpriteTexture;
  getBuildingTexture(buildingType: TerrainType, team: TeamColor | null): SpriteTexture;
  getTerrainTexture(terrainType: TerrainType, variant?: number): SpriteTexture;
  getOverlayTexture(overlayType: OverlayType): Texture;
  getHealthTexture(hp: number): Texture;

  getTileTextureByTiledId(tiledId: number): Texture | undefined;
}
