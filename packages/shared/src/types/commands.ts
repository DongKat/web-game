import type { UnitState, Point } from './index.js';

// ── Commands (client → server) ──

export interface MoveCommand {
  type: 'move';
  unitId: string;
  path: Point[];
}

export interface AttackCommand {
  type: 'attack';
  attackerId: string;
  defenderId: string;
}

export interface CaptureCommand {
  type: 'capture';
  unitId: string;
  buildingId: string;
}

export interface BuildCommand {
  type: 'build';
  buildingId: string;
  unitType: UnitState['type'];
}

export interface WaitCommand {
  type: 'wait';
  unitId: string;
}

export interface EndTurnCommand {
  type: 'endTurn';
}

export interface COPowerCommand {
  type: 'coPower';
  playerId: string;
  level: 'power' | 'super';
}

export interface LoadCommand {
  type: 'load';
  unitId: string;
  transportId: string;
}

export interface UnloadCommand {
  type: 'unload';
  transportId: string;
  unitId: string;
  position: Point;
}

export interface JoinCommand {
  type: 'join';
  unitId: string;
  targetId: string;
}

export type Command =
  | MoveCommand
  | AttackCommand
  | CaptureCommand
  | BuildCommand
  | WaitCommand
  | EndTurnCommand
  | COPowerCommand
  | LoadCommand
  | UnloadCommand
  | JoinCommand;
