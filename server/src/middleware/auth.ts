import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { getSupabaseConfig } from '../config/supabase';
import { AppError } from './errorHandler';
import { userService } from '../services/userService';

let authClient: SupabaseClient | null = null;

const getAuthClient = (): SupabaseClient => {
  if (!authClient) {
    const { url, anonKey } = getSupabaseConfig();
    authClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return authClient;
};

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.slice(7);
    const {
      data: { user },
      error,
    } = await getAuthClient().auth.getUser(token);

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    req.authUser = {
      id: user.id,
      email: user.email,
    };

    const profile = await userService.getUserByAuthId(user.id);
    req.profile = profile ?? undefined;

    next();
  } catch (error) {
    next(error);
  }
};

export const requireProfile = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.profile?.username) {
    next(new AppError('Username setup required', 403));
    return;
  }

  next();
};

export const verifySocketToken = async (token: string): Promise<string> => {
  const {
    data: { user },
    error,
  } = await getAuthClient().auth.getUser(token);

  if (error || !user) {
    throw new AppError('Invalid socket token', 401);
  }

  const profile = await userService.getUserByAuthId(user.id);

  if (!profile?.username) {
    throw new AppError('Username setup required', 403);
  }

  return profile.username;
};
