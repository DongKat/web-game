import type { Point, UnitState, BuildingState, Weather, TeamColor } from './index.js';

// ── Game Events (server → client) ──

export interface UnitMovedEvent {
  type: 'unitMoved';
  unitId: string;
  path: Point[];
}

export interface UnitDamagedEvent {
  type: 'unitDamaged';
  unitId: string;
  damage: number;
  newHp: number;
}

export interface UnitDestroyedEvent {
  type: 'unitDestroyed';
  unitId: string;
}

export interface UnitCreatedEvent {
  type: 'unitCreated';
  unit: UnitState;
}

export interface UnitWaitedEvent {
  type: 'unitWaited';
  unitId: string;
}

export interface BuildingCapturedEvent {
  type: 'buildingCaptured';
  buildingId: string;
  newOwner: string;
}

export interface CaptureProgressEvent {
  type: 'captureProgress';
  buildingId: string;
  unitId: string;
  remainingPoints: number;
}

export interface TurnChangedEvent {
  type: 'turnChanged';
  turn: number;
  currentPlayerIndex: number;
  playerId: string;
}

export interface IncomeEvent {
  type: 'income';
  playerId: string;
  amount: number;
  newFunds: number;
}

export interface WeatherChangedEvent {
  type: 'weatherChanged';
  weather: Weather;
}

export interface COPowerActivatedEvent {
  type: 'coPowerActivated';
  playerId: string;
  coId: string;
  level: 'power' | 'super';
}

export interface GameOverEvent {
  type: 'gameOver';
  winnerId: string;
  reason: 'hqCaptured' | 'allUnitsDestroyed' | 'surrender' | 'turnLimit';
}

export interface UnitLoadedEvent {
  type: 'unitLoaded';
  unitId: string;
  transportId: string;
}

export interface UnitUnloadedEvent {
  type: 'unitUnloaded';
  unitId: string;
  transportId: string;
  position: Point;
}

export interface UnitJoinedEvent {
  type: 'unitJoined';
  unitId: string;
  targetId: string;
  newHp: number;
}

export interface FundsChangedEvent {
  type: 'fundsChanged';
  playerId: string;
  newFunds: number;
}

export type GameEvent =
  | UnitMovedEvent
  | UnitDamagedEvent
  | UnitDestroyedEvent
  | UnitCreatedEvent
  | UnitWaitedEvent
  | BuildingCapturedEvent
  | CaptureProgressEvent
  | TurnChangedEvent
  | IncomeEvent
  | WeatherChangedEvent
  | COPowerActivatedEvent
  | GameOverEvent
  | UnitLoadedEvent
  | UnitUnloadedEvent
  | UnitJoinedEvent
  | FundsChangedEvent;
