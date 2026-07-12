export type MessageType = 'text' | 'image' | 'video';

export interface Message {
  id: string;
  username: string;
  recipient_username: string;
  message: string;
  message_type: MessageType;
  media_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_id: string | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  socket_id: string | null;
  online: boolean;
  last_seen: string;
  created_at: string;
}

export interface CreateMessageInput {
  username: string;
  recipient: string;
  message: string;
  messageType?: MessageType;
  mediaUrl?: string | null;
}

export interface CreateProfileInput {
  authId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
}

export interface TypingPayload {
  username: string;
  recipient: string;
  isTyping: boolean;
}

export interface JoinPayload {
  username: string;
}

export interface SendMessagePayload {
  username: string;
  recipient: string;
  message: string;
  messageType?: MessageType;
  mediaUrl?: string | null;
}

export interface NotificationPayload {
  id: string;
  from: string;
  fromDisplayName: string;
  message: string;
  messageType: MessageType;
  createdAt: string;
}

export type CallType = 'voice' | 'video';

export interface CallSignalPayload {
  callId: string;
  from: string;
  to: string;
  callType: CallType;
}

export interface SdpDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

export interface IceCandidateDescription {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface CallOfferPayload extends CallSignalPayload {
  sdp: SdpDescription;
}

export interface CallAnswerPayload extends CallSignalPayload {
  sdp: SdpDescription;
}

export interface CallIcePayload extends CallSignalPayload {
  candidate: IceCandidateDescription;
}

export interface ApiError extends Error {
  statusCode?: number;
  errors?: Array<{ field: string; message: string }>;
}

export interface OnlineUserSummary {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  online: boolean;
  last_seen: string;
}

export interface AuthUser {
  id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      profile?: User;
    }
  }
}
