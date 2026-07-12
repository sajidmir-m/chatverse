import React from 'react';
import { ConnectionStatus } from '../types';
import './ConnectionStatusBar.css';

interface ConnectionStatusBarProps {
  status: ConnectionStatus;
}

const labels: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
};

export const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({ status }) => {
  if (status === 'connected') return null;

  return (
    <div className="connection-bar">
      <span className="connection-bar__spinner" />
      <span>{labels[status]}</span>
    </div>
  );
};
