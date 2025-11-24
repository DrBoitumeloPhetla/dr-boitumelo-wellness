-- Check if admin user exists and verify the setup
SELECT
  id,
  username,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM public.admin_users
WHERE username = 'DrBBPhetla';

-- If the query above returns no rows, run this to insert the admin user:
-- INSERT INTO public.admin_users (username, email, password_hash, full_name, role, is_active)
-- VALUES (
--   'DrBBPhetla',
--   'admin@drboitumelowellness.co.za',
--   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
--   'Dr. Boitumelo Phetla',
--   'super_admin',
--   true
-- )
-- ON CONFLICT (username) DO NOTHING;
