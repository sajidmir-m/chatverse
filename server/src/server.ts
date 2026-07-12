import http from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';
import app from './app';
import { setFriendSocketServer } from './controllers/friendController';
import { setSocketServer } from './controllers/messageController';
import { initializeSocketHandlers } from './socket/socketHandler';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

setSocketServer(io);
setFriendSocketServer(io);
initializeSocketHandlers(io);

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  });
}

const gracefulShutdown = (signal: string): void => {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { io };
export default server;
