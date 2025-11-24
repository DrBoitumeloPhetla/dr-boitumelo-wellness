-- =====================================================
-- ADD SHIPPING COST TO PRODUCTS
-- =====================================================

-- Add shipping_cost column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0;

-- Update existing products with default shipping cost
UPDATE public.products
SET shipping_cost = 0
WHERE shipping_cost IS NULL;

-- Add comment to column
COMMENT ON COLUMN public.products.shipping_cost IS 'Shipping cost for this product in ZAR';

-- Verify the change
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'shipping_cost';
