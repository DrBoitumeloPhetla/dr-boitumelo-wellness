-- =====================================================
-- RE-ENABLE RLS WITH PROPER GRANTS
-- =====================================================
-- This re-enables RLS after confirming the feature works
-- Uses explicit GRANT statements for both anon and authenticated roles

-- Step 1: Re-enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 2: Ensure explicit permissions are granted first
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT UPDATE, DELETE ON public.reviews TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 3: Create policies (they should already exist from ULTIMATE_FIX.sql)
-- But we'll recreate them to be safe

DROP POLICY IF EXISTS "allow_all_inserts" ON public.reviews;
CREATE POLICY "allow_all_inserts"
ON public.reviews
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_select_approved" ON public.reviews;
CREATE POLICY "allow_select_approved"
ON public.reviews
FOR SELECT
USING (status = 'approved' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "allow_authenticated_update" ON public.reviews;
CREATE POLICY "allow_authenticated_update"
ON public.reviews
FOR UPDATE
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_authenticated_delete" ON public.reviews;
CREATE POLICY "allow_authenticated_delete"
ON public.reviews
FOR DELETE
TO authenticated
USING (true);

-- Step 4: Verify the setup
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'reviews';
