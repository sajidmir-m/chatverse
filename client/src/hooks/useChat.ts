import { useCallback, useEffect, useRef, useState } from 'react';
import { TYPING_DEBOUNCE_MS } from '../constants/config';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import { Message, SendMessagePayload, TypingEvent } from '../types';

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  typingUsers: string[];
  sendMessage: (payload: SendMessagePayload) => void;
  handleTyping: (isTyping: boolean) => void;
  refreshMessages: () => Promise<void>;
}

export const useChat = (recipient: string): UseChatReturn => {
  const { username } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingUsersTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const refreshMessages = useCallback(async (): Promise<void> => {
    if (!recipient) return;
    try {
      setError(null);
      setMessages(await apiService.getConversationMessages(recipient));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [recipient]);

  useEffect(() => {
    setIsLoading(true);
    setMessages([]);
    refreshMessages();
  }, [recipient, refreshMessages]);

  useEffect(() => {
    const unsubReceive = socketService.onReceiveMessage((message: Message) => {
      const isConversation =
        (message.username === username && message.recipient_username === recipient) ||
        (message.username === recipient && message.recipient_username === username);
      if (!isConversation) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    const unsubTyping = socketService.onTyping((event: TypingEvent) => {
      if (!username || event.username === username || event.recipient !== username) return;
      const timeouts = typingUsersTimeoutRef.current;
      const existing = timeouts.get(event.username);
      if (existing) clearTimeout(existing);

      if (event.isTyping) {
        setTypingUsers((prev) => (prev.includes(event.username) ? prev : [...prev, event.username]));
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== event.username));
          timeouts.delete(event.username);
        }, TYPING_DEBOUNCE_MS + 500);
        timeouts.set(event.username, timeout);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== event.username));
        timeouts.delete(event.username);
      }
    });

    return () => {
      unsubReceive();
      unsubTyping();
      typingUsersTimeoutRef.current.forEach(clearTimeout);
      typingUsersTimeoutRef.current.clear();
    };
  }, [username, recipient]);

  const handleTyping = useCallback(
    (isTyping: boolean): void => {
      if (!username || !recipient) return;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      socketService.sendTyping(username, recipient, isTyping);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socketService.sendTyping(username, recipient, false);
        }, TYPING_DEBOUNCE_MS);
      }
    },
    [username, recipient]
  );

  const sendMessage = useCallback(
    (payload: SendMessagePayload): void => {
      if (!username || !recipient) return;
      const text = payload.text.trim();
      if (!text && !payload.mediaUrl) return;
      socketService.sendMessage(
        username,
        recipient,
        text,
        payload.messageType || 'text',
        payload.mediaUrl ?? null
      );
      handleTyping(false);
    },
    [username, recipient, handleTyping]
  );

  return { messages, isLoading, error, typingUsers, sendMessage, handleTyping, refreshMessages };
};
