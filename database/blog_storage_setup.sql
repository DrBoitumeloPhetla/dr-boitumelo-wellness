-- =====================================================
-- SUPABASE STORAGE BUCKET SETUP FOR BLOG IMAGES
-- =====================================================

-- This SQL creates a storage bucket for blog article images
-- Run this in your Supabase SQL Editor

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for blog-images bucket

-- Policy 1: Allow public to view blog images
CREATE POLICY "Public can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

-- Policy 2: Allow authenticated users (admins) to upload blog images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- Policy 3: Allow authenticated users (admins) to update blog images
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- Policy 4: Allow authenticated users (admins) to delete blog images
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
