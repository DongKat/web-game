import type { GameConfig, GameEvent, TeamColor } from '@web-game/shared';
import { GameSessionManager } from '../game/GameSessionManager.js';
import type { GameSessionPlayer } from '../game/GameSession.js';
import { v4 as uuidv4 } from 'uuid';

export interface LobbyRoom {
  id: string;
  name: string;
  hostId: string;
  config: Partial<GameConfig>;
  slots: LobbySlot[];
  maxPlayers: number;
  state: 'waiting' | 'starting' | 'ingame';
}

export interface LobbySlot {
  playerId: string | null;
  socketId: string | null;
  name: string;
  team: TeamColor;
  isAI: boolean;
  ready: boolean;
}

const DEFAULT_TEAMS: TeamColor[] = ['blue', 'red', 'green', 'orange'];

export class LobbyManager {
  private rooms = new Map<string, LobbyRoom>();
  private sessionManager: GameSessionManager;

  constructor(sessionManager: GameSessionManager) {
    this.sessionManager = sessionManager;
  }

  createRoom(hostSocketId: string, hostName: string, config: Partial<GameConfig> = {}): LobbyRoom {
    const maxPlayers = config.players?.length ?? 2;
    const roomId = uuidv4().slice(0, 8);

    const slots: LobbySlot[] = Array.from({ length: maxPlayers }, (_, i) => ({
      playerId: i === 0 ? hostSocketId : null,
      socketId: i === 0 ? hostSocketId : null,
      name: i === 0 ? hostName : `Open`,
      team: DEFAULT_TEAMS[i] ?? 'gray',
      isAI: false,
      ready: false,
    }));

    const room: LobbyRoom = {
      id: roomId,
      name: `${hostName}'s game`,
      hostId: hostSocketId,
      config,
      slots,
      maxPlayers,
      state: 'waiting',
    };

    this.rooms.set(roomId, room);
    console.log(`[Lobby] Room ${roomId} created by ${hostName}`);
    return room;
  }

  joinRoom(roomId: string, socketId: string, playerName: string): LobbyRoom | null {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'waiting') return null;

    const emptySlot = room.slots.find(s => s.playerId === null && !s.isAI);
    if (!emptySlot) return null;

    emptySlot.playerId = socketId;
    emptySlot.socketId = socketId;
    emptySlot.name = playerName;

    console.log(`[Lobby] ${playerName} joined room ${roomId}`);
    return room;
  }

  leaveRoom(roomId: string, socketId: string): LobbyRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const slot = room.slots.find(s => s.socketId === socketId);
    if (slot) {
      slot.playerId = null;
      slot.socketId = null;
      slot.name = 'Open';
      slot.ready = false;
    }

    // If host left, close room
    if (room.hostId === socketId) {
      this.rooms.delete(roomId);
      return null;
    }

    return room;
  }

  setReady(roomId: string, socketId: string, ready: boolean): LobbyRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const slot = room.slots.find(s => s.socketId === socketId);
    if (slot) slot.ready = ready;

    return room;
  }

  canStart(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'waiting') return false;

    const filledSlots = room.slots.filter(s => s.playerId !== null || s.isAI);
    if (filledSlots.length < 2) return false;

    return filledSlots.every(s => s.isAI || s.ready);
  }

  startGame(
    roomId: string,
    onEvent: (events: GameEvent[], sessionId: string) => void,
  ): string | null {
    const room = this.rooms.get(roomId);
    if (!room || !this.canStart(roomId)) return null;

    room.state = 'starting';

    const players: GameSessionPlayer[] = room.slots
      .filter(s => s.playerId !== null || s.isAI)
      .map(s => ({
        id: s.playerId ?? `ai_${uuidv4().slice(0, 8)}`,
        socketId: s.isAI ? null : s.socketId,
        name: s.name,
        isAI: s.isAI,
      }));

    const config: GameConfig = {
      ruleSet: room.config.ruleSet ?? 'aw1',
      mapId: room.config.mapId ?? 'sample',
      players: players.map((p, i) => ({
        id: p.id,
        name: p.name,
        team: room.slots[i]!.team,
        coId: null,
        isAI: p.isAI,
      })),
      fogOfWar: room.config.fogOfWar ?? false,
      weather: room.config.weather ?? 'clear',
      fundsPerProperty: room.config.fundsPerProperty ?? 1000,
      turnLimit: room.config.turnLimit ?? null,
    };

    const session = this.sessionManager.createSession(config, players, onEvent);
    room.state = 'ingame';

    return session.id;
  }

  getRoom(roomId: string): LobbyRoom | undefined {
    return this.rooms.get(roomId);
  }

  listRooms(): LobbyRoom[] {
    return [...this.rooms.values()].filter(r => r.state === 'waiting');
  }

  getRoomBySocketId(socketId: string): LobbyRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.slots.some(s => s.socketId === socketId)) {
        return room;
      }
    }
    return undefined;
  }
}
