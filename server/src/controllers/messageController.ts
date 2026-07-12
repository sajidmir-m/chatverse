import { Request, Response, NextFunction } from 'express';
import { Server as SocketServer } from 'socket.io';
import { friendService } from '../services/friendService';
import { messageService } from '../services/messageService';
import { userService } from '../services/userService';
import { AppError } from '../middleware/errorHandler';

let io: SocketServer | null = null;

export const setSocketServer = (socketServer: SocketServer): void => {
  io = socketServer;
};

export const messageController = {
  async getConversationMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const recipient = String(req.params.recipient || '').trim();
      const username = req.profile?.username;

      if (!username) {
        throw new AppError('Profile required', 403);
      }

      if (!recipient) {
        throw new AppError('Recipient is required', 400);
      }

      const recipientUser = await userService.getUserByUsername(recipient);

      if (!recipientUser) {
        throw new AppError('User not found', 404);
      }

      const isFriend = await friendService.areFriends(username, recipient);
      if (!isFriend) {
        throw new AppError('You can only view messages with friends', 403);
      }

      const messages = await messageService.getConversationMessages(username, recipient);

      res.status(200).json({
        success: true,
        data: messages,
        count: messages.length,
      });
    } catch (error) {
      next(error);
    }
  },

  async createMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = req.profile?.username;
      const { recipient, message, messageType, mediaUrl } = req.body as {
        recipient: string;
        message: string;
        messageType?: 'text' | 'image' | 'video';
        mediaUrl?: string | null;
      };

      if (!username) {
        throw new AppError('Profile required', 403);
      }

      const isFriend = await friendService.areFriends(username, recipient.trim());
      if (!isFriend) {
        throw new AppError('You can only message friends', 403);
      }

      const savedMessage = await messageService.createMessage({
        username,
        recipient: recipient.trim(),
        message: (message || '').trim(),
        messageType: messageType || 'text',
        mediaUrl: mediaUrl ?? null,
      });

      if (io) {
        io.to(`user:${savedMessage.username}`).emit('receive-message', savedMessage);
        io.to(`user:${savedMessage.recipient_username}`).emit('receive-message', savedMessage);

        const sender = await userService.getUserByUsername(username);
        io.to(`user:${savedMessage.recipient_username}`).emit('notification', {
          id: savedMessage.id,
          from: username,
          fromDisplayName: sender?.display_name || username,
          message: savedMessage.message,
          messageType: savedMessage.message_type,
          createdAt: savedMessage.created_at,
        });
      }

      res.status(201).json({
        success: true,
        data: savedMessage,
      });
    } catch (error) {
      next(error);
    }
  },
};

export const userController = {
  async getOnlineUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getOnlineUsers();

      res.status(200).json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      next(error);
    }
  },

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = String(req.query.q || '').trim();
      const username = req.profile?.username;

      if (!query || query.length < 1) {
        res.status(200).json({ success: true, data: [], count: 0 });
        return;
      }

      const users = await userService.searchUsers(query, username);

      res.status(200).json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = String(req.params.username || '').trim();
      const user = await userService.getUserByUsername(username);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          online: user.online,
          last_seen: user.last_seen,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

export const authController = {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: {
          authId: req.authUser?.id,
          email: req.authUser?.email,
          profile: req.profile
            ? {
                username: req.profile.username,
                display_name: req.profile.display_name,
                avatar_url: req.profile.avatar_url,
                bio: req.profile.bio,
                phone: req.profile.phone,
                online: req.profile.online,
                last_seen: req.profile.last_seen,
              }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, displayName, avatarUrl, bio, phone } = req.body as {
        username: string;
        displayName?: string;
        avatarUrl?: string | null;
        bio?: string | null;
        phone?: string | null;
      };
      const authId = req.authUser?.id;
      const email = req.authUser?.email;

      if (!authId) {
        throw new AppError('Authentication required', 401);
      }

      const profile = await userService.createProfile({
        authId,
        username: username.trim(),
        displayName: displayName?.trim(),
        avatarUrl: avatarUrl ?? null,
        bio: bio?.trim() ?? null,
        phone: phone?.trim() ?? null,
        email,
      });

      res.status(201).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = req.profile?.username;

      if (!username) {
        throw new AppError('Profile required', 403);
      }

      const { displayName, avatarUrl, bio, phone } = req.body as {
        displayName?: string;
        avatarUrl?: string | null;
        bio?: string | null;
        phone?: string | null;
      };

      const profile = await userService.updateProfile(username, {
        displayName: displayName?.trim(),
        avatarUrl: avatarUrl ?? undefined,
        bio: bio?.trim(),
        phone: phone?.trim(),
      });

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  async checkUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = String(req.params.username || '').trim();
      const existing = await userService.getUserByUsername(username);

      res.status(200).json({
        success: true,
        data: {
          username,
          available: !existing,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
