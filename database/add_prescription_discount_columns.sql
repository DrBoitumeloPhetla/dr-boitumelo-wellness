-- ============================================
-- ADD DISCOUNT COLUMNS TO PRESCRIPTION REQUESTS
-- Store discount info at time of request so it persists
-- ============================================

-- Add columns to store discount information
ALTER TABLE prescription_requests
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_type TEXT,
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_name TEXT;

COMMENT ON COLUMN prescription_requests.original_price IS 'Original product price at time of request';
COMMENT ON COLUMN prescription_requests.discounted_price IS 'Discounted price at time of request (null if no discount)';
COMMENT ON COLUMN prescription_requests.discount_type IS 'Type of discount applied: percentage or fixed_amount';
COMMENT ON COLUMN prescription_requests.discount_value IS 'Discount value (percentage number or fixed amount)';
COMMENT ON COLUMN prescription_requests.discount_name IS 'Name of the discount applied';
