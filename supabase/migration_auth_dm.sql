-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Fixes: "column users.auth_id does not exist"

-- 1. Add auth columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Link auth_id to Supabase Auth users (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_auth_id_fkey
      FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_id_unique ON users (auth_id);

-- 3. Add direct-message support to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_username TEXT;

UPDATE messages
SET recipient_username = '__legacy_global__'
WHERE recipient_username IS NULL;

ALTER TABLE messages
  ALTER COLUMN recipient_username SET NOT NULL;

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users (auth_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages (username, recipient_username);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages (recipient_username);
