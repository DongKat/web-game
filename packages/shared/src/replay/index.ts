import type { Command } from '../types/commands.js';
import type { GameConfig } from '../types/index.js';

export interface ReplayMetadata {
  gameId: string;
  config: GameConfig;
  startedAt: string;  // ISO date
  endedAt: string;
  winnerId: string | null;
  playerNames: Record<string, string>;
}

export interface ReplayData {
  version: 1;
  metadata: ReplayMetadata;
  commands: ReplayCommand[];
}

export interface ReplayCommand {
  turn: number;
  playerIndex: number;
  command: Command;
  timestamp: number; // ms from game start
}

export function encodeReplay(data: ReplayData): string {
  return JSON.stringify(data);
}

export function decodeReplay(encoded: string): ReplayData {
  const parsed = JSON.parse(encoded) as ReplayData;
  if (parsed.version !== 1) {
    throw new Error(`Unsupported replay version: ${parsed.version}`);
  }
  return parsed;
}
