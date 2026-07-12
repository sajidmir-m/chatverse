import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChatPanel } from '../components/ChatPanel';
import { ChatSidebar } from '../components/ChatSidebar';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { OnlineUser } from '../types';
import './WhatsAppPage.css';

export const WhatsAppPage: React.FC = () => {
  const { recipient } = useParams<{ recipient?: string }>();
  const activeRecipient = recipient ? decodeURIComponent(recipient) : null;
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [recipientUser, setRecipientUser] = useState<OnlineUser | null>(null);

  useEffect(() => {
    if (!activeRecipient) {
      setRecipientUser(null);
      return;
    }
    apiService.getUser(activeRecipient).then(setRecipientUser).catch(() => setRecipientUser(null));
  }, [activeRecipient]);

  const handleSelectChat = useCallback(
    (username: string): void => {
      navigate(`/home/${encodeURIComponent(username)}`);
    },
    [navigate]
  );

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  const showChatOnMobile = Boolean(activeRecipient);

  return (
    <div className="whatsapp-page">
      <div className={`whatsapp-page__sidebar ${showChatOnMobile ? 'whatsapp-page__sidebar--hidden-mobile' : ''}`}>
        <ChatSidebar activeRecipient={activeRecipient} onSelectChat={handleSelectChat} />
      </div>

      <div className={`whatsapp-page__main ${!activeRecipient ? 'whatsapp-page__main--empty' : ''} ${showChatOnMobile ? 'whatsapp-page__main--visible-mobile' : ''}`}>
        {activeRecipient ? (
          <ChatPanel
            recipient={activeRecipient}
            recipientUser={recipientUser}
            onBack={() => navigate('/home')}
            onLogout={handleLogout}
            onProfile={() => navigate('/profile')}
          />
        ) : (
          <div className="whatsapp-page__welcome">
            <div className="whatsapp-page__welcome-icon">💬</div>
            <h2>RealTime Chat</h2>
            <p>Search for people and add them as friends to start chatting.</p>
            <p className="whatsapp-page__welcome-hint">Send messages, photos, videos, voice & video calls.</p>
          </div>
        )}
      </div>
    </div>
  );
};
