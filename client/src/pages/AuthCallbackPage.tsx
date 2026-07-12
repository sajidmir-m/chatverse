import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { apiService } from '../services/api';
import './AuthCallbackPage.css';

export const AuthCallbackPage: React.FC = () => {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Completing Google sign-in...');

  useEffect(() => {
    let isMounted = true;

    const completeSignIn = async (): Promise<void> => {
      try {
        setStatus('Verifying your Google account...');

        const waitForSession = async (): Promise<boolean> => {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            return true;
          }

          return new Promise((resolve) => {
            const timeout = window.setTimeout(() => resolve(false), 12000);

            const {
              data: { subscription },
            } = supabase.auth.onAuthStateChange((event, newSession) => {
              if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession) {
                window.clearTimeout(timeout);
                subscription.unsubscribe();
                resolve(true);
              }
            });
          });
        };

        const hasSession = await waitForSession();

        if (!hasSession) {
          throw new Error('Google sign-in did not complete. Please try again.');
        }

        if (!isMounted) {
          return;
        }

        setStatus('Loading your profile...');
        await refreshProfile();

        const me = await apiService.getMe();

        if (!isMounted) {
          return;
        }

        navigate(me.profile?.username ? '/home' : '/setup-profile', { replace: true });
      } catch (callbackError) {
        if (!isMounted) {
          return;
        }

        const message =
          callbackError instanceof Error
            ? callbackError.message
            : 'Google sign-in failed';
        setError(message);
      }
    };

    completeSignIn();

    return () => {
      isMounted = false;
    };
  }, [navigate, refreshProfile]);

  if (error) {
    return (
      <div className="auth-callback">
        <div className="auth-callback__card">
          <h1>Sign-in failed</h1>
          <p>{error}</p>
          <Link to="/" className="auth-callback__link">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-callback">
      <div className="auth-callback__card">
        <span className="auth-callback__spinner" />
        <p>{status}</p>
      </div>
    </div>
  );
};
