import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { CallOverlay } from './components/CallOverlay';
import { NotificationToast } from './components/NotificationToast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CallProvider } from './contexts/CallContext';
import { FriendsProvider } from './contexts/FriendsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { SetupProfilePage } from './pages/SetupProfilePage';
import { WhatsAppPage } from './pages/WhatsAppPage';

const LoadingScreen: React.FC = () => (
  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div
      style={{
        width: 40,
        height: 40,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  </div>
);

const AuthenticatedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { email, hasProfile, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!email) return <Navigate to="/" replace />;
  if (!hasProfile) return <Navigate to="/setup-profile" replace />;
  return children;
};

const AuthRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { email, hasProfile, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (email && hasProfile) return <Navigate to="/home" replace />;
  if (email && !hasProfile) return <Navigate to="/setup-profile" replace />;
  return children;
};

const SetupRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { email, hasProfile, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!email) return <Navigate to="/" replace />;
  if (hasProfile) return <Navigate to="/home" replace />;
  return children;
};

const AuthenticatedLayout: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <SocketProvider>
    <FriendsProvider>
      <CallProvider>
        <NotificationProvider>
          {children}
          <NotificationToast />
          <CallOverlay />
        </NotificationProvider>
      </CallProvider>
    </FriendsProvider>
  </SocketProvider>
);

const ChatRedirect: React.FC = () => {
  const { recipient } = useParams<{ recipient: string }>();
  return <Navigate to={`/home/${encodeURIComponent(recipient || '')}`} replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/" element={<AuthRoute><LoginPage /></AuthRoute>} />
    <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
    <Route path="/setup-profile" element={<SetupRoute><SetupProfilePage /></SetupRoute>} />
    <Route
      path="/home"
      element={
        <AuthenticatedRoute>
          <AuthenticatedLayout><WhatsAppPage /></AuthenticatedLayout>
        </AuthenticatedRoute>
      }
    />
    <Route
      path="/home/:recipient"
      element={
        <AuthenticatedRoute>
          <AuthenticatedLayout><WhatsAppPage /></AuthenticatedLayout>
        </AuthenticatedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <AuthenticatedRoute>
          <AuthenticatedLayout><ProfilePage /></AuthenticatedLayout>
        </AuthenticatedRoute>
      }
    />
    <Route path="/chat/:recipient" element={<ChatRedirect />} />
    <Route path="/setup-username" element={<Navigate to="/setup-profile" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
