-- ============================================
-- ADD DELETE POLICIES
-- For prescription requests and contacts
-- ============================================

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Anyone can delete prescription requests" ON prescription_requests;

-- Allow anyone to delete prescription requests
CREATE POLICY "Anyone can delete prescription requests"
  ON prescription_requests
  FOR DELETE
  TO public
  USING (true);

-- Also check if contacts table needs delete policy
DROP POLICY IF EXISTS "Anyone can delete contacts" ON contacts;

-- Allow anyone to delete contacts
CREATE POLICY "Anyone can delete contacts"
  ON contacts
  FOR DELETE
  TO public
  USING (true);
