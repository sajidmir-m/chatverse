import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_URL } from '../constants/config';
import { supabase } from './supabase';
import {
  ApiErrorResponse,
  ApiResponse,
  ConversationSummary,
  FriendRequest,
  Message,
  MessageType,
  OnlineUser,
  SearchUserResult,
  UserProfile,
} from '../types';

const getClientBaseUrl = (): string => {
  // Production: always use same-origin /api routes (works on Vercel single deploy)
  if (import.meta.env.PROD) {
    return '';
  }

  const configured = API_URL.trim();
  return configured || 'http://localhost:3000';
};

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: getClientBaseUrl(),
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      const message =
        error.response?.data?.message || error.message || 'An unexpected error occurred';
      return Promise.reject(new Error(message));
    }
  );

  return client;
};

const apiClient = createApiClient();

export interface CreateProfileData {
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
}

export interface UpdateProfileData {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
}

export const apiService = {
  async getMe(): Promise<{ email: string | null; profile: UserProfile | null }> {
    const response = await apiClient.get<
      ApiResponse<{ email: string | null; profile: UserProfile | null }>
    >('/api/auth/me');
    return response.data.data;
  },

  async createProfile(data: CreateProfileData): Promise<UserProfile> {
    const response = await apiClient.post<ApiResponse<UserProfile>>('/api/auth/profile', data);
    return response.data.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await apiClient.put<ApiResponse<UserProfile>>('/api/auth/profile', data);
    return response.data.data;
  },

  async checkUsernameAvailable(username: string): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<{ available: boolean }>>(
      `/api/auth/username/${encodeURIComponent(username)}/available`
    );
    return response.data.data.available;
  },

  async getConversationMessages(recipient: string): Promise<Message[]> {
    const response = await apiClient.get<ApiResponse<Message[]>>(
      `/api/messages/${encodeURIComponent(recipient)}`
    );
    return response.data.data;
  },

  async searchUsers(query: string): Promise<SearchUserResult[]> {
    const response = await apiClient.get<ApiResponse<SearchUserResult[]>>('/api/friends/search', {
      params: { q: query },
    });
    return response.data.data;
  },

  async getConversations(): Promise<ConversationSummary[]> {
    const response = await apiClient.get<ApiResponse<ConversationSummary[]>>('/api/friends/conversations');
    return response.data.data;
  },

  async getFriends(): Promise<OnlineUser[]> {
    const response = await apiClient.get<ApiResponse<OnlineUser[]>>('/api/friends');
    return response.data.data;
  },

  async getIncomingFriendRequests(): Promise<FriendRequest[]> {
    const response = await apiClient.get<ApiResponse<FriendRequest[]>>('/api/friends/requests/incoming');
    return response.data.data;
  },

  async sendFriendRequest(toUsername: string): Promise<FriendRequest> {
    const response = await apiClient.post<ApiResponse<FriendRequest>>('/api/friends/request', {
      toUsername,
    });
    return response.data.data;
  },

  async acceptFriendRequest(requestId: string): Promise<FriendRequest> {
    const response = await apiClient.post<ApiResponse<FriendRequest>>(
      `/api/friends/requests/${requestId}/accept`
    );
    return response.data.data;
  },

  async rejectFriendRequest(requestId: string): Promise<void> {
    await apiClient.post(`/api/friends/requests/${requestId}/reject`);
  },

  async getUser(username: string): Promise<OnlineUser> {
    const response = await apiClient.get<ApiResponse<OnlineUser>>(
      `/api/users/${encodeURIComponent(username)}`
    );
    return response.data.data;
  },

  async getOnlineUsers(): Promise<OnlineUser[]> {
    const response = await apiClient.get<ApiResponse<OnlineUser[]>>('/api/users');
    return response.data.data;
  },
};

export type { MessageType };
