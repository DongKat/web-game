import type {
  UnitType,
  TerrainType,
  MovementClass,
  UnitState,
  BuildingState,
  Weather,
  Point,
} from '../types/index.js';

export interface DamageResult {
  attackerDamage: number;  // damage dealt to defender
  counterDamage: number;   // damage dealt back to attacker (0 if no counter)
}

export interface UnitStats {
  type: UnitType;
  movementClass: MovementClass;
  moveRange: number;
  vision: number;
  cost: number;
  fuel: number;
  maxFuel: number;
  ammo: number;
  maxAmmo: number;
  minRange: number;
  maxRange: number;
  canCapture: boolean;
  canLoad: UnitType[];      // unit types this can carry
  loadCapacity: number;
}

export interface TerrainStats {
  type: TerrainType;
  defense: number;          // 0-4 stars
  movementCosts: Partial<Record<MovementClass, number | null>>; // null = impassable
  isProperty: boolean;
  canRepair: UnitType[];    // unit types this terrain can repair
  incomePerTurn: number;
}

export interface IGameRuleSet {
  readonly id: string;
  readonly name: string;

  getUnitStats(unitType: UnitType): UnitStats;
  getTerrainStats(terrainType: TerrainType): TerrainStats;

  getMovementCost(movementClass: MovementClass, terrainType: TerrainType, weather: Weather): number | null;
  getAttackRange(unitType: UnitType): { min: number; max: number };
  getVisionRange(unitType: UnitType, terrainType: TerrainType, weather: Weather): number;

  calculateDamage(
    attacker: UnitState,
    defender: UnitState,
    attackerTerrain: TerrainType,
    defenderTerrain: TerrainType,
    isCounter: boolean,
  ): number;

  canAttack(attackerType: UnitType, defenderType: UnitType): boolean;
  getUnitCost(unitType: UnitType): number;

  getBuildableUnits(buildingType: TerrainType): UnitType[];
  getRepairAmount(): number;
  getFuelCostPerTurn(unitType: UnitType): number;
  getIncomePerProperty(): number;
}
