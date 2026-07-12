import React from 'react';
import { useCall } from '../contexts/CallContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserAvatar } from './UserAvatar';
import './ChatHeader.css';

interface ChatHeaderProps {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isConnected: boolean;
  isRecipientOnline?: boolean;
  onLogout: () => void;
  onBack?: () => void;
  onProfile?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  username,
  displayName,
  avatarUrl,
  isConnected,
  isRecipientOnline = false,
  onLogout,
  onBack,
  onProfile,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { startCall, status: callStatus } = useCall();
  const name = displayName || username;
  const canCall = isConnected && callStatus === 'idle';

  return (
    <header className="chat-header">
      <div className="chat-header__inner">
        <div className="chat-header__left">
          {onBack && (
            <button type="button" className="chat-header__btn" onClick={onBack} aria-label="Back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <UserAvatar name={name} avatarUrl={avatarUrl} size="md" online={isRecipientOnline} />
          <div>
            <h1 className="chat-header__title">{name}</h1>
            <div className="online-indicator">
              <span
                className="online-indicator__dot"
                style={{
                  background: isConnected
                    ? isRecipientOnline
                      ? 'var(--online)'
                      : 'var(--offline)'
                    : 'var(--offline)',
                }}
              />
              <span className="online-indicator__text">
                {!isConnected ? 'Connecting...' : isRecipientOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="chat-header__actions">
          <button
            type="button"
            className="chat-header__btn"
            disabled={!canCall}
            onClick={() => startCall(username, 'voice', name)}
            aria-label="Voice call"
            title="Voice call"
          >
            📞
          </button>
          <button
            type="button"
            className="chat-header__btn"
            disabled={!canCall}
            onClick={() => startCall(username, 'video', name)}
            aria-label="Video call"
            title="Video call"
          >
            📹
          </button>
          {onProfile && (
            <button type="button" className="chat-header__btn" onClick={onProfile} aria-label="Profile">
              👤
            </button>
          )}
          <button type="button" className="chat-header__btn" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? '☀️' : '🌙'}
          </button>
          <button type="button" className="chat-header__btn" onClick={onLogout} aria-label="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
