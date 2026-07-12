const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

/** Domain only — never include `/api` (paths in api.ts already start with /api). */
const normalizeApiOrigin = (url: string): string => {
  let normalized = trimTrailingSlash(url);
  if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4);
  }
  return normalized;
};

const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL?.trim();

  // Local dev always uses the local backend (ignore production URLs in .env)
  if (import.meta.env.DEV) {
    if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return normalizeApiOrigin(envUrl);
    }
    return 'http://localhost:3000';
  }

  if (envUrl) return normalizeApiOrigin(envUrl);

  return typeof window !== 'undefined' ? window.location.origin : '';
};

export const API_URL = resolveBaseUrl();
export const SOCKET_URL = normalizeApiOrigin(
  import.meta.env.VITE_SOCKET_URL?.trim() || resolveBaseUrl()
);

export const STORAGE_KEYS = {
  USERNAME: '@chat_username',
} as const;

export const SOCKET_EVENTS = {
  JOIN: 'join',
  SEND_MESSAGE: 'send-message',
  TYPING: 'typing',
  DISCONNECT: 'disconnect',
  RECEIVE_MESSAGE: 'receive-message',
  NOTIFICATION: 'notification',
  FRIEND_REQUEST: 'friend-request',
  FRIEND_REQUEST_ACCEPTED: 'friend-request-accepted',
  ONLINE_USERS: 'online-users',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  ERROR: 'error',
} as const;

export const TYPING_DEBOUNCE_MS = 1500;
export const MESSAGE_MAX_LENGTH = 1000;
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 30;
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_VIDEO_SIZE_MB = 50;
export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif,image/webp';
export const ACCEPTED_VIDEO_TYPES = 'video/mp4,video/webm,video/quicktime';
