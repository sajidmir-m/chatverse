import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseProjectRef, isGoogleAuthEnabled } from '../services/authSettings';
import { LoginFormData } from '../types';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);
  const projectRef = getSupabaseProjectRef();

  useEffect(() => {
    isGoogleAuthEnabled().then(setGoogleEnabled);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await login(data.email.trim(), data.password);
      navigate('/home', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to login';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    setSubmitError(null);

    if (googleEnabled === false) {
      setSubmitError(
        `Google is OFF on Supabase project "${projectRef}". Open that exact project -> Authentication -> Providers -> Google, add Client ID/Secret, enable, and click Save.`
      );
      return;
    }

    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start Google login';
      setSubmitError(message);
      setIsGoogleLoading(false);
    }
  };

  const isDisabled = isSubmitting || isGoogleLoading;

  return (
    <div className="login-page">
      <div className="login-page__hero">
        <div className="login-page__logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
          </svg>
        </div>
        <h1 className="login-page__title">RealTime Chat</h1>
        <p className="login-page__tagline">Sign in with email or Google</p>
      </div>

      <div className="login-page__form-wrap">
        <form className="login-page__card" onSubmit={handleSubmit(onSubmit)}>
          {googleEnabled === false && (
            <div className="login-page__warning">
              Google sign-in is <strong>not enabled</strong> on Supabase project{' '}
              <code>{projectRef}</code>. Enable it under Authentication → Providers → Google, then
              click <strong>Save</strong>.
            </div>
          )}

          <GoogleSignInButton
            label={isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
            disabled={isDisabled || googleEnabled === false}
            onClick={handleGoogleLogin}
          />

          <div className="login-page__divider">or sign in with email</div>

          <label className="login-page__label" htmlFor="email">
            Email
          </label>
          <p className="login-page__hint">Use the email you registered with</p>

          <div
            className={`login-page__input-wrap ${errors.email ? 'login-page__input-wrap--error' : ''}`}
          >
            <input
              id="email"
              className="login-page__input"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isDisabled}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email',
                },
              })}
            />
          </div>
          {errors.email && <p className="login-page__error">{errors.email.message}</p>}

          <label className="login-page__label" htmlFor="password" style={{ marginTop: 16 }}>
            Password
          </label>

          <div
            className={`login-page__input-wrap ${errors.password ? 'login-page__input-wrap--error' : ''}`}
          >
            <input
              id="password"
              className="login-page__input"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              disabled={isDisabled}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
            />
          </div>
          {errors.password && <p className="login-page__error">{errors.password.message}</p>}
          {submitError && <p className="login-page__error">{submitError}</p>}

          <button type="submit" className="login-page__submit" disabled={isDisabled}>
            {isSubmitting ? <span className="login-page__spinner" /> : 'Sign In with Email'}
          </button>

          <p className="login-page__footer-text">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
