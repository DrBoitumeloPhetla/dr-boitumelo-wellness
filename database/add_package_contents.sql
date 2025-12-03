-- =====================================================
-- ADD PACKAGE CONTENTS TO PRODUCTS
-- =====================================================

-- Add package_contents column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS package_contents TEXT;

-- Add comment to column
COMMENT ON COLUMN public.products.package_contents IS 'What is included in the package (ingredients list), separated by commas or line breaks';

-- Verify the change
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'package_contents';
