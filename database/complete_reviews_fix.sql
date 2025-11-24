-- =====================================================
-- COMPLETE FIX FOR REVIEWS TABLE AND STORAGE
-- =====================================================

-- STEP 1: Temporarily disable RLS to clean up
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;

-- STEP 3: Re-enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create fresh policies with correct syntax
CREATE POLICY "Anyone can submit reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can view approved reviews"
ON public.reviews
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can update reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (true);

-- STEP 5: Verify the table structure has media columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='reviews' AND column_name='media_type') THEN
        ALTER TABLE public.reviews ADD COLUMN media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', NULL));
        ALTER TABLE public.reviews ADD COLUMN media_url TEXT;
    END IF;
END $$;
