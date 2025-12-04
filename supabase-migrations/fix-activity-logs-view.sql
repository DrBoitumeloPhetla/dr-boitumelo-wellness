-- Create activity_logs_view for easier querying
-- Date: 2025-12-04
-- This creates a view that can be queried from the Activity Logs page

-- First, drop the view if it exists
DROP VIEW IF EXISTS activity_logs_view CASCADE;

-- Create the view
CREATE VIEW activity_logs_view AS
SELECT
  id,
  admin_user_id,
  admin_username,
  action_type,
  resource_type,
  resource_id,
  resource_name,
  details,
  ip_address,
  user_agent,
  created_at
FROM activity_logs
ORDER BY created_at DESC;

-- Grant select permission on the view
GRANT SELECT ON activity_logs_view TO authenticated;
GRANT SELECT ON activity_logs_view TO anon;
