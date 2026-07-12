import { supabase } from './supabase';

export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
};

export const uploadChatMedia = async (
  file: File,
  userId: string
): Promise<{ url: string; type: 'image' | 'video' }> => {
  const isVideo = file.type.startsWith('video/');
  const bucket = 'chat-media';
  const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, type: isVideo ? 'video' : 'image' };
};
