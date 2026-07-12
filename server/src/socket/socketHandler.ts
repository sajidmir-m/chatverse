import { Server as SocketServer, Socket } from 'socket.io';
import { verifySocketToken } from '../middleware/auth';
import { friendService } from '../services/friendService';
import { messageService } from '../services/messageService';
import { userService } from '../services/userService';
import { JoinPayload, MessageType, SendMessagePayload, TypingPayload } from '../types';

const userRoom = (username: string): string => `user:${username}`;

const broadcastOnlineUsers = async (io: SocketServer): Promise<void> => {
  const users = await userService.getOnlineUsers();
  io.emit('online-users', users);
};

const emitMessageAndNotification = async (
  io: SocketServer,
  savedMessage: Awaited<ReturnType<typeof messageService.createMessage>>
): Promise<void> => {
  io.to(userRoom(savedMessage.username)).emit('receive-message', savedMessage);
  io.to(userRoom(savedMessage.recipient_username)).emit('receive-message', savedMessage);

  const sender = await userService.getUserByUsername(savedMessage.username);

  io.to(userRoom(savedMessage.recipient_username)).emit('notification', {
    id: savedMessage.id,
    from: savedMessage.username,
    fromDisplayName: sender?.display_name || savedMessage.username,
    message: savedMessage.message,
    messageType: savedMessage.message_type,
    createdAt: savedMessage.created_at,
  });
};

export const initializeSocketHandlers = (io: SocketServer): void => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const username = await verifySocketToken(token);
      socket.data.username = username;
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('join', async (payload: JoinPayload) => {
      try {
        const username = payload?.username?.trim();
        const authenticatedUsername = socket.data.username as string;

        if (!username || username !== authenticatedUsername) {
          socket.emit('error', { message: 'Invalid username' });
          return;
        }

        await userService.upsertUserOnJoin(username, socket.id);
        socket.join(userRoom(username));

        socket.broadcast.emit('user-joined', { username });
        await broadcastOnlineUsers(io);

        console.log(`[Socket] ${username} joined (${socket.id})`);
      } catch (error) {
        console.error('[Socket] Join error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    socket.on('send-message', async (payload: SendMessagePayload) => {
      try {
        const username = (socket.data.username as string) || payload?.username?.trim();
        const recipient = payload?.recipient?.trim();
        const message = (payload?.message || '').trim();
        const messageType = (payload?.messageType || 'text') as MessageType;
        const mediaUrl = payload?.mediaUrl ?? null;

        if (!username || !recipient) {
          socket.emit('error', { message: 'Username and recipient are required' });
          return;
        }

        if (!message && !mediaUrl) {
          socket.emit('error', { message: 'Message or media is required' });
          return;
        }

        if (username !== socket.data.username) {
          socket.emit('error', { message: 'Unauthorized sender' });
          return;
        }

        if (message.length > 1000) {
          socket.emit('error', { message: 'Message too long' });
          return;
        }

        const recipientUser = await userService.getUserByUsername(recipient);

        if (!recipientUser) {
          socket.emit('error', { message: 'Recipient not found' });
          return;
        }

        const isFriend = await friendService.areFriends(username, recipient);
        if (!isFriend) {
          socket.emit('error', { message: 'You can only message friends' });
          return;
        }

        const savedMessage = await messageService.createMessage({
          username,
          recipient,
          message,
          messageType,
          mediaUrl,
        });

        await emitMessageAndNotification(io, savedMessage);
      } catch (error) {
        console.error('[Socket] Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (payload: TypingPayload) => {
      const username = (socket.data.username as string) || payload?.username?.trim();
      const recipient = payload?.recipient?.trim();

      if (!username || !recipient) {
        return;
      }

      io.to(userRoom(recipient)).emit('typing', {
        username,
        recipient,
        isTyping: Boolean(payload?.isTyping),
      });
    });

    const relayToUser = (event: string, payload: { to: string; from: string }): void => {
      if (!payload?.to || !payload?.from) return;
      if (payload.from !== socket.data.username) return;
      io.to(userRoom(payload.to)).emit(event, payload);
    };

    socket.on('call-offer', (payload) => relayToUser('call-offer', payload));
    socket.on('call-answer', (payload) => relayToUser('call-answer', payload));
    socket.on('call-ice-candidate', (payload) => relayToUser('call-ice-candidate', payload));
    socket.on('call-reject', (payload) => relayToUser('call-reject', payload));
    socket.on('call-end', (payload) => relayToUser('call-end', payload));
    socket.on('call-busy', (payload) => relayToUser('call-busy', payload));

    socket.on('disconnect', async () => {
      try {
        const user = await userService.setUserOffline(socket.id);

        if (user) {
          socket.broadcast.emit('user-left', { username: user.username });
          console.log(`[Socket] ${user.username} disconnected (${socket.id})`);
        } else {
          console.log(`[Socket] Client disconnected: ${socket.id}`);
        }

        await broadcastOnlineUsers(io);
      } catch (error) {
        console.error('[Socket] Disconnect error:', error);
      }
    });
  });
};
