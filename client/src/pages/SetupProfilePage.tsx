import React, { useState, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../constants/config';
import { useAuth } from '../contexts/AuthContext';
import { uploadAvatar } from '../services/upload';
import { SetupProfileFormData } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import './SetupProfilePage.css';

export const SetupProfilePage: React.FC = () => {
  const { setupProfile, authUserId } = useAuth();
  const navigate = useNavigate();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetupProfileFormData>({
    defaultValues: { username: '', displayName: '', bio: '', phone: '' },
  });

  const displayName = watch('displayName');

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: SetupProfileFormData): Promise<void> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let avatarUrl: string | null = null;
      if (avatarFile && authUserId) {
        avatarUrl = await uploadAvatar(avatarFile, authUserId);
      }

      await setupProfile({
        username: data.username.trim(),
        displayName: data.displayName.trim() || data.username.trim(),
        bio: data.bio.trim() || null,
        phone: data.phone.trim() || null,
        avatarUrl,
      });

      navigate('/home', { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="setup-profile">
      <div className="setup-profile__hero">
        <h1>Set up your profile</h1>
        <p>Like WhatsApp — add a photo, name, and username</p>
      </div>

      <form className="setup-profile__card" onSubmit={handleSubmit(onSubmit)}>
        <label className="setup-profile__avatar-upload">
          <UserAvatar
            name={displayName || 'U'}
            avatarUrl={avatarPreview}
            size="xl"
          />
          <span>Add photo</span>
          <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </label>

        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          className="setup-profile__input"
          placeholder="Your name"
          {...register('displayName', { maxLength: 50 })}
        />

        <label htmlFor="username">Username (unique)</label>
        <input
          id="username"
          className="setup-profile__input"
          placeholder="your_username"
          maxLength={USERNAME_MAX_LENGTH}
          {...register('username', {
            required: 'Username is required',
            minLength: { value: USERNAME_MIN_LENGTH, message: `Min ${USERNAME_MIN_LENGTH} chars` },
            pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only' },
          })}
        />
        {errors.username && <p className="setup-profile__error">{errors.username.message}</p>}

        <label htmlFor="bio">About</label>
        <textarea
          id="bio"
          className="setup-profile__input setup-profile__textarea"
          placeholder="Tell others about yourself..."
          rows={3}
          {...register('bio', { maxLength: 200 })}
        />

        <label htmlFor="phone">Phone (optional)</label>
        <input
          id="phone"
          className="setup-profile__input"
          placeholder="+1 234 567 8900"
          {...register('phone', { maxLength: 20 })}
        />

        {submitError && <p className="setup-profile__error">{submitError}</p>}

        <button type="submit" className="setup-profile__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating profile...' : 'Continue to Chat'}
        </button>
      </form>
    </div>
  );
};
