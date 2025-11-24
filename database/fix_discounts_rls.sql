-- =====================================================
-- FIX DISCOUNTS RLS POLICIES
-- =====================================================

-- Disable RLS temporarily to test
ALTER TABLE public.discounts DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'discounts';
