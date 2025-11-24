-- =====================================================
-- MAKE REVIEW_TEXT OPTIONAL
-- =====================================================
-- Only name, email, and rating are required
-- Everything else is optional

ALTER TABLE public.reviews
ALTER COLUMN review_text DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'reviews'
AND column_name IN ('name', 'email', 'rating', 'review_text', 'condition', 'title', 'product_name', 'role');
