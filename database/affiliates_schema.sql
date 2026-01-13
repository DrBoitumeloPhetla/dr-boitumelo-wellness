-- ============================================
-- AFFILIATES TABLE AND ORDERS TABLE UPDATES
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Create the affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  coupon_code VARCHAR(50) UNIQUE NOT NULL,  -- e.g., DRBOIT001
  discount_percentage DECIMAL(5,2) DEFAULT 10.00,
  commission_percentage DECIMAL(5,2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT true,
  total_sales DECIMAL(10,2) DEFAULT 0.00,
  total_orders INTEGER DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security on affiliates table
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for affiliates table
-- Allow authenticated users (admin) to read all affiliates
CREATE POLICY "Enable read for authenticated" ON affiliates
  FOR SELECT TO authenticated USING (true);

-- Allow service role full access
CREATE POLICY "Enable all for service role" ON affiliates
  FOR ALL TO service_role USING (true);

-- Allow anonymous users to read active affiliates (for coupon validation at checkout)
CREATE POLICY "Enable public read for active affiliates" ON affiliates
  FOR SELECT TO anon USING (is_active = true);

-- Allow authenticated users to insert/update/delete (admin operations)
CREATE POLICY "Enable insert for authenticated" ON affiliates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated" ON affiliates
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated" ON affiliates
  FOR DELETE TO authenticated USING (true);

-- 4. Add new columns to orders table for affiliate tracking
-- (These will be NULL for orders without coupons, which is fine)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping DECIMAL(10,2);

-- 5. Create index on coupon_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliates_coupon_code ON affiliates(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);

-- 6. Create updated_at trigger for affiliates table
CREATE OR REPLACE FUNCTION update_affiliates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliates_updated_at();

-- ============================================
-- VERIFICATION QUERIES (run after creating tables)
-- ============================================

-- Check if affiliates table was created
-- SELECT * FROM affiliates LIMIT 1;

-- Check if orders table has new columns
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name IN ('coupon_code', 'discount_amount', 'affiliate_id', 'subtotal', 'shipping');

-- ============================================
-- SAMPLE DATA (optional - for testing)
-- ============================================

-- INSERT INTO affiliates (name, email, phone, coupon_code, notes) VALUES
-- ('Test Affiliate', 'test@example.com', '0821234567', 'DRBOIT001', 'Test affiliate for development');
