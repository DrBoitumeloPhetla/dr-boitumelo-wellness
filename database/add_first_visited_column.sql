-- ============================================
-- ADD FIRST_VISITED_AT COLUMN
-- For tracking when customer first opens approval link
-- ============================================

-- Add first_visited_at column if it doesn't exist
ALTER TABLE prescription_requests
ADD COLUMN IF NOT EXISTS first_visited_at TIMESTAMP WITH TIME ZONE;

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'prescription_requests'
AND column_name = 'first_visited_at';

COMMENT ON COLUMN prescription_requests.first_visited_at IS 'Timestamp when customer first opened the approval link (starts 24-hour purchase window)';
