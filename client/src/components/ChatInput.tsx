import React, { useRef, useState, KeyboardEvent } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  MESSAGE_MAX_LENGTH,
} from '../constants/config';
import { useAuth } from '../contexts/AuthContext';
import { uploadChatMedia } from '../services/upload';
import { MessageType, SendMessagePayload } from '../types';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (payload: SendMessagePayload) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onTyping, disabled = false }) => {
  const { authUserId } = useAuth();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (value: string): void => {
    setText(value);
    onTyping(value.length > 0);
  };

  const handleSend = (): void => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend({ text: trimmed, messageType: 'text' });
    setText('');
    onTyping(false);
    setShowEmoji(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: EmojiClickData): void => {
    setText((prev) => prev + emoji.emoji);
    onTyping(true);
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video'): Promise<void> => {
    if (!authUserId || disabled) return;

    const maxMb = type === 'image' ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB;
    if (file.size > maxMb * 1024 * 1024) {
      alert(`File too large. Max ${maxMb}MB`);
      return;
    }

    setUploading(true);
    try {
      const { url, type: mediaType } = await uploadChatMedia(file, authUserId);
      onSend({
        text: text.trim() || (mediaType === 'image' ? '📷 Photo' : '🎥 Video'),
        messageType: mediaType as MessageType,
        mediaUrl: url,
      });
      setText('');
      onTyping(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const canSend = text.trim().length > 0 && !disabled && !uploading;

  return (
    <div className="chat-input">
      {showEmoji && (
        <div className="chat-input__emoji-picker">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.LIGHT} width="100%" height={320} />
        </div>
      )}

      <div className="chat-input__toolbar">
        <button
          type="button"
          className="chat-input__icon-btn"
          onClick={() => setShowEmoji((s) => !s)}
          disabled={disabled}
          aria-label="Emoji"
        >
          😊
        </button>
        <button
          type="button"
          className="chat-input__icon-btn"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || uploading}
          aria-label="Send image"
        >
          📷
        </button>
        <button
          type="button"
          className="chat-input__icon-btn"
          onClick={() => videoInputRef.current?.click()}
          disabled={disabled || uploading}
          aria-label="Send video"
        >
          🎥
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'image');
            e.target.value = '';
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept={ACCEPTED_VIDEO_TYPES}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'video');
            e.target.value = '';
          }}
        />
      </div>

      <div className="chat-input__row">
        <div className="chat-input__wrapper">
          <textarea
            className="chat-input__field"
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? 'Uploading...' : 'Type a message...'}
            maxLength={MESSAGE_MAX_LENGTH}
            disabled={disabled || uploading}
            rows={1}
          />
        </div>
        <button
          type="button"
          className="chat-input__send"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
