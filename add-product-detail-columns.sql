-- Add detailed product information columns to the products table

-- Add composition column (stores ingredient details)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS composition TEXT;

-- Add uses column (stores health benefits and uses)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS uses TEXT;

-- Add usage column (stores dosage and usage instructions)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS usage TEXT;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('composition', 'uses', 'usage');
