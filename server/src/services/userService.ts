import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import {
  CreateProfileInput,
  OnlineUserSummary,
  UpdateProfileInput,
  User,
} from '../types';

const profileFields = 'username, display_name, avatar_url, online, last_seen';

export const userService = {
  async getOnlineUsers(): Promise<OnlineUserSummary[]> {
    const { data, error } = await supabase
      .from('users')
      .select(profileFields)
      .eq('online', true)
      .order('username', { ascending: true });

    if (error) {
      throw new AppError(`Failed to fetch online users: ${error.message}`, 500);
    }

    return (data ?? []) as OnlineUserSummary[];
  },

  async searchUsers(query: string, excludeUsername?: string): Promise<OnlineUserSummary[]> {
    let builder = supabase
      .from('users')
      .select(profileFields)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .order('username', { ascending: true })
      .limit(20);

    if (excludeUsername) {
      builder = builder.neq('username', excludeUsername);
    }

    const { data, error } = await builder;

    if (error) {
      throw new AppError(`Failed to search users: ${error.message}`, 500);
    }

    return (data ?? []) as OnlineUserSummary[];
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to fetch user: ${error.message}`, 500);
    }

    return (data as User | null) ?? null;
  },

  async getUserByAuthId(authId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to fetch user profile: ${error.message}`, 500);
    }

    return (data as User | null) ?? null;
  },

  async createProfile(input: CreateProfileInput): Promise<User> {
    const existing = await this.getUserByUsername(input.username);

    if (existing) {
      throw new AppError('Username is already taken', 409);
    }

    const existingAuthProfile = await this.getUserByAuthId(input.authId);

    if (existingAuthProfile) {
      throw new AppError('Profile already exists for this account', 409);
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .insert({
        auth_id: input.authId,
        username: input.username,
        display_name: input.displayName || input.username,
        avatar_url: input.avatarUrl ?? null,
        bio: input.bio ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        online: false,
        last_seen: now,
        created_at: now,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Username is already taken', 409);
      }

      throw new AppError(`Failed to create profile: ${error.message}`, 500);
    }

    return data as User;
  },

  async updateProfile(username: string, input: UpdateProfileInput): Promise<User> {
    const updates: Record<string, string | null> = {};

    if (input.displayName !== undefined) updates.display_name = input.displayName;
    if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl;
    if (input.bio !== undefined) updates.bio = input.bio;
    if (input.phone !== undefined) updates.phone = input.phone;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('username', username)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Failed to update profile: ${error.message}`, 500);
    }

    return data as User;
  },

  async upsertUserOnJoin(username: string, socketId: string): Promise<User> {
    const now = new Date().toISOString();

    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (fetchError) {
      throw new AppError(`Failed to lookup user: ${fetchError.message}`, 500);
    }

    if (!existingUser) {
      throw new AppError('User profile not found', 404);
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        socket_id: socketId,
        online: true,
        last_seen: now,
      })
      .eq('id', existingUser.id)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Failed to update user: ${error.message}`, 500);
    }

    return data as User;
  },

  async setUserOffline(socketId: string): Promise<User | null> {
    const now = new Date().toISOString();

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('socket_id', socketId)
      .maybeSingle();

    if (fetchError) {
      throw new AppError(`Failed to lookup user by socket: ${fetchError.message}`, 500);
    }

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        socket_id: null,
        online: false,
        last_seen: now,
      })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Failed to set user offline: ${error.message}`, 500);
    }

    return data as User;
  },
};
