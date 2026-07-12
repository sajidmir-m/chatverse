import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { Message, OnlineUserSummary } from '../types';

export type FriendStatus = 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'self';

export interface FriendRequest {
  id: string;
  from_username: string;
  to_username: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface FriendRequestWithProfile extends FriendRequest {
  from_display_name: string | null;
  from_avatar_url: string | null;
  to_display_name: string | null;
  to_avatar_url: string | null;
}

export interface ConversationSummary {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  online: boolean;
  last_seen: string;
  last_message: string | null;
  last_message_type: string | null;
  last_message_at: string | null;
  last_message_from: string | null;
  unread_count: number;
}

export interface SearchUserResult extends OnlineUserSummary {
  friend_status: FriendStatus;
  request_id: string | null;
}

const profileFields = 'username, display_name, avatar_url, online, last_seen';

const getFriendStatus = async (
  myUsername: string,
  otherUsername: string
): Promise<{ status: FriendStatus; requestId: string | null }> => {
  if (myUsername === otherUsername) {
    return { status: 'self', requestId: null };
  }

  const { data: asSender } = await supabase
    .from('friend_requests')
    .select('id, status')
    .eq('from_username', myUsername)
    .eq('to_username', otherUsername)
    .maybeSingle();

  if (asSender) {
    if (asSender.status === 'accepted') return { status: 'friends', requestId: asSender.id };
    if (asSender.status === 'pending') return { status: 'pending_sent', requestId: asSender.id };
  }

  const { data: asReceiver } = await supabase
    .from('friend_requests')
    .select('id, status')
    .eq('from_username', otherUsername)
    .eq('to_username', myUsername)
    .maybeSingle();

  if (asReceiver) {
    if (asReceiver.status === 'accepted') return { status: 'friends', requestId: asReceiver.id };
    if (asReceiver.status === 'pending') return { status: 'pending_received', requestId: asReceiver.id };
  }

  return { status: 'none', requestId: null };
};

const areFriends = async (userA: string, userB: string): Promise<boolean> => {
  const { status } = await getFriendStatus(userA, userB);
  return status === 'friends';
};

export const friendService = {
  areFriends,

  async searchUsers(query: string, myUsername: string): Promise<SearchUserResult[]> {
    const { data, error } = await supabase
      .from('users')
      .select(profileFields)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('username', myUsername)
      .order('username', { ascending: true })
      .limit(20);

    if (error) {
      throw new AppError(`Failed to search users: ${error.message}`, 500);
    }

    const users = (data ?? []) as OnlineUserSummary[];
    const results: SearchUserResult[] = [];

    for (const user of users) {
      const { status, requestId } = await getFriendStatus(myUsername, user.username);
      results.push({ ...user, friend_status: status, request_id: requestId });
    }

    return results;
  },

  async sendFriendRequest(fromUsername: string, toUsername: string): Promise<FriendRequest> {
    if (fromUsername === toUsername) {
      throw new AppError('Cannot add yourself', 400);
    }

    const target = await supabase
      .from('users')
      .select('username')
      .eq('username', toUsername)
      .maybeSingle();

    if (!target.data) {
      throw new AppError('User not found', 404);
    }

    const existing = await getFriendStatus(fromUsername, toUsername);

    if (existing.status === 'friends') {
      throw new AppError('Already friends', 409);
    }

    if (existing.status === 'pending_sent') {
      throw new AppError('Friend request already sent', 409);
    }

    if (existing.status === 'pending_received' && existing.requestId) {
      return this.acceptFriendRequest(existing.requestId, fromUsername);
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        from_username: fromUsername,
        to_username: toUsername,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Friend request already exists', 409);
      }
      throw new AppError(`Failed to send friend request: ${error.message}`, 500);
    }

    return data as FriendRequest;
  },

  async getIncomingRequests(username: string): Promise<FriendRequestWithProfile[]> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('to_username', username)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Failed to fetch requests: ${error.message}`, 500);
    }

    const requests = (data ?? []) as FriendRequest[];
    const enriched: FriendRequestWithProfile[] = [];

    for (const req of requests) {
      const { data: fromUser } = await supabase
        .from('users')
        .select('display_name, avatar_url')
        .eq('username', req.from_username)
        .maybeSingle();

      enriched.push({
        ...req,
        from_display_name: fromUser?.display_name ?? null,
        from_avatar_url: fromUser?.avatar_url ?? null,
        to_display_name: null,
        to_avatar_url: null,
      });
    }

    return enriched;
  },

  async acceptFriendRequest(requestId: string, username: string): Promise<FriendRequest> {
    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchError || !request) {
      throw new AppError('Friend request not found', 404);
    }

    if (request.to_username !== username && request.from_username !== username) {
      throw new AppError('Not authorized', 403);
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Failed to accept request: ${error.message}`, 500);
    }

    return data as FriendRequest;
  },

  async rejectFriendRequest(requestId: string, username: string): Promise<void> {
    const { data: request } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (!request || request.to_username !== username) {
      throw new AppError('Friend request not found', 404);
    }

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      throw new AppError(`Failed to reject request: ${error.message}`, 500);
    }
  },

  async getFriends(username: string): Promise<OnlineUserSummary[]> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('from_username, to_username')
      .eq('status', 'accepted')
      .or(`from_username.eq.${username},to_username.eq.${username}`);

    if (error) {
      throw new AppError(`Failed to fetch friends: ${error.message}`, 500);
    }

    const friendUsernames = (data ?? []).map((row) =>
      row.from_username === username ? row.to_username : row.from_username
    );

    if (friendUsernames.length === 0) return [];

    const { data: friends, error: friendsError } = await supabase
      .from('users')
      .select(profileFields)
      .in('username', friendUsernames)
      .order('username', { ascending: true });

    if (friendsError) {
      throw new AppError(`Failed to fetch friend profiles: ${friendsError.message}`, 500);
    }

    return (friends ?? []) as OnlineUserSummary[];
  },

  async getConversations(username: string): Promise<ConversationSummary[]> {
    const friends = await this.getFriends(username);

    const conversations: ConversationSummary[] = [];

    for (const friend of friends) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(username.eq.${username},recipient_username.eq.${friend.username}),and(username.eq.${friend.username},recipient_username.eq.${username})`
        )
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMsg = (messages?.[0] as Message | undefined) ?? null;

      conversations.push({
        username: friend.username,
        display_name: friend.display_name,
        avatar_url: friend.avatar_url,
        online: friend.online,
        last_seen: friend.last_seen,
        last_message: lastMsg?.message ?? null,
        last_message_type: lastMsg?.message_type ?? null,
        last_message_at: lastMsg?.created_at ?? null,
        last_message_from: lastMsg?.username ?? null,
        unread_count: 0,
      });
    }

    conversations.sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });

    return conversations;
  },
};
