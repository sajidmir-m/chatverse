import { Request, Response, NextFunction } from 'express';
import { Server as SocketServer } from 'socket.io';
import { AppError } from '../middleware/errorHandler';
import { friendService } from '../services/friendService';
import { userService } from '../services/userService';

let io: SocketServer | null = null;

export const setFriendSocketServer = (socketServer: SocketServer): void => {
  io = socketServer;
};

const userRoom = (username: string): string => `user:${username}`;

export const friendController = {
  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = req.profile?.username;
      if (!username) throw new AppError('Profile required', 403);

      const conversations = await friendService.getConversations(username);
      res.status(200).json({ success: true, data: conversations, count: conversations.length });
    } catch (error) {
      next(error);
    }
  },

  async getFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = req.profile?.username;
      if (!username) throw new AppError('Profile required', 403);

      const friends = await friendService.getFriends(username);
      res.status(200).json({ success: true, data: friends, count: friends.length });
    } catch (error) {
      next(error);
    }
  },

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = req.profile?.username;
      if (!username) throw new AppError('Profile required', 403);

      const query = String(req.query.q || '').trim();
      if (!query) {
        res.status(200).json({ success: true, data: [], count: 0 });
        return;
      }

      const users = await friendService.searchUsers(query, username);
      res.status(200).json({ success: true, data: users, count: users.length });
    } catch (error) {
      next(error);
    }
  },

  async getIncomingRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = req.profile?.username;
      if (!username) throw new AppError('Profile required', 403);

      const requests = await friendService.getIncomingRequests(username);
      res.status(200).json({ success: true, data: requests, count: requests.length });
    } catch (error) {
      next(error);
    }
  },

  async sendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = req.profile?.username;
      if (!username) throw new AppError('Profile required', 403);

      const { toUsername } = req.body as { toUsername: string };
      const request = await friendService.sendFriendRequest(username, toUsername.trim());

      if (io && request.status === 'pending') {
        const sender = await userService.getUserByUsername(username);
        io.to(userRoom(request.to_username)).emit('friend-request', {
          id: request.id,
          from: username,
          fromDisplayName: sender?.display_name || username,
          fromAvatarUrl: sender?.avatar_url || null,
          createdAt: request.created_at,
        });
      }

      if (io && request.status === 'accepted') {
        const accepter = await userService.getUserByUsername(username);
        io.to(userRoom(request.from_username)).emit('friend-request-accepted', {
          id: request.id,
          from: username,
          fromDisplayName: accepter?.display_name || username,
        });
        io.to(userRoom(request.to_username)).emit('friend-request-accepted', {
          id: request.id,
          from: request.from_username,
          fromDisplayName: accepter?.display_name || username,
        });
      }

      res.status(201).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  async acceptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = req.profile?.username;
      if (!username) throw new AppError('Profile required', 403);

      const requestId = String(req.params.id || '');
      const request = await friendService.acceptFriendRequest(requestId, username);

      if (io) {
        const accepter = await userService.getUserByUsername(username);
        io.to(userRoom(request.from_username)).emit('friend-request-accepted', {
          id: request.id,
          from: username,
          fromDisplayName: accepter?.display_name || username,
        });
        io.to(userRoom(request.to_username)).emit('friend-request-accepted', {
          id: request.id,
          from: request.from_username,
          fromDisplayName: accepter?.display_name || username,
        });
      }

      res.status(200).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  async rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = req.profile?.username;
      if (!username) throw new AppError('Profile required', 403);

      const requestId = String(req.params.id || '');
      await friendService.rejectFriendRequest(requestId, username);
      res.status(200).json({ success: true, message: 'Request rejected' });
    } catch (error) {
      next(error);
    }
  },
};
