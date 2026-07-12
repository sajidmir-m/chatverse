import React, { useState, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { uploadAvatar } from '../services/upload';
import './ProfilePage.css';

interface ProfileFormData {
  displayName: string;
  bio: string;
  phone: string;
}

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, authUserId, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<ProfileFormData>({
    defaultValues: {
      displayName: profile?.display_name || '',
      bio: profile?.bio || '',
      phone: profile?.phone || '',
    },
  });

  if (!profile) return null;

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: ProfileFormData): Promise<void> => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile && authUserId) {
        avatarUrl = await uploadAvatar(avatarFile, authUserId);
      }
      await updateProfile({
        displayName: data.displayName.trim(),
        bio: data.bio.trim() || null,
        phone: data.phone.trim() || null,
        avatarUrl,
      });
      setMessage('Profile updated!');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="profile-page">
      <header className="profile-page__header">
        <button type="button" onClick={() => navigate('/home')}>← Back</button>
        <h1>My Profile</h1>
        <button type="button" onClick={handleLogout}>Logout</button>
      </header>

      <form className="profile-page__card" onSubmit={handleSubmit(onSubmit)}>
        <label className="profile-page__avatar-upload">
          <UserAvatar
            name={profile.display_name || profile.username}
            avatarUrl={avatarPreview || profile.avatar_url}
            size="xl"
          />
          <span>Change photo</span>
          <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </label>

        <p className="profile-page__username">@{profile.username}</p>

        <label htmlFor="displayName">Display name</label>
        <input id="displayName" className="profile-page__input" {...register('displayName')} />

        <label htmlFor="bio">About</label>
        <textarea id="bio" className="profile-page__input" rows={3} {...register('bio')} />

        <label htmlFor="phone">Phone</label>
        <input id="phone" className="profile-page__input" {...register('phone')} />

        {message && <p className="profile-page__message">{message}</p>}

        <button type="submit" className="profile-page__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};
