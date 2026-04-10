export interface Point {
  col: number;
  row: number;
}

// ── Teams & Players ──

export type TeamColor = 'blue' | 'red' | 'green' | 'orange' | 'gray';

export interface Player {
  id: string;
  name: string;
  team: TeamColor;
  funds: number;
  coId: string | null;
  powerMeter: number;
  eliminated: boolean;
}

// ── Terrain ──

export type TerrainType =
  | 'plain'
  | 'road'
  | 'bridge'
  | 'forest'
  | 'mountain'
  | 'river'
  | 'sea'
  | 'reef'
  | 'shoal'
  | 'city'
  | 'factory'
  | 'airport'
  | 'port'
  | 'hq'
  | 'silo'
  | 'comtower';

// ── Units ──

export type UnitType =
  | 'infantry'
  | 'mech'
  | 'recon'
  | 'apc'
  | 'tank'
  | 'mdtank'
  | 'neotank'
  | 'megatank'
  | 'artillery'
  | 'rocket'
  | 'missile'
  | 'antiair'
  | 'fighter'
  | 'bomber'
  | 'battlecopter'
  | 'transportcopter'
  | 'battleship'
  | 'cruiser'
  | 'lander'
  | 'sub'
  | 'carrier'
  | 'stealth'
  | 'blackbomb'
  | 'piperunner';

export type MovementClass =
  | 'foot'
  | 'mech'
  | 'tread'
  | 'tire'
  | 'air'
  | 'ship'
  | 'transport'
  | 'pipe';

export interface UnitState {
  id: string;
  type: UnitType;
  owner: string;       // player id
  hp: number;          // 1-100 (display as 1-10)
  ammo: number;
  fuel: number;
  position: Point;
  hasMoved: boolean;
  hasActed: boolean;
  isHidden: boolean;   // stealth/sub dive
  captureProgress: number;
  loaded: string[];    // unit IDs loaded inside (APC, lander, etc.)
}

// ── Buildings ──

export interface BuildingState {
  id: string;
  type: TerrainType;   // only building terrain types
  owner: string | null; // null = neutral
  position: Point;
  capturePoints: number; // 20 = full, capturing reduces this
}

// ── Map ──

export interface TerrainCell {
  type: TerrainType;
  tileId: number;      // visual tile ID for rendering
}

export interface MapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  terrain: TerrainCell[][];  // [row][col]
  preDeployedUnits: Omit<UnitState, 'id'>[];
  preDeployedBuildings: Omit<BuildingState, 'id'>[];
  playerCount: number;
  startingFunds: number[];
}

// ── Weather ──

export type Weather = 'clear' | 'rain' | 'snow' | 'sandstorm';

// ── Game Configuration ──

export type GameRuleSetId = 'aw1' | 'aw2' | 'awds' | 'awdor';

export interface GameConfig {
  ruleSet: GameRuleSetId;
  mapId: string;
  players: PlayerConfig[];
  fogOfWar: boolean;
  weather: Weather;
  fundsPerProperty: number;
  turnLimit: number | null;
}

export interface PlayerConfig {
  id: string;
  name: string;
  team: TeamColor;
  coId: string | null;
  isAI: boolean;
}

// ── Full Game State ──

export interface GameState {
  config: GameConfig;
  turn: number;
  currentPlayerIndex: number;
  players: Player[];
  units: UnitState[];
  buildings: BuildingState[];
  weather: Weather;
  phase: TurnPhase;
  winner: string | null; // player ID or null
}

export type TurnPhase = 'income' | 'main' | 'end';
