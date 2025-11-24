-- =====================================================
-- ULTIMATE FIX - COMPLETE RESET OF REVIEWS PERMISSIONS
-- =====================================================

-- Step 1: DISABLE RLS completely (temporarily)
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'reviews' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.reviews';
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ONE simple policy for INSERT that allows EVERYONE
CREATE POLICY "allow_all_inserts"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Step 5: Create ONE simple policy for SELECT for approved reviews
CREATE POLICY "allow_select_approved"
ON public.reviews
FOR SELECT
USING (status = 'approved' OR auth.role() = 'authenticated');

-- Step 6: Create policies for UPDATE and DELETE (authenticated only)
CREATE POLICY "allow_authenticated_update"
ON public.reviews
FOR UPDATE
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_authenticated_delete"
ON public.reviews
FOR DELETE
TO authenticated
USING (true);

-- Step 7: Grant explicit permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT UPDATE, DELETE ON public.reviews TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify the policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'reviews';
