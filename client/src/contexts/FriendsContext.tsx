import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import { ConversationSummary, FriendRequest } from '../types';

interface FriendsContextValue {
  conversations: ConversationSummary[];
  incomingRequests: FriendRequest[];
  isLoading: boolean;
  refreshConversations: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  sendFriendRequest: (username: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextValue | undefined>(undefined);

export const FriendsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConversations = useCallback(async (): Promise<void> => {
    try {
      setConversations(await apiService.getConversations());
    } catch {
      setConversations([]);
    }
  }, []);

  const refreshRequests = useCallback(async (): Promise<void> => {
    try {
      setIncomingRequests(await apiService.getIncomingFriendRequests());
    } catch {
      setIncomingRequests([]);
    }
  }, []);

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all([refreshConversations(), refreshRequests()]);
    setIsLoading(false);
  }, [refreshConversations, refreshRequests]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const unsubMessage = socketService.onReceiveMessage(() => {
      refreshConversations();
    });
    const unsubFriendReq = socketService.onFriendRequest(() => {
      refreshRequests();
    });
    const unsubAccepted = socketService.onFriendRequestAccepted(() => {
      refreshConversations();
      refreshRequests();
    });
    return () => {
      unsubMessage();
      unsubFriendReq();
      unsubAccepted();
    };
  }, [refreshConversations, refreshRequests]);

  const sendFriendRequest = useCallback(
    async (username: string): Promise<void> => {
      await apiService.sendFriendRequest(username);
      await refreshRequests();
    },
    [refreshRequests]
  );

  const acceptRequest = useCallback(
    async (requestId: string): Promise<void> => {
      await apiService.acceptFriendRequest(requestId);
      await refreshAll();
    },
    [refreshAll]
  );

  const rejectRequest = useCallback(
    async (requestId: string): Promise<void> => {
      await apiService.rejectFriendRequest(requestId);
      await refreshRequests();
    },
    [refreshRequests]
  );

  const value = useMemo(
    () => ({
      conversations,
      incomingRequests,
      isLoading,
      refreshConversations,
      refreshRequests,
      sendFriendRequest,
      acceptRequest,
      rejectRequest,
    }),
    [
      conversations,
      incomingRequests,
      isLoading,
      refreshConversations,
      refreshRequests,
      sendFriendRequest,
      acceptRequest,
      rejectRequest,
    ]
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
};

export const useFriends = (): FriendsContextValue => {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within FriendsProvider');
  return ctx;
};
