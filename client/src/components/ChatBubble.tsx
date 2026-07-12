import React from 'react';
import { Message } from '../types';
import { formatMessageTime } from '../utils/formatTime';
import './ChatBubble.css';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwn }) => {
  const renderContent = (): React.ReactNode => {
    if (message.message_type === 'image' && message.media_url) {
      return (
        <>
          <img src={message.media_url} alt="Shared" className="chat-bubble__media" loading="lazy" />
          {message.message && message.message !== '📷 Photo' && (
            <p className="chat-bubble__text">{message.message}</p>
          )}
        </>
      );
    }

    if (message.message_type === 'video' && message.media_url) {
      return (
        <>
          <video src={message.media_url} controls className="chat-bubble__media" preload="metadata" />
          {message.message && message.message !== '🎥 Video' && (
            <p className="chat-bubble__text">{message.message}</p>
          )}
        </>
      );
    }

    return <p className="chat-bubble__text">{message.message}</p>;
  };

  return (
    <div className={`chat-bubble ${isOwn ? 'chat-bubble--own' : 'chat-bubble--other'}`}>
      <div className="chat-bubble__content">
        {renderContent()}
        <span className="chat-bubble__time">{formatMessageTime(message.created_at)}</span>
      </div>
    </div>
  );
};
