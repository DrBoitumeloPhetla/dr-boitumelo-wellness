-- ============================================
-- PRESCRIPTION REQUEST SYSTEM
-- For high-dose products requiring medical approval
-- ============================================

-- Step 1: Add requires_prescription column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS requires_prescription BOOLEAN DEFAULT FALSE;

-- Step 2: Create prescription_requests table
CREATE TABLE IF NOT EXISTS prescription_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  health_info TEXT,
  blood_test_file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  unique_code TEXT UNIQUE NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prescription_requests_unique_code ON prescription_requests(unique_code);
CREATE INDEX IF NOT EXISTS idx_prescription_requests_status ON prescription_requests(status);
CREATE INDEX IF NOT EXISTS idx_prescription_requests_customer_email ON prescription_requests(customer_email);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE prescription_requests ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Drop existing policies if they exist to make script rerunnable
DROP POLICY IF EXISTS "Anyone can create prescription requests" ON prescription_requests;
DROP POLICY IF EXISTS "Users can view their own prescription requests" ON prescription_requests;
DROP POLICY IF EXISTS "Anyone can view by unique code" ON prescription_requests;
DROP POLICY IF EXISTS "Anyone can update prescription requests" ON prescription_requests;

-- Allow anyone to create a prescription request (insert)
CREATE POLICY "Anyone can create prescription requests"
  ON prescription_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to read their own prescription requests by email
CREATE POLICY "Users can view their own prescription requests"
  ON prescription_requests
  FOR SELECT
  TO public
  USING (true); -- Allow all reads for now (admin will filter in app)

-- Allow anyone to view requests by unique code (for purchase links)
CREATE POLICY "Anyone can view by unique code"
  ON prescription_requests
  FOR SELECT
  TO public
  USING (true);

-- Allow updates (for admin approval/denial)
CREATE POLICY "Anyone can update prescription requests"
  ON prescription_requests
  FOR UPDATE
  TO public
  USING (true);

-- Step 6: Create function to generate unique codes
CREATE OR REPLACE FUNCTION generate_prescription_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RX-' || substr(md5(random()::text), 1, 12) || '-' || extract(epoch from now())::bigint;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to auto-generate unique codes
CREATE OR REPLACE FUNCTION set_prescription_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unique_code IS NULL OR NEW.unique_code = '' THEN
    NEW.unique_code := generate_prescription_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_prescription_code ON prescription_requests;
CREATE TRIGGER trigger_set_prescription_code
  BEFORE INSERT ON prescription_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_prescription_code();

-- Step 8: Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_prescription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prescription_timestamp ON prescription_requests;
CREATE TRIGGER trigger_update_prescription_timestamp
  BEFORE UPDATE ON prescription_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_prescription_timestamp();

-- Step 9: Update Platinum Package to require prescription
-- Note: Run this after verifying the product exists
-- UPDATE products SET requires_prescription = TRUE WHERE name ILIKE '%platinum%';

COMMENT ON TABLE prescription_requests IS 'Stores requests for prescription-required products (e.g., high-dose Vitamin D3)';
COMMENT ON COLUMN products.requires_prescription IS 'Whether this product requires doctor approval before purchase';
