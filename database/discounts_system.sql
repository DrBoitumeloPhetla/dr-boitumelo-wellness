-- =====================================================
-- DISCOUNTS AND SALES SYSTEM
-- =====================================================
-- Create table for managing product discounts and sales

CREATE TABLE IF NOT EXISTS public.discounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basic Information
  name VARCHAR(255) NOT NULL, -- e.g., "Black Friday Sale"
  description TEXT,

  -- Discount Type and Value
  discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')),
  discount_value DECIMAL(10, 2), -- For percentage (e.g., 50 for 50%) or fixed amount (e.g., 50 for R50 off)

  -- Buy X Get Y specific fields
  buy_quantity INTEGER, -- Buy this many
  get_quantity INTEGER, -- Get this many free

  -- Minimum requirements
  min_purchase_amount DECIMAL(10, 2), -- Minimum cart value required
  min_quantity INTEGER, -- Minimum quantity required

  -- Applicability
  apply_to VARCHAR(50) DEFAULT 'all' CHECK (apply_to IN ('all', 'specific')), -- Apply to all products or specific ones
  product_ids TEXT[], -- Array of product IDs if apply_to = 'specific'

  -- Schedule
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  max_uses INTEGER, -- NULL = unlimited

  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discounts_active ON public.discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_discounts_dates ON public.discounts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_discounts_type ON public.discounts(discount_type);

-- Enable Row Level Security
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active discounts
CREATE POLICY "Public can view active discounts"
ON public.discounts
FOR SELECT
TO public
USING (is_active = true AND NOW() BETWEEN start_date AND end_date);

-- Policy: Authenticated users can view all discounts
CREATE POLICY "Authenticated users can view all discounts"
ON public.discounts
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can create discounts
CREATE POLICY "Authenticated users can create discounts"
ON public.discounts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update discounts
CREATE POLICY "Authenticated users can update discounts"
ON public.discounts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can delete discounts
CREATE POLICY "Authenticated users can delete discounts"
ON public.discounts
FOR DELETE
TO authenticated
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_discounts_timestamp ON public.discounts;
CREATE TRIGGER update_discounts_timestamp
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- Create function to get active discounts for a product
CREATE OR REPLACE FUNCTION get_active_discounts_for_product(product_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  description TEXT,
  discount_type VARCHAR,
  discount_value DECIMAL,
  buy_quantity INTEGER,
  get_quantity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.description,
    d.discount_type,
    d.discount_value,
    d.buy_quantity,
    d.get_quantity
  FROM public.discounts d
  WHERE d.is_active = true
    AND NOW() BETWEEN d.start_date AND d.end_date
    AND (
      d.apply_to = 'all'
      OR (d.apply_to = 'specific' AND product_id::text = ANY(d.product_ids))
    )
  ORDER BY d.discount_value DESC
  LIMIT 1; -- Return the best discount
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_discounts_for_product TO anon, authenticated;

-- Create function to calculate discount for a product
CREATE OR REPLACE FUNCTION calculate_product_discount(
  product_price DECIMAL,
  product_id UUID,
  quantity INTEGER DEFAULT 1
)
RETURNS TABLE (
  discount_name VARCHAR,
  discount_amount DECIMAL,
  final_price DECIMAL
) AS $$
DECLARE
  v_discount RECORD;
  v_discount_amount DECIMAL := 0;
  v_final_price DECIMAL;
BEGIN
  -- Get the active discount for this product
  SELECT * INTO v_discount
  FROM get_active_discounts_for_product(product_id)
  LIMIT 1;

  IF v_discount IS NULL THEN
    -- No discount
    RETURN QUERY SELECT NULL::VARCHAR, 0::DECIMAL, product_price;
    RETURN;
  END IF;

  -- Calculate discount based on type
  CASE v_discount.discount_type
    WHEN 'percentage' THEN
      v_discount_amount := product_price * (v_discount.discount_value / 100);
      v_final_price := product_price - v_discount_amount;

    WHEN 'fixed_amount' THEN
      v_discount_amount := v_discount.discount_value;
      v_final_price := GREATEST(product_price - v_discount_amount, 0);

    WHEN 'buy_x_get_y' THEN
      -- Calculate how many free items customer gets
      IF quantity >= v_discount.buy_quantity THEN
        DECLARE
          free_items INTEGER := (quantity / v_discount.buy_quantity) * v_discount.get_quantity;
          total_items INTEGER := quantity + free_items;
        BEGIN
          v_discount_amount := (free_items::DECIMAL / total_items) * (product_price * quantity);
          v_final_price := product_price * quantity - v_discount_amount;
        END;
      ELSE
        v_final_price := product_price;
      END IF;

    ELSE
      v_final_price := product_price;
  END CASE;

  RETURN QUERY SELECT v_discount.name, v_discount_amount, v_final_price;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_product_discount TO anon, authenticated;
