-- Real-Time Chat Application Schema
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (username is the public identity on the platform)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  socket_id TEXT,
  online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Direct messages between two usernames
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  recipient_username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users (auth_id);
CREATE INDEX IF NOT EXISTS idx_users_online ON users (online) WHERE online = true;
CREATE INDEX IF NOT EXISTS idx_users_socket_id ON users (socket_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages (username, recipient_username);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages (recipient_username);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages;
CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on messages"
  ON messages FOR ALL
  USING (true)
  WITH CHECK (true);
