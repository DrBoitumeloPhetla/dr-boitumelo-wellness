-- Admin Authentication System Setup
-- This creates a secure admin users table with password hashing

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authentication
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- We'll use bcrypt hashing

  -- Profile
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin', -- 'admin', 'super_admin', 'staff'

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,

  -- Password reset
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_reset_token ON admin_users(reset_token);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies (admins can read their own data)
DROP POLICY IF EXISTS "Admins can read own data" ON admin_users;
CREATE POLICY "Admins can read own data" ON admin_users
  FOR SELECT
  USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Admins can update own data" ON admin_users;
CREATE POLICY "Admins can update own data" ON admin_users
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- For login/signup, we'll use public access with service role
DROP POLICY IF EXISTS "Enable read for authentication" ON admin_users;
CREATE POLICY "Enable read for authentication" ON admin_users
  FOR SELECT
  USING (true);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS admin_users_updated_at ON admin_users;
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Function to verify admin login
CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  admin_id UUID,
  admin_username TEXT,
  admin_email TEXT,
  admin_full_name TEXT,
  admin_role TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_admin admin_users%ROWTYPE;
  v_password_match BOOLEAN;
BEGIN
  -- Find admin by username
  SELECT * INTO v_admin
  FROM admin_users
  WHERE username = p_username AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Invalid username or password'::TEXT;
    RETURN;
  END IF;

  -- Verify password using pgcrypto extension
  -- Note: You'll need to enable pgcrypto extension first
  SELECT crypt(p_password, v_admin.password_hash) = v_admin.password_hash INTO v_password_match;

  IF NOT v_password_match THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Invalid username or password'::TEXT;
    RETURN;
  END IF;

  -- Update last login
  UPDATE admin_users
  SET last_login_at = NOW()
  WHERE id = v_admin.id;

  -- Return success
  RETURN QUERY SELECT
    true,
    v_admin.id,
    v_admin.username,
    v_admin.email,
    v_admin.full_name,
    v_admin.role,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin user with hashed password
CREATE OR REPLACE FUNCTION create_admin_user(
  p_username TEXT,
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT DEFAULT 'admin'
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_password_hash TEXT;
BEGIN
  -- Hash password using pgcrypto
  SELECT crypt(p_password, gen_salt('bf')) INTO v_password_hash;

  -- Insert admin user
  INSERT INTO admin_users (username, email, password_hash, full_name, role)
  VALUES (p_username, p_email, v_password_hash, p_full_name, p_role)
  RETURNING id INTO v_admin_id;

  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initiate password reset
CREATE OR REPLACE FUNCTION initiate_password_reset(p_email TEXT)
RETURNS TABLE(
  success BOOLEAN,
  reset_token TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_admin admin_users%ROWTYPE;
  v_reset_token TEXT;
BEGIN
  -- Find admin by email
  SELECT * INTO v_admin
  FROM admin_users
  WHERE email = p_email AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'No account found with that email'::TEXT;
    RETURN;
  END IF;

  -- Generate reset token (random string)
  v_reset_token := encode(gen_random_bytes(32), 'hex');

  -- Update admin with reset token (expires in 1 hour)
  UPDATE admin_users
  SET
    reset_token = v_reset_token,
    reset_token_expires_at = NOW() + INTERVAL '1 hour'
  WHERE id = v_admin.id;

  RETURN QUERY SELECT true, v_reset_token, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset password with token
CREATE OR REPLACE FUNCTION reset_password_with_token(
  p_reset_token TEXT,
  p_new_password TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_admin admin_users%ROWTYPE;
  v_password_hash TEXT;
BEGIN
  -- Find admin by reset token
  SELECT * INTO v_admin
  FROM admin_users
  WHERE reset_token = p_reset_token
    AND reset_token_expires_at > NOW()
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or expired reset token'::TEXT;
    RETURN;
  END IF;

  -- Hash new password
  SELECT crypt(p_new_password, gen_salt('bf')) INTO v_password_hash;

  -- Update password and clear reset token
  UPDATE admin_users
  SET
    password_hash = v_password_hash,
    reset_token = NULL,
    reset_token_expires_at = NULL
  WHERE id = v_admin.id;

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Grant permissions
GRANT ALL ON admin_users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_admin_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION initiate_password_reset TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_password_with_token TO anon, authenticated;

-- Create your first admin user (CHANGE THESE CREDENTIALS!)
-- This creates: username: admin, password: ChangeMe123!
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Check if any admin exists
  IF NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1) THEN
    SELECT create_admin_user(
      'admin',
      'admin@drboitumelowellness.co.za',
      'ChangeMe123!',
      'Dr. Boitumelo',
      'super_admin'
    ) INTO v_admin_id;

    RAISE NOTICE '✅ Default admin user created!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Change these credentials immediately!';
    RAISE NOTICE 'Username: admin';
    RAISE NOTICE 'Password: ChangeMe123!';
    RAISE NOTICE 'Email: admin@drboitumelowellness.co.za';
    RAISE NOTICE '';
    RAISE NOTICE 'Login to admin panel and change your password right away!';
  ELSE
    RAISE NOTICE '✅ Admin users table exists, skipping default user creation';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Admin authentication system created successfully!';
  RAISE NOTICE '✅ Password hashing enabled (bcrypt)';
  RAISE NOTICE '✅ Password reset functionality added';
  RAISE NOTICE '✅ Secure login function created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Login with the default credentials';
  RAISE NOTICE '2. Change your password immediately';
  RAISE NOTICE '3. Update your email address';
  RAISE NOTICE '4. The frontend code will be updated to use this secure system';
END $$;
