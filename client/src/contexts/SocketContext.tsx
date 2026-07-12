import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { socketService } from '../services/socket';
import { ConnectionStatus, OnlineUser } from '../types';
import { useAuth } from './AuthContext';

interface SocketContextValue {
  connectionStatus: ConnectionStatus;
  onlineUsers: OnlineUser[];
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { username, accessToken } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setConnectionStatus('disconnected');
    setOnlineUsers([]);
  }, []);

  useEffect(() => {
    if (!username || !accessToken) {
      disconnect();
      return;
    }

    setConnectionStatus('connecting');
    socketService.connect(username, accessToken);

    const unsubConnect = socketService.onConnect(() => setConnectionStatus('connected'));
    const unsubDisconnect = socketService.onDisconnect(() => setConnectionStatus('disconnected'));
    const unsubReconnectAttempt = socketService.onReconnectAttempt(() =>
      setConnectionStatus('reconnecting')
    );
    const unsubReconnect = socketService.onReconnect(() => setConnectionStatus('connected'));
    const unsubConnectError = socketService.onConnectError(() =>
      setConnectionStatus('disconnected')
    );
    const unsubOnlineUsers = socketService.onOnlineUsers(setOnlineUsers);
    const unsubError = socketService.onError((error) => {
      console.error('[Socket] Error:', error.message);
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubReconnectAttempt();
      unsubReconnect();
      unsubConnectError();
      unsubOnlineUsers();
      unsubError();
      disconnect();
    };
  }, [username, accessToken, disconnect]);

  const value = useMemo(
    () => ({ connectionStatus, onlineUsers, disconnect }),
    [connectionStatus, onlineUsers, disconnect]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
