-- =====================================================
-- FINAL RLS FIX - COMPREHENSIVE PERMISSIONS
-- =====================================================

-- Step 1: Verify RLS is enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "allow_all_inserts" ON public.reviews;
DROP POLICY IF EXISTS "allow_select_approved" ON public.reviews;
DROP POLICY IF EXISTS "allow_authenticated_update" ON public.reviews;
DROP POLICY IF EXISTS "allow_authenticated_delete" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anonymous users can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;

-- Step 3: Grant permissions at the schema and table level
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant ALL on the table to both roles
GRANT ALL ON public.reviews TO anon;
GRANT ALL ON public.reviews TO authenticated;

-- Grant sequence permissions for auto-increment IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 4: Create policies that allow everything (since we're using status field for approval)
CREATE POLICY "enable_insert_for_all"
ON public.reviews
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "enable_select_for_all"
ON public.reviews
FOR SELECT
TO public
USING (status = 'approved' OR auth.role() = 'authenticated');

CREATE POLICY "enable_update_for_authenticated"
ON public.reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "enable_delete_for_authenticated"
ON public.reviews
FOR DELETE
TO authenticated
USING (true);

-- Step 5: Verify the configuration
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'reviews';
