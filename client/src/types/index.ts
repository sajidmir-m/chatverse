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

export interface OnlineUser {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  online: boolean;
  last_seen: string;
}

export interface TypingEvent {
  username: string;
  recipient: string;
  isTyping: boolean;
}

export interface UserProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone?: string | null;
  online: boolean;
  last_seen: string;
}

export type FriendStatus = 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'self';

export interface ConversationSummary {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  online: boolean;
  last_seen: string;
  last_message: string | null;
  last_message_type: MessageType | null;
  last_message_at: string | null;
  last_message_from: string | null;
  unread_count: number;
}

export interface FriendRequest {
  id: string;
  from_username: string;
  to_username: string;
  status: string;
  created_at: string;
  from_display_name: string | null;
  from_avatar_url: string | null;
}

export interface SearchUserResult extends OnlineUser {
  friend_status: FriendStatus;
  request_id: string | null;
}

export interface FriendRequestNotification {
  id: string;
  from: string;
  fromDisplayName: string;
  fromAvatarUrl: string | null;
  createdAt: string;
}

export interface ChatNotification {
  id: string;
  from: string;
  fromDisplayName: string;
  message: string;
  messageType: MessageType;
  createdAt: string;
  type?: 'message' | 'friend_request' | 'friend_accepted';
}

export interface AuthState {
  email: string | null;
  username: string | null;
  profile: UserProfile | null;
  hasProfile: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
}

export interface SetupProfileFormData {
  username: string;
  displayName: string;
  bio: string;
  phone: string;
}

export interface SendMessagePayload {
  text: string;
  messageType?: MessageType;
  mediaUrl?: string | null;
}

export type CallType = 'voice' | 'video';

export interface CallSignalPayload {
  callId: string;
  from: string;
  to: string;
  callType: CallType;
}

export interface CallOfferPayload extends CallSignalPayload {
  sdp: RTCSessionDescriptionInit;
}

export interface CallAnswerPayload extends CallSignalPayload {
  sdp: RTCSessionDescriptionInit;
}

export interface CallIcePayload extends CallSignalPayload {
  candidate: RTCIceCandidateInit;
}

export type CallStatus =
  | 'idle'
  | 'calling'
  | 'incoming'
  | 'connected'
  | 'ended';
