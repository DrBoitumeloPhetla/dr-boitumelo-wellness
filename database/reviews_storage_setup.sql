-- =====================================================
-- SUPABASE STORAGE BUCKET SETUP FOR REVIEW MEDIA
-- =====================================================

-- This SQL creates a storage bucket for review images and videos
-- Run this in your Supabase SQL Editor

-- Create storage bucket for review media
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for review-media bucket

-- Policy 1: Allow public to view review media
DROP POLICY IF EXISTS "Public can view review media" ON storage.objects;
CREATE POLICY "Public can view review media"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-media');

-- Policy 2: Allow anyone to upload review media (same approach as blog-images for simplicity)
DROP POLICY IF EXISTS "Public can upload review media" ON storage.objects;
CREATE POLICY "Public can upload review media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-media');

-- Policy 3: Allow authenticated users (admins) to delete review media
DROP POLICY IF EXISTS "Authenticated users can delete review media" ON storage.objects;
CREATE POLICY "Authenticated users can delete review media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'review-media');
