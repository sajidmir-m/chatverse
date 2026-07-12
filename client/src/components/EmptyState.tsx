import React from 'react';
import './EmptyState.css';

export const EmptyState: React.FC = () => {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h2 className="empty-state__title">No messages yet</h2>
      <p className="empty-state__subtitle">Say hello and start the conversation!</p>
    </div>
  );
};
