-- =====================================================
-- FIX REVIEWS TABLE POLICIES
-- =====================================================
-- This fixes the RLS policies after adding media columns

-- Drop existing INSERT policy and recreate it
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.reviews;

-- Recreate the INSERT policy to allow anyone to submit reviews
CREATE POLICY "Anyone can submit reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (true);

-- Verify other policies are correct
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
  ON public.reviews
  FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
CREATE POLICY "Admins can view all reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
CREATE POLICY "Admins can update reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
CREATE POLICY "Admins can delete reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (true);
