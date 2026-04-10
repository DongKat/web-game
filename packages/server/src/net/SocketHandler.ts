import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { Command, GameEvent } from '@web-game/shared';
import type { GameSessionManager } from '../game/GameSessionManager.js';
import type { LobbyManager } from '../lobby/LobbyManager.js';

export class SocketHandler {
  private io: SocketIOServer;
  private sessionManager: GameSessionManager;
  private lobbyManager: LobbyManager;

  constructor(
    io: SocketIOServer,
    sessionManager: GameSessionManager,
    lobbyManager: LobbyManager,
  ) {
    this.io = io;
    this.sessionManager = sessionManager;
    this.lobbyManager = lobbyManager;
  }

  init(): void {
    this.io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      // ── Lobby Events ──

      socket.on('lobby:create', (data: { name: string; config?: Record<string, unknown> }) => {
        const room = this.lobbyManager.createRoom(socket.id, data.name, data.config as any);
        socket.join(`lobby:${room.id}`);
        socket.emit('lobby:created', room);
      });

      socket.on('lobby:join', (data: { roomId: string; name: string }) => {
        const room = this.lobbyManager.joinRoom(data.roomId, socket.id, data.name);
        if (room) {
          socket.join(`lobby:${room.id}`);
          this.io.to(`lobby:${room.id}`).emit('lobby:updated', room);
        } else {
          socket.emit('lobby:error', { message: 'Could not join room' });
        }
      });

      socket.on('lobby:leave', (data: { roomId: string }) => {
        const room = this.lobbyManager.leaveRoom(data.roomId, socket.id);
        socket.leave(`lobby:${data.roomId}`);
        if (room) {
          this.io.to(`lobby:${room.id}`).emit('lobby:updated', room);
        } else {
          this.io.to(`lobby:${data.roomId}`).emit('lobby:closed');
        }
      });

      socket.on('lobby:ready', (data: { roomId: string; ready: boolean }) => {
        const room = this.lobbyManager.setReady(data.roomId, socket.id, data.ready);
        if (room) {
          this.io.to(`lobby:${room.id}`).emit('lobby:updated', room);
        }
      });

      socket.on('lobby:start', (data: { roomId: string }) => {
        const room = this.lobbyManager.getRoom(data.roomId);
        if (!room || room.hostId !== socket.id) {
          socket.emit('lobby:error', { message: 'Only the host can start' });
          return;
        }

        const onEvent = (events: GameEvent[], sessionId: string) => {
          this.io.to(`game:${sessionId}`).emit('game:events', { sessionId, events });
        };

        const sessionId = this.lobbyManager.startGame(data.roomId, onEvent);
        if (sessionId) {
          // Move all players from lobby room to game room
          const session = this.sessionManager.getSession(sessionId);
          if (session) {
            for (const player of session.getPlayers()) {
              if (player.socketId) {
                const playerSocket = this.io.sockets.sockets.get(player.socketId);
                if (playerSocket) {
                  playerSocket.join(`game:${sessionId}`);
                  playerSocket.leave(`lobby:${data.roomId}`);
                }
              }
            }
          }

          this.io.to(`game:${sessionId}`).emit('game:started', {
            sessionId,
            state: session?.getState(),
          });
        } else {
          socket.emit('lobby:error', { message: 'Cannot start game' });
        }
      });

      socket.on('lobby:list', () => {
        socket.emit('lobby:rooms', this.lobbyManager.listRooms());
      });

      // ── Game Events ──

      socket.on('game:command', (data: { sessionId: string; command: Command }) => {
        const session = this.sessionManager.getSession(data.sessionId);
        if (!session) {
          socket.emit('game:error', { message: 'Session not found' });
          return;
        }

        const player = session.getPlayerBySocketId(socket.id);
        if (!player) {
          socket.emit('game:error', { message: 'Not a player in this session' });
          return;
        }

        const result = session.receiveCommand(player.id, data.command);
        if (!result.success) {
          socket.emit('game:error', { message: result.error });
        }
        // Events are broadcast via the onEvent callback
      });

      socket.on('game:getState', (data: { sessionId: string }) => {
        const session = this.sessionManager.getSession(data.sessionId);
        if (session) {
          socket.emit('game:state', { sessionId: data.sessionId, state: session.getState() });
        }
      });

      // ── Disconnect ──

      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);

        // Clean up lobby
        const room = this.lobbyManager.getRoomBySocketId(socket.id);
        if (room) {
          const updated = this.lobbyManager.leaveRoom(room.id, socket.id);
          if (updated) {
            this.io.to(`lobby:${room.id}`).emit('lobby:updated', updated);
          } else {
            this.io.to(`lobby:${room.id}`).emit('lobby:closed');
          }
        }
      });
    });
  }
}
