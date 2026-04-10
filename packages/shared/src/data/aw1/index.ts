import type { UnitType, TerrainType, MovementClass, Weather, UnitState } from '../../types/index.js';
import type { IGameRuleSet, UnitStats, TerrainStats } from '../../rules/IGameRuleSet.js';

// ── AW1 Unit Stats ──

const UNIT_STATS: Record<UnitType, UnitStats> = {
  infantry:        { type: 'infantry',        movementClass: 'foot',      moveRange: 3, vision: 2, cost: 1000,  fuel: 99, maxFuel: 99, ammo: 0,  maxAmmo: 0,  minRange: 1, maxRange: 1, canCapture: true,  canLoad: [], loadCapacity: 0 },
  mech:            { type: 'mech',            movementClass: 'mech',      moveRange: 2, vision: 2, cost: 3000,  fuel: 70, maxFuel: 70, ammo: 3,  maxAmmo: 3,  minRange: 1, maxRange: 1, canCapture: true,  canLoad: [], loadCapacity: 0 },
  recon:           { type: 'recon',           movementClass: 'tire',      moveRange: 8, vision: 5, cost: 4000,  fuel: 80, maxFuel: 80, ammo: 0,  maxAmmo: 0,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  apc:             { type: 'apc',             movementClass: 'tread',     moveRange: 6, vision: 1, cost: 5000,  fuel: 70, maxFuel: 70, ammo: 0,  maxAmmo: 0,  minRange: 0, maxRange: 0, canCapture: false, canLoad: ['infantry', 'mech'], loadCapacity: 1 },
  tank:            { type: 'tank',            movementClass: 'tread',     moveRange: 6, vision: 3, cost: 7000,  fuel: 70, maxFuel: 70, ammo: 9,  maxAmmo: 9,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  mdtank:          { type: 'mdtank',          movementClass: 'tread',     moveRange: 5, vision: 1, cost: 16000, fuel: 50, maxFuel: 50, ammo: 8,  maxAmmo: 8,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  neotank:         { type: 'neotank',         movementClass: 'tread',     moveRange: 6, vision: 1, cost: 22000, fuel: 99, maxFuel: 99, ammo: 9,  maxAmmo: 9,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  megatank:        { type: 'megatank',        movementClass: 'tread',     moveRange: 4, vision: 1, cost: 28000, fuel: 50, maxFuel: 50, ammo: 3,  maxAmmo: 3,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  artillery:       { type: 'artillery',       movementClass: 'tread',     moveRange: 5, vision: 1, cost: 6000,  fuel: 50, maxFuel: 50, ammo: 9,  maxAmmo: 9,  minRange: 2, maxRange: 3, canCapture: false, canLoad: [], loadCapacity: 0 },
  rocket:          { type: 'rocket',          movementClass: 'tire',      moveRange: 5, vision: 1, cost: 15000, fuel: 50, maxFuel: 50, ammo: 6,  maxAmmo: 6,  minRange: 3, maxRange: 5, canCapture: false, canLoad: [], loadCapacity: 0 },
  missile:         { type: 'missile',         movementClass: 'tire',      moveRange: 4, vision: 5, cost: 12000, fuel: 50, maxFuel: 50, ammo: 6,  maxAmmo: 6,  minRange: 3, maxRange: 5, canCapture: false, canLoad: [], loadCapacity: 0 },
  antiair:         { type: 'antiair',         movementClass: 'tread',     moveRange: 6, vision: 2, cost: 8000,  fuel: 60, maxFuel: 60, ammo: 9,  maxAmmo: 9,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  fighter:         { type: 'fighter',         movementClass: 'air',       moveRange: 9, vision: 2, cost: 20000, fuel: 99, maxFuel: 99, ammo: 9,  maxAmmo: 9,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  bomber:          { type: 'bomber',          movementClass: 'air',       moveRange: 7, vision: 2, cost: 22000, fuel: 99, maxFuel: 99, ammo: 9,  maxAmmo: 9,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  battlecopter:    { type: 'battlecopter',    movementClass: 'air',       moveRange: 6, vision: 3, cost: 9000,  fuel: 99, maxFuel: 99, ammo: 6,  maxAmmo: 6,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  transportcopter: { type: 'transportcopter', movementClass: 'air',       moveRange: 6, vision: 2, cost: 5000,  fuel: 99, maxFuel: 99, ammo: 0,  maxAmmo: 0,  minRange: 0, maxRange: 0, canCapture: false, canLoad: ['infantry', 'mech'], loadCapacity: 1 },
  battleship:      { type: 'battleship',      movementClass: 'ship',      moveRange: 5, vision: 2, cost: 28000, fuel: 99, maxFuel: 99, ammo: 9,  maxAmmo: 9,  minRange: 2, maxRange: 6, canCapture: false, canLoad: [], loadCapacity: 0 },
  cruiser:         { type: 'cruiser',         movementClass: 'ship',      moveRange: 6, vision: 3, cost: 18000, fuel: 99, maxFuel: 99, ammo: 9,  maxAmmo: 9,  minRange: 1, maxRange: 1, canCapture: false, canLoad: ['battlecopter', 'transportcopter'], loadCapacity: 2 },
  lander:          { type: 'lander',          movementClass: 'transport', moveRange: 6, vision: 1, cost: 12000, fuel: 99, maxFuel: 99, ammo: 0,  maxAmmo: 0,  minRange: 0, maxRange: 0, canCapture: false, canLoad: ['infantry', 'mech', 'recon', 'apc', 'tank', 'mdtank', 'neotank', 'artillery', 'rocket', 'missile', 'antiair'], loadCapacity: 2 },
  sub:             { type: 'sub',             movementClass: 'ship',      moveRange: 5, vision: 5, cost: 20000, fuel: 60, maxFuel: 60, ammo: 6,  maxAmmo: 6,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  carrier:         { type: 'carrier',         movementClass: 'ship',      moveRange: 5, vision: 4, cost: 30000, fuel: 99, maxFuel: 99, ammo: 9,  maxAmmo: 9,  minRange: 3, maxRange: 8, canCapture: false, canLoad: ['fighter', 'bomber', 'battlecopter', 'transportcopter', 'stealth', 'blackbomb'], loadCapacity: 2 },
  stealth:         { type: 'stealth',         movementClass: 'air',       moveRange: 6, vision: 4, cost: 24000, fuel: 60, maxFuel: 60, ammo: 6,  maxAmmo: 6,  minRange: 1, maxRange: 1, canCapture: false, canLoad: [], loadCapacity: 0 },
  blackbomb:       { type: 'blackbomb',       movementClass: 'air',       moveRange: 9, vision: 1, cost: 25000, fuel: 45, maxFuel: 45, ammo: 0,  maxAmmo: 0,  minRange: 0, maxRange: 0, canCapture: false, canLoad: [], loadCapacity: 0 },
  piperunner:      { type: 'piperunner',      movementClass: 'pipe',      moveRange: 9, vision: 4, cost: 20000, fuel: 99, maxFuel: 99, ammo: 9,  maxAmmo: 9,  minRange: 2, maxRange: 5, canCapture: false, canLoad: [], loadCapacity: 0 },
};

// ── AW1 Terrain Stats ──

const TERRAIN_STATS: Record<TerrainType, TerrainStats> = {
  plain:    { type: 'plain',    defense: 1, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 2, air: 1, ship: null, transport: null, pipe: null }, isProperty: false, canRepair: [], incomePerTurn: 0 },
  road:     { type: 'road',     defense: 0, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 1, air: 1, ship: null, transport: null, pipe: null }, isProperty: false, canRepair: [], incomePerTurn: 0 },
  bridge:   { type: 'bridge',   defense: 0, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 1, air: 1, ship: null, transport: null, pipe: null }, isProperty: false, canRepair: [], incomePerTurn: 0 },
  forest:   { type: 'forest',   defense: 2, movementCosts: { foot: 1, mech: 1, tread: 2, tire: 3, air: 1, ship: null, transport: null, pipe: null }, isProperty: false, canRepair: [], incomePerTurn: 0 },
  mountain: { type: 'mountain', defense: 4, movementCosts: { foot: 2, mech: 1, tread: null, tire: null, air: 1, ship: null, transport: null, pipe: null }, isProperty: false, canRepair: [], incomePerTurn: 0 },
  river:    { type: 'river',    defense: 0, movementCosts: { foot: 2, mech: 1, tread: null, tire: null, air: 1, ship: null, transport: null, pipe: null }, isProperty: false, canRepair: [], incomePerTurn: 0 },
  sea:      { type: 'sea',      defense: 0, movementCosts: { foot: null, mech: null, tread: null, tire: null, air: 1, ship: 1, transport: 1, pipe: null }, isProperty: false, canRepair: [], incomePerTurn: 0 },
  reef:     { type: 'reef',     defense: 1, movementCosts: { foot: null, mech: null, tread: null, tire: null, air: 1, ship: 2, transport: 2, pipe: null }, isProperty: false, canRepair: [], incomePerTurn: 0 },
  shoal:    { type: 'shoal',    defense: 0, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 1, air: 1, ship: null, transport: 1, pipe: null }, isProperty: false, canRepair: [], incomePerTurn: 0 },
  city:     { type: 'city',     defense: 3, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 1, air: 1, ship: null, transport: null, pipe: null }, isProperty: true, canRepair: ['infantry', 'mech', 'recon', 'apc', 'tank', 'mdtank', 'neotank', 'megatank', 'artillery', 'rocket', 'missile', 'antiair', 'piperunner'], incomePerTurn: 1000 },
  factory:  { type: 'factory',  defense: 3, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 1, air: 1, ship: null, transport: null, pipe: null }, isProperty: true, canRepair: ['infantry', 'mech', 'recon', 'apc', 'tank', 'mdtank', 'neotank', 'megatank', 'artillery', 'rocket', 'missile', 'antiair', 'piperunner'], incomePerTurn: 1000 },
  airport:  { type: 'airport',  defense: 3, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 1, air: 1, ship: null, transport: null, pipe: null }, isProperty: true, canRepair: ['fighter', 'bomber', 'battlecopter', 'transportcopter', 'stealth', 'blackbomb'], incomePerTurn: 1000 },
  port:     { type: 'port',     defense: 3, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 1, air: 1, ship: 1, transport: 1, pipe: null }, isProperty: true, canRepair: ['battleship', 'cruiser', 'lander', 'sub', 'carrier'], incomePerTurn: 1000 },
  hq:       { type: 'hq',       defense: 4, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 1, air: 1, ship: null, transport: null, pipe: null }, isProperty: true, canRepair: ['infantry', 'mech', 'recon', 'apc', 'tank', 'mdtank', 'neotank', 'megatank', 'artillery', 'rocket', 'missile', 'antiair', 'piperunner'], incomePerTurn: 1000 },
  silo:     { type: 'silo',     defense: 3, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 1, air: 1, ship: null, transport: null, pipe: null }, isProperty: false, canRepair: [], incomePerTurn: 0 },
  comtower: { type: 'comtower', defense: 3, movementCosts: { foot: 1, mech: 1, tread: 1, tire: 1, air: 1, ship: null, transport: null, pipe: null }, isProperty: true, canRepair: [], incomePerTurn: 1000 },
};

// ── AW1 Damage Matrix (base damage percentages, attacker → defender) ──
// Simplified: primary weapon damage. -1 means cannot attack.

type DamageKey = `${UnitType}_${UnitType}`;

const BASE_DAMAGE: Partial<Record<DamageKey, number>> = {
  // Infantry attacking
  infantry_infantry: 55, infantry_mech: 45, infantry_recon: 12, infantry_apc: 14,
  infantry_tank: 5, infantry_mdtank: 1, infantry_antiair: 5,
  infantry_artillery: 15, infantry_rocket: 25, infantry_missile: 25,

  // Mech attacking
  mech_infantry: 65, mech_mech: 55, mech_recon: 85, mech_apc: 75,
  mech_tank: 55, mech_mdtank: 15, mech_neotank: 15, mech_megatank: 5,
  mech_antiair: 65, mech_artillery: 70, mech_rocket: 85, mech_missile: 85,

  // Tank attacking
  tank_infantry: 75, tank_mech: 70, tank_recon: 85, tank_apc: 75,
  tank_tank: 55, tank_mdtank: 15, tank_neotank: 15, tank_megatank: 10,
  tank_antiair: 65, tank_artillery: 70, tank_rocket: 85, tank_missile: 85,
  tank_battlecopter: 10, tank_transportcopter: 40,

  // Md Tank attacking
  mdtank_infantry: 105, mdtank_mech: 95, mdtank_recon: 105, mdtank_apc: 105,
  mdtank_tank: 85, mdtank_mdtank: 55, mdtank_neotank: 45, mdtank_megatank: 25,
  mdtank_antiair: 105, mdtank_artillery: 105, mdtank_rocket: 105, mdtank_missile: 105,

  // Artillery attacking
  artillery_infantry: 90, artillery_mech: 85, artillery_recon: 80, artillery_apc: 70,
  artillery_tank: 70, artillery_mdtank: 45, artillery_neotank: 40, artillery_megatank: 15,
  artillery_antiair: 75, artillery_artillery: 75, artillery_rocket: 80, artillery_missile: 80,

  // Anti-Air attacking
  antiair_infantry: 105, antiair_mech: 105, antiair_recon: 60, antiair_apc: 50,
  antiair_tank: 25, antiair_antiair: 45,
  antiair_fighter: 65, antiair_bomber: 75, antiair_battlecopter: 120, antiair_transportcopter: 120,
  antiair_stealth: 75, antiair_blackbomb: 120,

  // Rocket attacking
  rocket_infantry: 95, rocket_mech: 90, rocket_recon: 90, rocket_apc: 80,
  rocket_tank: 80, rocket_mdtank: 55, rocket_neotank: 50, rocket_megatank: 25,
  rocket_antiair: 85, rocket_artillery: 80, rocket_rocket: 85, rocket_missile: 85,

  // Missile attacking (anti-air only)
  missile_fighter: 100, missile_bomber: 100, missile_battlecopter: 120, missile_transportcopter: 120,
  missile_stealth: 100, missile_blackbomb: 120,

  // Fighter attacking
  fighter_fighter: 55, fighter_bomber: 100, fighter_battlecopter: 100, fighter_transportcopter: 100,
  fighter_stealth: 85, fighter_blackbomb: 120,

  // Bomber attacking
  bomber_infantry: 110, bomber_mech: 110, bomber_recon: 105, bomber_apc: 105,
  bomber_tank: 105, bomber_mdtank: 95, bomber_neotank: 90, bomber_megatank: 35,
  bomber_antiair: 95, bomber_artillery: 105, bomber_rocket: 105, bomber_missile: 105,
  bomber_battleship: 75, bomber_cruiser: 85, bomber_lander: 95, bomber_sub: 95, bomber_carrier: 75,

  // Battle Copter attacking
  battlecopter_infantry: 75, battlecopter_mech: 75, battlecopter_recon: 55, battlecopter_apc: 60,
  battlecopter_tank: 55, battlecopter_mdtank: 25, battlecopter_antiair: 25,
  battlecopter_artillery: 65, battlecopter_rocket: 65, battlecopter_missile: 65,
  battlecopter_battlecopter: 65, battlecopter_transportcopter: 95,
  battlecopter_battleship: 25, battlecopter_cruiser: 55, battlecopter_lander: 25, battlecopter_sub: 25,

  // Battleship attacking
  battleship_infantry: 95, battleship_mech: 90, battleship_recon: 90, battleship_apc: 80,
  battleship_tank: 80, battleship_mdtank: 55, battleship_neotank: 50, battleship_megatank: 25,
  battleship_antiair: 85, battleship_artillery: 80, battleship_rocket: 85, battleship_missile: 85,
  battleship_battleship: 50, battleship_cruiser: 95, battleship_lander: 95, battleship_sub: 95, battleship_carrier: 60,

  // Cruiser attacking
  cruiser_sub: 90, cruiser_battleship: 5, cruiser_cruiser: 5, cruiser_lander: 25, cruiser_carrier: 5,
  cruiser_fighter: 55, cruiser_bomber: 65, cruiser_battlecopter: 115, cruiser_transportcopter: 115,
  cruiser_stealth: 100, cruiser_blackbomb: 120,

  // Sub attacking
  sub_battleship: 55, sub_cruiser: 25, sub_lander: 95, sub_sub: 55, sub_carrier: 75,

  // Recon attacking
  recon_infantry: 75, recon_mech: 65, recon_recon: 35, recon_apc: 45,
  recon_tank: 6, recon_antiair: 4, recon_artillery: 45, recon_rocket: 55, recon_missile: 28,
};

// ── AW1 Rule Set Implementation ──

export class AW1RuleSet implements IGameRuleSet {
  readonly id = 'aw1';
  readonly name = 'Advance Wars';

  getUnitStats(unitType: UnitType): UnitStats {
    const stats = UNIT_STATS[unitType];
    if (!stats) throw new Error(`Unknown unit type: ${unitType}`);
    return { ...stats };
  }

  getTerrainStats(terrainType: TerrainType): TerrainStats {
    const stats = TERRAIN_STATS[terrainType];
    if (!stats) throw new Error(`Unknown terrain type: ${terrainType}`);
    return { ...stats };
  }

  getMovementCost(movementClass: MovementClass, terrainType: TerrainType, _weather: Weather): number | null {
    const terrain = TERRAIN_STATS[terrainType];
    if (!terrain) return null;
    const cost = terrain.movementCosts[movementClass];
    return cost ?? null;
  }

  getAttackRange(unitType: UnitType): { min: number; max: number } {
    const stats = UNIT_STATS[unitType];
    return { min: stats.minRange, max: stats.maxRange };
  }

  getVisionRange(unitType: UnitType, terrainType: TerrainType, _weather: Weather): number {
    const stats = UNIT_STATS[unitType];
    let vision = stats.vision;
    if (terrainType === 'mountain' && (stats.movementClass === 'foot' || stats.movementClass === 'mech')) {
      vision += 3;
    }
    return vision;
  }

  calculateDamage(
    attacker: UnitState,
    defender: UnitState,
    _attackerTerrain: TerrainType,
    defenderTerrain: TerrainType,
    _isCounter: boolean,
  ): number {
    const key: DamageKey = `${attacker.type}_${defender.type}`;
    const baseDamage = BASE_DAMAGE[key];
    if (baseDamage === undefined) return 0;

    const atkHpFactor = attacker.hp / 100;
    const defenseStars = TERRAIN_STATS[defenderTerrain]?.defense ?? 0;
    const terrainReduction = defenseStars * (defender.hp / 100) * 0.1;

    const damage = baseDamage * atkHpFactor * (1 - terrainReduction);
    return Math.max(0, Math.floor(damage));
  }

  canAttack(attackerType: UnitType, defenderType: UnitType): boolean {
    const key: DamageKey = `${attackerType}_${defenderType}`;
    return BASE_DAMAGE[key] !== undefined;
  }

  getUnitCost(unitType: UnitType): number {
    return UNIT_STATS[unitType].cost;
  }

  getBuildableUnits(buildingType: TerrainType): UnitType[] {
    switch (buildingType) {
      case 'factory':
        return ['infantry', 'mech', 'recon', 'apc', 'tank', 'mdtank', 'neotank', 'megatank', 'artillery', 'rocket', 'missile', 'antiair', 'piperunner'];
      case 'airport':
        return ['fighter', 'bomber', 'battlecopter', 'transportcopter', 'stealth', 'blackbomb'];
      case 'port':
        return ['battleship', 'cruiser', 'lander', 'sub', 'carrier'];
      default:
        return [];
    }
  }

  getRepairAmount(): number {
    return 20; // 2 HP displayed
  }

  getFuelCostPerTurn(unitType: UnitType): number {
    const stats = UNIT_STATS[unitType];
    if (stats.movementClass === 'air') return 5;
    if (stats.movementClass === 'ship' || stats.movementClass === 'transport') return 1;
    if (unitType === 'stealth' || unitType === 'sub') return 8; // hidden costs more
    return 0;
  }

  getIncomePerProperty(): number {
    return 1000;
  }
}
