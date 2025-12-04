-- Fix verify_admin_login function to include role column
-- Date: 2025-12-04
-- This updates the function to return the role field

CREATE OR REPLACE FUNCTION verify_admin_login(p_username VARCHAR, p_password VARCHAR)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  user_id UUID,
  username VARCHAR,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR
) AS $$
DECLARE
  v_user RECORD;
  v_password_match BOOLEAN;
BEGIN
  -- Find the admin user by username
  SELECT id, admin_users.username, admin_users.email, password_hash, full_name, admin_users.role
  INTO v_user
  FROM admin_users
  WHERE admin_users.username = p_username AND active = true;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid username or password'::TEXT, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR;
    RETURN;
  END IF;

  -- Verify password using pgcrypto's crypt function
  -- The password_hash should be in bcrypt format ($2a$10$...)
  v_password_match := (v_user.password_hash = crypt(p_password, v_user.password_hash));

  IF v_password_match THEN
    -- Update last login timestamp
    UPDATE admin_users
    SET last_login = NOW()
    WHERE id = v_user.id;

    -- Return success with user details including role
    RETURN QUERY SELECT
      true,
      'Login successful'::TEXT,
      v_user.id,
      v_user.username,
      v_user.email,
      v_user.full_name,
      v_user.role;
  ELSE
    RETURN QUERY SELECT false, 'Invalid username or password'::TEXT, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_admin_login(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_login(VARCHAR, VARCHAR) TO anon;

-- Test the function (optional - you can comment this out if you want)
-- SELECT * FROM verify_admin_login('DrBBPhetla', 'your_password_here');
