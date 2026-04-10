import type {
  GameState,
  GameConfig,
  Command,
  GameEvent,
  UnitState,
  BuildingState,
  Player,
} from '@web-game/shared';
import { GameEngine, createRuleSet } from '@web-game/shared';
import type { IGameRuleSet } from '@web-game/shared';
import type { ReplayCommand } from '@web-game/shared';
import { v4 as uuidv4 } from 'uuid';

export interface GameSessionPlayer {
  id: string;
  socketId: string | null; // null for AI players
  name: string;
  isAI: boolean;
}

export class GameSession {
  readonly id: string;
  private state: GameState;
  private rules: IGameRuleSet;
  private players: GameSessionPlayer[];
  private replayLog: ReplayCommand[] = [];
  private startedAt: Date;
  private onEvent: (events: GameEvent[], sessionId: string) => void;

  constructor(
    config: GameConfig,
    players: GameSessionPlayer[],
    onEvent: (events: GameEvent[], sessionId: string) => void,
  ) {
    this.id = uuidv4();
    this.rules = createRuleSet(config.ruleSet);
    this.players = players;
    this.onEvent = onEvent;
    this.startedAt = new Date();

    // Build initial game state
    this.state = this.buildInitialState(config, players);
  }

  getState(): GameState {
    return this.state;
  }

  getReplayLog(): ReplayCommand[] {
    return this.replayLog;
  }

  getPlayers(): GameSessionPlayer[] {
    return this.players;
  }

  getPlayerBySocketId(socketId: string): GameSessionPlayer | undefined {
    return this.players.find(p => p.socketId === socketId);
  }

  receiveCommand(playerId: string, command: Command): { success: boolean; error?: string } {
    // Validate
    const error = GameEngine.validateCommand(this.state, command, playerId, this.rules);
    if (error) {
      return { success: false, error };
    }

    // Apply
    const { newState, events } = GameEngine.applyCommand(this.state, command, this.rules);
    this.state = newState;

    // Log for replay
    this.replayLog.push({
      turn: this.state.turn,
      playerIndex: this.state.currentPlayerIndex,
      command,
      timestamp: Date.now() - this.startedAt.getTime(),
    });

    // Broadcast events
    if (events.length > 0) {
      this.onEvent(events, this.id);
    }

    return { success: true };
  }

  isGameOver(): boolean {
    return this.state.winner !== null;
  }

  private buildInitialState(config: GameConfig, players: GameSessionPlayer[]): GameState {
    const gamePlayers: Player[] = players.map((p, i) => ({
      id: p.id,
      name: p.name,
      team: config.players[i]!.team,
      funds: config.fundsPerProperty * 2, // starting funds = 2 properties worth
      coId: config.players[i]!.coId,
      powerMeter: 0,
      eliminated: false,
    }));

    return {
      config,
      turn: 1,
      currentPlayerIndex: 0,
      players: gamePlayers,
      units: [], // populated from map definition later
      buildings: [],
      weather: config.weather,
      phase: 'main',
      winner: null,
    };
  }
}
