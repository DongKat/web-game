import type { GameConfig, GameEvent } from '@web-game/shared';
import { GameSession } from './GameSession.js';
import type { GameSessionPlayer } from './GameSession.js';

export class GameSessionManager {
  private sessions = new Map<string, GameSession>();

  createSession(
    config: GameConfig,
    players: GameSessionPlayer[],
    onEvent: (events: GameEvent[], sessionId: string) => void,
  ): GameSession {
    const session = new GameSession(config, players, onEvent);
    this.sessions.set(session.id, session);
    console.log(`[SessionManager] Created session ${session.id} with ${players.length} players`);
    return session;
  }

  getSession(id: string): GameSession | undefined {
    return this.sessions.get(id);
  }

  removeSession(id: string): void {
    this.sessions.delete(id);
    console.log(`[SessionManager] Removed session ${id}`);
  }

  getSessionBySocketId(socketId: string): GameSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.getPlayerBySocketId(socketId)) {
        return session;
      }
    }
    return undefined;
  }

  getActiveSessions(): GameSession[] {
    return [...this.sessions.values()].filter(s => !s.isGameOver());
  }
}
