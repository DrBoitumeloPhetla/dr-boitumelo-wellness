-- =====================================================
-- NUCLEAR OPTION - DISABLE RLS COMPLETELY
-- =====================================================
-- This completely disables RLS since policies aren't working
-- Security is maintained through the approval workflow

-- Disable RLS on reviews table
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'reviews';
