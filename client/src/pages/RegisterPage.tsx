import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../contexts/AuthContext';
import { RegisterFormData } from '../types';
import './LoginPage.css';

export const RegisterPage: React.FC = () => {
  const { register: registerAccount, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await registerAccount(data.email.trim(), data.password);
      navigate('/setup-profile', { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async (): Promise<void> => {
    setSubmitError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to start Google signup');
      setIsGoogleLoading(false);
    }
  };

  const isDisabled = isSubmitting || isGoogleLoading;

  return (
    <div className="login-page">
      <div className="login-page__hero">
        <div className="login-page__logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <h1 className="login-page__title">Create Account</h1>
        <p className="login-page__tagline">Sign up with Google or email — set up profile next</p>
      </div>

      <div className="login-page__form-wrap">
        <form className="login-page__card" onSubmit={handleSubmit(onSubmit)}>
          <GoogleSignInButton
            label={isGoogleLoading ? 'Redirecting...' : 'Sign up with Google'}
            disabled={isDisabled}
            onClick={handleGoogleSignup}
          />

          <div className="login-page__divider">or register with email</div>

          <label className="login-page__label" htmlFor="email">Email</label>
          <div className={`login-page__input-wrap ${errors.email ? 'login-page__input-wrap--error' : ''}`}>
            <input
              id="email"
              className="login-page__input"
              type="email"
              placeholder="you@example.com"
              disabled={isDisabled}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
          </div>
          {errors.email && <p className="login-page__error">{errors.email.message}</p>}

          <label className="login-page__label" htmlFor="password" style={{ marginTop: 16 }}>Password</label>
          <div className={`login-page__input-wrap ${errors.password ? 'login-page__input-wrap--error' : ''}`}>
            <input
              id="password"
              className="login-page__input"
              type="password"
              placeholder="At least 6 characters"
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
            {isSubmitting ? <span className="login-page__spinner" /> : 'Create Account'}
          </button>

          <p className="login-page__footer-text">
            Already have an account? <Link to="/">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
