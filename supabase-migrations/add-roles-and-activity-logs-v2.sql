-- Migration: Add role-based access control and activity logging (FIXED VERSION)
-- Date: 2025-12-04
-- Description: Adds role column to admin_users, creates activity_logs table, and inserts new staff users

-- Step 1: Drop existing role column if it exists (to avoid conflicts)
ALTER TABLE admin_users DROP COLUMN IF EXISTS role CASCADE;

-- Step 2: Add role column to admin_users table with proper constraint
ALTER TABLE admin_users
ADD COLUMN role VARCHAR(20) DEFAULT 'staff'
CHECK (role IN ('super_admin', 'staff'));

-- Step 3: Update existing DrBBPhetla user to super_admin
UPDATE admin_users
SET role = 'super_admin'
WHERE username = 'DrBBPhetla';

-- Step 4: Delete existing staff users if they exist (to avoid duplicate key errors)
DELETE FROM admin_users WHERE username IN ('Lerato', 'Potlako');

-- Step 5: Insert new staff users (Lerato and Potlako)
-- Replace the password hashes with your actual bcrypt hashes
INSERT INTO admin_users (username, password_hash, email, role, created_at)
VALUES
  ('Lerato', '$2a$10$YourHashedPasswordHere1', 'lerato@drboitumelowellness.co.za', 'staff', NOW()),
  ('Potlako', '$2a$10$YourHashedPasswordHere2', 'potlako@drboitumelowellness.co.za', 'staff', NOW());

-- Step 6: Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_username VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'create', 'update', 'delete', 'approve', 'reject', 'login', 'logout'
  )),
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN (
    'product', 'discount', 'order', 'prescription', 'appointment', 'blog', 'testimonial', 'client'
  )),
  resource_id VARCHAR(255),
  resource_name VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_user_id ON activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_username ON activity_logs(admin_username);

-- Step 8: Drop existing view if it exists
DROP VIEW IF EXISTS activity_logs_view;

-- Step 9: Create a view for easy activity log querying
CREATE VIEW activity_logs_view AS
SELECT
  al.id,
  al.admin_username,
  au.email as admin_email,
  au.role as admin_role,
  al.action_type,
  al.resource_type,
  al.resource_id,
  al.resource_name,
  al.details,
  al.ip_address,
  al.created_at
FROM activity_logs al
LEFT JOIN admin_users au ON al.admin_user_id = au.id
ORDER BY al.created_at DESC;

-- Step 10: Grant permissions (adjust based on your RLS policies)
GRANT SELECT ON activity_logs TO authenticated;
GRANT INSERT ON activity_logs TO authenticated;
GRANT SELECT ON activity_logs_view TO authenticated;

-- Step 11: Add comments for documentation
COMMENT ON TABLE activity_logs IS 'Tracks all admin user actions for audit trail and accountability';
COMMENT ON COLUMN activity_logs.admin_user_id IS 'Reference to admin user who performed the action';
COMMENT ON COLUMN activity_logs.admin_username IS 'Username stored for display, even if user is deleted';
COMMENT ON COLUMN activity_logs.action_type IS 'Type of action: create, update, delete, approve, reject, login, logout';
COMMENT ON COLUMN activity_logs.resource_type IS 'Type of resource affected: product, order, prescription, etc.';
COMMENT ON COLUMN activity_logs.details IS 'JSON object with before/after values or additional context';

-- Step 12: Verify the migration worked
SELECT 'Migration completed successfully!' as status;
SELECT username, role, email FROM admin_users ORDER BY role DESC, username;
