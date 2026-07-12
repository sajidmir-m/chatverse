import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { OnlineUser } from '../types';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OnlineUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const runSearch = useCallback(async (searchQuery: string): Promise<void> => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      setResults(await apiService.searchUsers(trimmed));
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  if (!profile) return null;

  return (
    <div className="home-page">
      <header className="home-page__header">
        <div className="home-page__profile" onClick={() => navigate('/profile')}>
          <UserAvatar
            name={profile.display_name || profile.username}
            avatarUrl={profile.avatar_url}
            size="md"
          />
          <div>
            <h1>{profile.display_name || profile.username}</h1>
            <p>@{profile.username}</p>
          </div>
        </div>
        <button type="button" className="home-page__logout" onClick={() => logout().then(() => navigate('/'))}>
          Logout
        </button>
      </header>

      <div className="home-page__search-wrap">
        <input
          className="home-page__search"
          type="text"
          placeholder="Search by username or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="home-page__results">
        {isSearching && <p className="home-page__status">Searching...</p>}
        {!isSearching && query.trim() && results.length === 0 && (
          <p className="home-page__status">No users found</p>
        )}
        {!query.trim() && <p className="home-page__status">Find someone to chat, call, or video call</p>}

        {results.map((user) => (
          <button
            key={user.username}
            type="button"
            className="home-page__user-card"
            onClick={() => navigate(`/chat/${encodeURIComponent(user.username)}`)}
          >
            <UserAvatar
              name={user.display_name || user.username}
              avatarUrl={user.avatar_url}
              size="md"
              online={user.online}
            />
            <div className="home-page__user-info">
              <span className="home-page__name">{user.display_name || user.username}</span>
              <span className="home-page__username">@{user.username}</span>
              <span className={`home-page__presence ${user.online ? 'online' : 'offline'}`}>
                {user.online ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className="home-page__chat-link">Chat →</span>
          </button>
        ))}
      </div>
    </div>
  );
};
