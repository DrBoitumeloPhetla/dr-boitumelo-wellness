-- =====================================================
-- REVIEW MEDIA STORAGE SETUP (SIMPLIFIED)
-- Creates storage bucket and adds media columns to reviews
-- =====================================================

-- Add media columns to reviews table (if not already added)
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', NULL)),
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Add index on media_type for filtering
CREATE INDEX IF NOT EXISTS idx_reviews_media_type ON public.reviews(media_type);

-- Add comments
COMMENT ON COLUMN public.reviews.media_type IS 'Type of media uploaded: image or video';
COMMENT ON COLUMN public.reviews.media_url IS 'Public URL of the uploaded media from Supabase Storage';
