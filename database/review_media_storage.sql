-- =====================================================
-- REVIEW MEDIA STORAGE SETUP
-- Creates storage bucket and policies for review media (images and videos)
-- =====================================================

-- Create storage bucket for review media
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can upload review media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view review media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete review media" ON storage.objects;

-- Allow anyone to upload to review-media bucket (admin will use this)
CREATE POLICY "Anyone can upload review media"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'review-media');

-- Allow anyone to view review media (public bucket)
CREATE POLICY "Anyone can view review media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'review-media');

-- Allow anyone to delete from review-media bucket (admin will use this)
CREATE POLICY "Admins can delete review media"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'review-media');

-- Add media columns to reviews table (if not already added)
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', NULL)),
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Add index on media_type for filtering
CREATE INDEX IF NOT EXISTS idx_reviews_media_type ON public.reviews(media_type);

-- Add comments
COMMENT ON COLUMN public.reviews.media_type IS 'Type of media uploaded: image or video';
COMMENT ON COLUMN public.reviews.media_url IS 'Public URL of the uploaded media from Supabase Storage';
