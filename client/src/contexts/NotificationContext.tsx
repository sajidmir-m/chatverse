import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket';
import { ChatNotification, FriendRequestNotification } from '../types';

interface NotificationContextValue {
  notifications: ChatNotification[];
  dismiss: (id: string) => void;
  requestPermission: () => Promise<void>;
  setActiveChat: (recipient: string | null) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const getMessageBody = (n: ChatNotification): string => {
  if (n.messageType === 'image') return '📷 Sent a photo';
  if (n.messageType === 'video') return '🎥 Sent a video';
  return n.message || 'New message';
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const navigate = useNavigate();
  const activeChatRef = useRef<string | null>(null);

  const setActiveChat = (recipient: string | null): void => {
    activeChatRef.current = recipient;
  };

  const requestPermission = useCallback(async (): Promise<void> => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const addNotification = useCallback((n: ChatNotification): void => {
    setNotifications((prev) => {
      if (prev.some((item) => item.id === n.id)) return prev;
      return [n, ...prev].slice(0, 8);
    });
    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== n.id));
    }, 6000);
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string, onClick?: () => void): void => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const notif = new Notification(title, { body, icon: '/favicon.ico' });
    if (onClick) {
      notif.onclick = () => {
        window.focus();
        onClick();
        notif.close();
      };
    }
  }, []);

  const dismiss = useCallback((id: string): void => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    const unsubMsg = socketService.onNotification((n) => {
      if (activeChatRef.current === n.from && document.hasFocus()) return;

      addNotification({ ...n, type: 'message' });
      showBrowserNotification(n.fromDisplayName, getMessageBody(n), () => {
        navigate(`/home/${encodeURIComponent(n.from)}`);
      });
    });

    const unsubFriend = socketService.onFriendRequest((n: FriendRequestNotification) => {
      addNotification({
        id: n.id,
        from: n.from,
        fromDisplayName: n.fromDisplayName,
        message: 'Sent you a friend request',
        messageType: 'text',
        createdAt: n.createdAt,
        type: 'friend_request',
      });
      showBrowserNotification(n.fromDisplayName, 'Sent you a friend request');
    });

    const unsubAccepted = socketService.onFriendRequestAccepted((n) => {
      addNotification({
        id: `accepted-${n.id}`,
        from: n.from,
        fromDisplayName: n.fromDisplayName,
        message: 'Accepted your friend request',
        messageType: 'text',
        createdAt: new Date().toISOString(),
        type: 'friend_accepted',
      });
      showBrowserNotification(n.fromDisplayName, 'Accepted your friend request', () => {
        navigate(`/home/${encodeURIComponent(n.from)}`);
      });
    });

    return () => {
      unsubMsg();
      unsubFriend();
      unsubAccepted();
    };
  }, [addNotification, navigate, showBrowserNotification]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const value = useMemo(
    () => ({ notifications, dismiss, requestPermission, setActiveChat }),
    [notifications, dismiss, requestPermission]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
