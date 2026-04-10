// Types
export type {
  Point,
  TeamColor,
  Player,
  TerrainType,
  UnitType,
  MovementClass,
  UnitState,
  BuildingState,
  TerrainCell,
  MapDefinition,
  Weather,
  GameRuleSetId,
  GameConfig,
  PlayerConfig,
  GameState,
  TurnPhase,
} from './types/index.js';

export type {
  Command,
  MoveCommand,
  AttackCommand,
  CaptureCommand,
  BuildCommand,
  WaitCommand,
  EndTurnCommand,
  COPowerCommand,
  LoadCommand,
  UnloadCommand,
  JoinCommand,
} from './types/commands.js';

export type {
  GameEvent,
  UnitMovedEvent,
  UnitDamagedEvent,
  UnitDestroyedEvent,
  UnitCreatedEvent,
  UnitWaitedEvent,
  BuildingCapturedEvent,
  CaptureProgressEvent,
  TurnChangedEvent,
  IncomeEvent,
  WeatherChangedEvent,
  COPowerActivatedEvent,
  GameOverEvent,
  UnitLoadedEvent,
  UnitUnloadedEvent,
  UnitJoinedEvent,
  FundsChangedEvent,
} from './types/events.js';

// Rules
export type { IGameRuleSet, UnitStats, TerrainStats, DamageResult } from './rules/IGameRuleSet.js';
export { GameEngine } from './rules/GameEngine.js';
export type { CommandResult } from './rules/GameEngine.js';
export { Pathfinder } from './rules/Pathfinder.js';
export type { PathGrid } from './rules/Pathfinder.js';
export { createRuleSet } from './rules/RuleSetFactory.js';

// Data
export { AW1RuleSet } from './data/aw1/index.js';

// Replay
export { encodeReplay, decodeReplay } from './replay/index.js';
export type { ReplayData, ReplayMetadata, ReplayCommand } from './replay/index.js';
