import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { GameSessionManager } from './game/GameSessionManager.js';
import { LobbyManager } from './lobby/LobbyManager.js';
import { SocketHandler } from './net/SocketHandler.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Core managers
const sessionManager = new GameSessionManager();
const lobbyManager = new LobbyManager(sessionManager);

// Socket handling
const socketHandler = new SocketHandler(io, sessionManager, lobbyManager);
socketHandler.init();

httpServer.listen(PORT, () => {
  console.log(`🎮 Game server listening on port ${PORT}`);
});

export { app, httpServer, io };
