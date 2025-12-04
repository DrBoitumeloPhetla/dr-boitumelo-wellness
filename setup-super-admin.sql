-- Setup Super Admin Account (DrBBPhetla)
-- Run this in your Supabase SQL Editor

-- First, check if DrBBPhetla exists
SELECT id, username, email, role, is_active FROM admin_users WHERE username = 'DrBBPhetla';

-- If the account doesn't exist or needs to be reset, run this:
-- (Replace 'YourPasswordHere' with your actual password)

-- DELETE the old account if it exists (optional)
-- DELETE FROM admin_users WHERE username = 'DrBBPhetla';

-- INSERT the DrBBPhetla account with super_admin role
-- Password: DrBB2024! (you can change this)
INSERT INTO admin_users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
  'DrBBPhetla',
  'drboitumelo@wellness.co.za',
  crypt('DrBB2024!', gen_salt('bf')),
  'Dr. Boitumelo Phetla',
  'super_admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username)
DO UPDATE SET
  password_hash = crypt('DrBB2024!', gen_salt('bf')),
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();

-- Verify the account was created/updated
SELECT id, username, email, role, is_active FROM admin_users WHERE username = 'DrBBPhetla';
