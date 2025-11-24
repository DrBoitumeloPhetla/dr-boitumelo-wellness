-- Create admin_users table for storing admin credentials
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can view admin_users
CREATE POLICY "Authenticated users can view admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can update their own record
CREATE POLICY "Admins can update own record"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_admin_users_timestamp ON public.admin_users;
CREATE TRIGGER update_admin_users_timestamp
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Insert the main admin user
-- Password: WellnessDrBBPhetla
-- This uses bcrypt hash with 10 rounds
INSERT INTO public.admin_users (username, email, password_hash, full_name, role, is_active)
VALUES (
  'DrBBPhetla',
  'admin@drboitumelowellness.co.za',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- WellnessDrBBPhetla
  'Dr. Boitumelo Phetla',
  'super_admin',
  true
)
ON CONFLICT (username) DO NOTHING;

-- Create function for admin login verification
CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username VARCHAR,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  username VARCHAR,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  message TEXT
) AS $$
DECLARE
  v_user_record RECORD;
  v_password_match BOOLEAN;
BEGIN
  -- Get user record
  SELECT *
  INTO v_user_record
  FROM public.admin_users
  WHERE admin_users.username = p_username
    AND is_active = true;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, 'Invalid username or password'::TEXT;
    RETURN;
  END IF;

  -- Verify password using crypt
  v_password_match := (v_user_record.password_hash = crypt(p_password, v_user_record.password_hash));

  IF v_password_match THEN
    -- Update last login
    UPDATE public.admin_users
    SET last_login = NOW()
    WHERE id = v_user_record.id;

    -- Return success
    RETURN QUERY SELECT
      true,
      v_user_record.id,
      v_user_record.username,
      v_user_record.email,
      v_user_record.full_name,
      v_user_record.role,
      'Login successful'::TEXT;
  ELSE
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, 'Invalid username or password'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION verify_admin_login TO anon, authenticated;
