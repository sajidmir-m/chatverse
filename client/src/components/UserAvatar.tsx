import React from 'react';
import './UserAvatar.css';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  online,
}) => {
  return (
    <div className={`user-avatar user-avatar--${size}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="user-avatar__img" />
      ) : (
        <span className="user-avatar__initial">{name.charAt(0).toUpperCase()}</span>
      )}
      {online !== undefined && (
        <span className={`user-avatar__status ${online ? 'online' : 'offline'}`} />
      )}
    </div>
  );
};
