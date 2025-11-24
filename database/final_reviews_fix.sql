-- =====================================================
-- FINAL FIX - ALLOW ANONYMOUS REVIEW SUBMISSIONS
-- =====================================================
-- This allows customers (anonymous users) to submit reviews
-- which then need admin approval before showing publicly

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.reviews;

-- Create a new policy that explicitly allows anonymous (anon) role to insert
CREATE POLICY "Anonymous users can submit reviews"
ON public.reviews
FOR INSERT
TO anon
WITH CHECK (true);

-- Also ensure authenticated users (admins) can insert
CREATE POLICY "Authenticated users can submit reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify the SELECT policy only shows approved reviews to public
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
ON public.reviews
FOR SELECT
TO anon
USING (status = 'approved');

-- Ensure admins can see all reviews
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- Admins can update reviews (for approval/rejection)
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
CREATE POLICY "Admins can update reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Admins can delete reviews
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (true);
