import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../contexts/FriendsContext';
import { apiService } from '../services/api';
import { ConversationSummary, SearchUserResult } from '../types';
import { formatMessageTime } from '../utils/formatTime';
import './ChatSidebar.css';

interface ChatSidebarProps {
  activeRecipient: string | null;
  onSelectChat: (username: string) => void;
}

const previewText = (conv: ConversationSummary, myUsername: string): string => {
  if (!conv.last_message) return 'No messages yet';
  if (conv.last_message_type === 'image') return '📷 Photo';
  if (conv.last_message_type === 'video') return '🎥 Video';
  const prefix = conv.last_message_from === myUsername ? 'You: ' : '';
  return prefix + conv.last_message;
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ activeRecipient, onSelectChat }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const {
    conversations,
    incomingRequests,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    isLoading,
  } = useFriends();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string): Promise<void> => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      setSearchResults(await apiService.searchUsers(trimmed));
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const handleAddFriend = async (username: string): Promise<void> => {
    setActionLoading(username);
    try {
      await sendFriendRequest(username);
      await runSearch(query);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setActionLoading(null);
    }
  };

  if (!profile) return null;

  const showSearchResults = query.trim().length > 0;

  return (
    <aside className="chat-sidebar">
      <header className="chat-sidebar__header">
        <button type="button" className="chat-sidebar__profile" onClick={() => navigate('/profile')}>
          <UserAvatar name={profile.display_name || profile.username} avatarUrl={profile.avatar_url} size="md" />
          <div>
            <strong>{profile.display_name || profile.username}</strong>
            <span>@{profile.username}</span>
          </div>
        </button>
        <button type="button" className="chat-sidebar__logout" onClick={() => logout().then(() => navigate('/'))}>
          ⎋
        </button>
      </header>

      <div className="chat-sidebar__search">
        <input
          type="text"
          placeholder="Search or start new chat"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {incomingRequests.length > 0 && (
        <div className="chat-sidebar__requests">
          <p className="chat-sidebar__requests-title">Friend requests ({incomingRequests.length})</p>
          {incomingRequests.map((req) => (
            <div key={req.id} className="chat-sidebar__request-item">
              <UserAvatar name={req.from_display_name || req.from_username} avatarUrl={req.from_avatar_url} size="sm" />
              <div className="chat-sidebar__request-info">
                <strong>{req.from_display_name || req.from_username}</strong>
                <span>@{req.from_username}</span>
              </div>
              <button type="button" className="chat-sidebar__accept" onClick={() => acceptRequest(req.id)}>✓</button>
              <button type="button" className="chat-sidebar__reject" onClick={() => rejectRequest(req.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {!showSearchResults && (
        <div className="chat-sidebar__tabs">
          <button type="button" className={activeTab === 'chats' ? 'active' : ''} onClick={() => setActiveTab('chats')}>
            Chats
          </button>
          <button type="button" className={activeTab === 'contacts' ? 'active' : ''} onClick={() => setActiveTab('contacts')}>
            Contacts
          </button>
        </div>
      )}

      <div className="chat-sidebar__list">
        {showSearchResults ? (
          <>
            {isSearching && <p className="chat-sidebar__empty">Searching...</p>}
            {!isSearching && searchResults.length === 0 && <p className="chat-sidebar__empty">No users found</p>}
            {searchResults.map((user) => (
              <div key={user.username} className="chat-sidebar__search-item">
                <UserAvatar name={user.display_name || user.username} avatarUrl={user.avatar_url} size="md" online={user.online} />
                <div className="chat-sidebar__item-info">
                  <strong>{user.display_name || user.username}</strong>
                  <span>@{user.username}</span>
                </div>
                {user.friend_status === 'friends' && (
                  <button type="button" className="chat-sidebar__chat-btn" onClick={() => { onSelectChat(user.username); setQuery(''); }}>
                    Chat
                  </button>
                )}
                {user.friend_status === 'none' && (
                  <button type="button" className="chat-sidebar__add-btn" disabled={actionLoading === user.username} onClick={() => handleAddFriend(user.username)}>
                    {actionLoading === user.username ? '...' : 'Add Friend'}
                  </button>
                )}
                {user.friend_status === 'pending_sent' && <span className="chat-sidebar__pending">Pending</span>}
                {user.friend_status === 'pending_received' && (
                  <button type="button" className="chat-sidebar__accept" onClick={() => user.request_id && acceptRequest(user.request_id)}>Accept</button>
                )}
              </div>
            ))}
          </>
        ) : isLoading ? (
          <p className="chat-sidebar__empty">Loading...</p>
        ) : activeTab === 'chats' ? (
          conversations.length === 0 ? (
            <p className="chat-sidebar__empty">No chats yet. Search above to add friends!</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.username}
                type="button"
                className={`chat-sidebar__item ${activeRecipient === conv.username ? 'chat-sidebar__item--active' : ''}`}
                onClick={() => onSelectChat(conv.username)}
              >
                <UserAvatar name={conv.display_name || conv.username} avatarUrl={conv.avatar_url} size="md" online={conv.online} />
                <div className="chat-sidebar__item-info">
                  <div className="chat-sidebar__item-top">
                    <strong>{conv.display_name || conv.username}</strong>
                    {conv.last_message_at && (
                      <time>{formatMessageTime(conv.last_message_at)}</time>
                    )}
                  </div>
                  <p className="chat-sidebar__preview">{previewText(conv, profile.username)}</p>
                </div>
              </button>
            ))
          )
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.username}
              type="button"
              className={`chat-sidebar__item ${activeRecipient === conv.username ? 'chat-sidebar__item--active' : ''}`}
              onClick={() => onSelectChat(conv.username)}
            >
              <UserAvatar name={conv.display_name || conv.username} avatarUrl={conv.avatar_url} size="md" online={conv.online} />
              <div className="chat-sidebar__item-info">
                <strong>{conv.display_name || conv.username}</strong>
                <span>@{conv.username}</span>
                <span className={`chat-sidebar__presence ${conv.online ? 'online' : ''}`}>
                  {conv.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};
