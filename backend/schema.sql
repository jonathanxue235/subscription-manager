-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Create users table for custom authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  location TEXT,
  primary_curr TEXT,
  username TEXT,
  monthly_budget NUMERIC(10, 2)
);

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add columns if they don't exist (for existing databases)
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_curr TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(10, 2);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  frequency TEXT NOT NULL,
  custom_frequency_days INT,
  start_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  cost NUMERIC(10, 2) NOT NULL,
  logo TEXT,
  card_issuer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing databases)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_frequency_days INT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS card_issuer TEXT;

-- Add index for faster user subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date ON subscriptions(renewal_date);

-- Add trigger for subscriptions updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE HELPER FUNCTION TO EXTRACT USER ID FROM JWT
-- =====================================================

-- This function extracts the userId from your custom JWT
-- The JWT is passed in the Authorization header by your backend
-- NOTE: Using public schema since we can't modify the auth schema
CREATE OR REPLACE FUNCTION public.get_current_user_id() RETURNS UUID AS $$
  SELECT COALESCE(
    -- Try to get userId from JWT claims (your custom auth)
    (current_setting('request.jwt.claims', true)::json->>'userId')::uuid,
    -- Fallback to null if not authenticated
    NULL
  );
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- 3. USERS TABLE POLICIES
-- =====================================================

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (id = public.get_current_user_id());

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (id = public.get_current_user_id())
  WITH CHECK (id = public.get_current_user_id());

-- Allow user creation during registration (no auth required)
-- This is needed for the signup endpoint
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Prevent users from deleting their own accounts via direct DB access
-- (Use a backend endpoint if you want to support account deletion)
CREATE POLICY "Prevent user deletion"
  ON users
  FOR DELETE
  USING (false);

-- =====================================================
-- 4. SUBSCRIPTIONS TABLE POLICIES
-- =====================================================

-- Users can only view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (user_id = public.get_current_user_id());

-- Users can only create subscriptions for themselves
CREATE POLICY "Users can create own subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK (user_id = public.get_current_user_id());

-- Users can only update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (user_id = public.get_current_user_id())
  WITH CHECK (user_id = public.get_current_user_id());

-- Users can only delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions
  FOR DELETE
  USING (user_id = public.get_current_user_id());
