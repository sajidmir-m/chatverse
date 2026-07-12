-- Friends & friend requests
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_username TEXT NOT NULL,
  to_username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_username, to_username)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests (to_username, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests (from_username, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_pair ON friend_requests (from_username, to_username);

CREATE OR REPLACE FUNCTION update_friend_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_friend_requests_updated_at ON friend_requests;
CREATE TRIGGER trigger_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_friend_requests_updated_at();

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on friend_requests"
  ON friend_requests FOR ALL
  USING (true)
  WITH CHECK (true);
