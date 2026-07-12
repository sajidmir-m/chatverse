import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS, SOCKET_URL } from '../constants/config';
import {
  CallAnswerPayload,
  CallIcePayload,
  CallOfferPayload,
  CallSignalPayload,
  FriendRequestNotification,
  ChatNotification,
  Message,
  MessageType,
  OnlineUser,
  TypingEvent,
} from '../types';

type EventCallback<T> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private username: string | null = null;
  private token: string | null = null;
  private listeners = new Map<string, Set<EventCallback<unknown>>>();

  private addListener<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const callbacks = this.listeners.get(event)!;
    callbacks.add(callback as EventCallback<unknown>);
    this.socket?.on(event, callback);
    return () => {
      callbacks.delete(callback as EventCallback<unknown>);
      this.socket?.off(event, callback);
    };
  }

  private attachStoredListeners(): void {
    if (!this.socket) return;
    for (const [event, callbacks] of this.listeners) {
      for (const callback of callbacks) {
        this.socket.on(event, callback);
      }
    }
  }

  connect(username: string, token: string): Socket {
    if (this.socket?.connected && this.username === username && this.token === token) {
      return this.socket;
    }
    this.disconnect(false);
    this.username = username;
    this.token = token;

    this.socket = io(SOCKET_URL || undefined, {
      transports: import.meta.env.PROD ? ['websocket'] : ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      auth: { token },
    });

    this.attachStoredListeners();
    this.socket.on('connect', () => {
      this.socket?.emit(SOCKET_EVENTS.JOIN, { username });
    });
    this.socket.io.on('reconnect', () => {
      if (this.username) {
        this.socket?.emit(SOCKET_EVENTS.JOIN, { username: this.username });
      }
    });
    return this.socket;
  }

  disconnect(clearListeners = true): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.username = null;
    this.token = null;
    if (clearListeners) this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  sendMessage(
    username: string,
    recipient: string,
    message: string,
    messageType: MessageType = 'text',
    mediaUrl: string | null = null
  ): void {
    this.socket?.emit(SOCKET_EVENTS.SEND_MESSAGE, {
      username,
      recipient,
      message,
      messageType,
      mediaUrl,
    });
  }

  sendTyping(username: string, recipient: string, isTyping: boolean): void {
    this.socket?.emit(SOCKET_EVENTS.TYPING, { username, recipient, isTyping });
  }

  emitCallEvent(event: string, payload: CallSignalPayload | CallOfferPayload | CallAnswerPayload | CallIcePayload): void {
    this.socket?.emit(event, payload);
  }

  onReceiveMessage(cb: EventCallback<Message>): () => void {
    return this.addListener(SOCKET_EVENTS.RECEIVE_MESSAGE, cb);
  }

  onNotification(cb: EventCallback<ChatNotification>): () => void {
    return this.addListener(SOCKET_EVENTS.NOTIFICATION, cb);
  }

  onFriendRequest(cb: EventCallback<FriendRequestNotification>): () => void {
    return this.addListener(SOCKET_EVENTS.FRIEND_REQUEST, cb);
  }

  onFriendRequestAccepted(cb: EventCallback<{ id: string; from: string; fromDisplayName: string }>): () => void {
    return this.addListener(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, cb);
  }

  onTyping(cb: EventCallback<TypingEvent>): () => void {
    return this.addListener(SOCKET_EVENTS.TYPING, cb);
  }

  onOnlineUsers(cb: EventCallback<OnlineUser[]>): () => void {
    return this.addListener(SOCKET_EVENTS.ONLINE_USERS, cb);
  }

  onConnect(cb: () => void): () => void {
    return this.addListener('connect', cb);
  }

  onDisconnect(cb: (reason: string) => void): () => void {
    return this.addListener('disconnect', cb);
  }

  onConnectError(cb: (error: Error) => void): () => void {
    return this.addListener('connect_error', cb);
  }

  onReconnectAttempt(cb: () => void): () => void {
    const register = (): (() => void) => {
      this.socket?.io.on('reconnect_attempt', cb);
      return () => this.socket?.io.off('reconnect_attempt', cb);
    };
    if (this.socket) return register();
    const id = window.setInterval(() => {
      if (this.socket) {
        window.clearInterval(id);
        register();
      }
    }, 50);
    return () => window.clearInterval(id);
  }

  onReconnect(cb: () => void): () => void {
    const register = (): (() => void) => {
      this.socket?.io.on('reconnect', cb);
      return () => this.socket?.io.off('reconnect', cb);
    };
    if (this.socket) return register();
    const id = window.setInterval(() => {
      if (this.socket) {
        window.clearInterval(id);
        register();
      }
    }, 50);
    return () => window.clearInterval(id);
  }

  onError(cb: EventCallback<{ message: string }>): () => void {
    return this.addListener(SOCKET_EVENTS.ERROR, cb);
  }

  onCallOffer(cb: EventCallback<CallOfferPayload>): () => void {
    return this.addListener('call-offer', cb);
  }

  onCallAnswer(cb: EventCallback<CallAnswerPayload>): () => void {
    return this.addListener('call-answer', cb);
  }

  onCallIceCandidate(cb: EventCallback<CallIcePayload>): () => void {
    return this.addListener('call-ice-candidate', cb);
  }

  onCallReject(cb: EventCallback<CallSignalPayload>): () => void {
    return this.addListener('call-reject', cb);
  }

  onCallEnd(cb: EventCallback<CallSignalPayload>): () => void {
    return this.addListener('call-end', cb);
  }

  onCallBusy(cb: EventCallback<CallSignalPayload>): () => void {
    return this.addListener('call-busy', cb);
  }
}

export const socketService = new SocketService();
