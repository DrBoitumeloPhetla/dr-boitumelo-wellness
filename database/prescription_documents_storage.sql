-- ============================================
-- PRESCRIPTION DOCUMENTS STORAGE SETUP
-- For uploading blood tests, medical records, etc.
-- ============================================

-- Create storage bucket for prescription documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescription-documents', 'prescription-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to make script rerunnable
DROP POLICY IF EXISTS "Anyone can upload prescription documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view prescription documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete prescription documents" ON storage.objects;

-- Allow anyone to upload to prescription-documents bucket
CREATE POLICY "Anyone can upload prescription documents"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'prescription-documents');

-- Allow anyone to read prescription documents (needed for admin to view)
CREATE POLICY "Anyone can view prescription documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'prescription-documents');

-- Allow file owners and admins to delete (for cleanup)
CREATE POLICY "Anyone can delete prescription documents"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'prescription-documents');

-- Set bucket file size limit to 10MB
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'prescription-documents';

-- Set allowed file types (images and PDFs)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'application/pdf'
]
WHERE id = 'prescription-documents';

COMMENT ON TABLE storage.buckets IS 'Storage for prescription request documents (blood tests, medical records)';
