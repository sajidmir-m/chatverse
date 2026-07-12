-- Profile + media messages migration
-- Run in Supabase SQL Editor

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Storage buckets (run once)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Auth users upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Auth users upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Public read chat media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-media');
