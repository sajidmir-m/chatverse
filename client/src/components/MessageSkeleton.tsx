import React from 'react';
import './MessageSkeleton.css';

interface MessageSkeletonProps {
  isOwn?: boolean;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ isOwn = false }) => {
  return (
    <div className={`skeleton__row ${isOwn ? 'skeleton__row--own' : 'skeleton__row--other'}`}>
      <div
        className="skeleton__bubble"
        style={{ width: isOwn ? '55%' : '65%' }}
      />
      <div
        className="skeleton__bubble skeleton__bubble--sm"
        style={{ width: isOwn ? '30%' : '40%' }}
      />
    </div>
  );
};

export const ChatSkeletonLoader: React.FC = () => {
  return (
    <div className="skeleton">
      <MessageSkeleton />
      <MessageSkeleton isOwn />
      <MessageSkeleton />
      <MessageSkeleton isOwn />
      <MessageSkeleton />
    </div>
  );
};
