import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationToast.css';

export const NotificationToast: React.FC = () => {
  const { notifications, dismiss } = useNotifications();
  const navigate = useNavigate();

  if (notifications.length === 0) return null;

  const handleClick = (n: (typeof notifications)[0]): void => {
    dismiss(n.id);
    if (n.type === 'friend_request') {
      navigate('/home');
    } else {
      navigate(`/home/${encodeURIComponent(n.from)}`);
    }
  };

  return (
    <div className="notification-toast">
      {notifications.map((n) => (
        <button key={n.id} type="button" className="notification-toast__item" onClick={() => handleClick(n)}>
          <strong>
            {n.type === 'friend_request' && '👋 '}
            {n.type === 'friend_accepted' && '🎉 '}
            {n.fromDisplayName}
          </strong>
          <span>
            {n.type === 'friend_request'
              ? 'Sent you a friend request'
              : n.type === 'friend_accepted'
                ? 'Accepted your friend request'
                : n.messageType === 'image'
                  ? '📷 Photo'
                  : n.messageType === 'video'
                    ? '🎥 Video'
                    : n.message}
          </span>
        </button>
      ))}
    </div>
  );
};
