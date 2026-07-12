import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChatBubble } from '../components/ChatBubble';
import { ChatHeader } from '../components/ChatHeader';
import { ChatInput } from '../components/ChatInput';
import { ConnectionStatusBar } from '../components/ConnectionStatusBar';
import { EmptyState } from '../components/EmptyState';
import { ChatSkeletonLoader } from '../components/MessageSkeleton';
import { TypingIndicator } from '../components/TypingIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../hooks/useChat';
import { apiService } from '../services/api';
import { OnlineUser } from '../types';
import './ChatPage.css';

export const ChatPage: React.FC = () => {
  const { recipient = '' } = useParams<{ recipient: string }>();
  const decodedRecipient = decodeURIComponent(recipient);
  const { username, logout } = useAuth();
  const { connectionStatus, onlineUsers } = useSocket();
  const { setActiveChat } = useNotifications();
  const navigate = useNavigate();
  const [recipientUser, setRecipientUser] = React.useState<OnlineUser | null>(null);

  const {
    messages,
    isLoading,
    error,
    typingUsers,
    sendMessage,
    handleTyping,
    refreshMessages,
  } = useChat(decodedRecipient);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveChat(decodedRecipient);
    return () => setActiveChat(null);
  }, [decodedRecipient, setActiveChat]);

  useEffect(() => {
    apiService.getUser(decodedRecipient).then(setRecipientUser).catch(() => setRecipientUser(null));
  }, [decodedRecipient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  if (!username || !decodedRecipient) return null;

  const recipientOnline = onlineUsers.some((u) => u.username === decodedRecipient);
  const isConnected = connectionStatus === 'connected';

  return (
    <div className="chat-page">
      <ChatHeader
        username={decodedRecipient}
        displayName={recipientUser?.display_name}
        avatarUrl={recipientUser?.avatar_url}
        isConnected={isConnected}
        isRecipientOnline={recipientOnline}
        onLogout={handleLogout}
        onBack={() => navigate('/home')}
        onProfile={() => navigate('/profile')}
      />

      <ConnectionStatusBar status={connectionStatus} />

      <div className="chat-page__body">
        {isLoading ? (
          <ChatSkeletonLoader />
        ) : error ? (
          <div className="chat-page__error">
            <p>{error}</p>
            <button type="button" onClick={refreshMessages}>Retry</button>
          </div>
        ) : (
          <div className={`chat-page__messages ${messages.length === 0 ? 'chat-page__messages--empty' : ''}`}>
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} isOwn={msg.username === username} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        <TypingIndicator users={typingUsers} />
      </div>

      <div className="chat-page__footer">
        {!isConnected && !isLoading && (
          <div className="chat-page__waiting">Waiting for connection...</div>
        )}
        <ChatInput onSend={sendMessage} onTyping={handleTyping} disabled={!isConnected} />
      </div>
    </div>
  );
};
