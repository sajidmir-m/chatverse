import React, { useEffect, useRef } from 'react';
import { ChatBubble } from './ChatBubble';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ConnectionStatusBar } from './ConnectionStatusBar';
import { EmptyState } from './EmptyState';
import { ChatSkeletonLoader } from './MessageSkeleton';
import { TypingIndicator } from './TypingIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../hooks/useChat';
import { OnlineUser } from '../types';
import '../pages/ChatPage.css';

interface ChatPanelProps {
  recipient: string;
  recipientUser: OnlineUser | null;
  onBack?: () => void;
  onLogout: () => void;
  onProfile: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  recipient,
  recipientUser,
  onBack,
  onLogout,
  onProfile,
}) => {
  const { username } = useAuth();
  const { connectionStatus, onlineUsers } = useSocket();
  const { setActiveChat } = useNotifications();
  const { messages, isLoading, error, typingUsers, sendMessage, handleTyping, refreshMessages } =
    useChat(recipient);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveChat(recipient);
    return () => setActiveChat(null);
  }, [recipient, setActiveChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (!username) return null;

  const recipientOnline = onlineUsers.some((u) => u.username === recipient);
  const isConnected = connectionStatus === 'connected';

  return (
    <div className="chat-page chat-page--panel">
      <ChatHeader
        username={recipient}
        displayName={recipientUser?.display_name}
        avatarUrl={recipientUser?.avatar_url}
        isConnected={isConnected}
        isRecipientOnline={recipientOnline}
        onLogout={onLogout}
        onBack={onBack}
        onProfile={onProfile}
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
            {messages.length === 0 ? <EmptyState /> : messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} isOwn={msg.username === username} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        <TypingIndicator users={typingUsers} />
      </div>
      <div className="chat-page__footer">
        {!isConnected && !isLoading && <div className="chat-page__waiting">Waiting for connection...</div>}
        <ChatInput onSend={sendMessage} onTyping={handleTyping} disabled={!isConnected} />
      </div>
    </div>
  );
};
