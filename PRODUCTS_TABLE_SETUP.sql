-- Products Table Setup with Inventory Tracking
-- This table stores all products with stock levels and management features

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Product Information
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'supplements', 'wellness', 'skincare', 'books'

  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2), -- For showing discounts

  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  sku TEXT UNIQUE, -- Stock Keeping Unit

  -- Product Details
  image_url TEXT,
  benefits TEXT[], -- Array of benefits
  ingredients TEXT,
  usage_instructions TEXT,

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'out_of_stock', 'discontinued'
  featured BOOLEAN DEFAULT false,

  -- SEO
  slug TEXT UNIQUE, -- URL-friendly name

  -- Sales Tracking
  total_sold INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies (public can read active products)
DROP POLICY IF EXISTS "Enable read access for active products" ON products;
CREATE POLICY "Enable read access for active products" ON products
  FOR SELECT
  USING (status = 'active' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
CREATE POLICY "Enable insert for authenticated users" ON products
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
CREATE POLICY "Enable update for authenticated users" ON products
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;
CREATE POLICY "Enable delete for authenticated users" ON products
  FOR DELETE
  USING (true);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Function to update stock after order
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  -- Loop through items in the order
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    -- Update stock for each product
    UPDATE products
    SET
      stock_quantity = stock_quantity - (item->>'quantity')::INTEGER,
      total_sold = total_sold + (item->>'quantity')::INTEGER,
      status = CASE
        WHEN stock_quantity - (item->>'quantity')::INTEGER <= 0 THEN 'out_of_stock'
        ELSE status
      END
    WHERE name = item->>'name';
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock when order is created
DROP TRIGGER IF EXISTS update_stock_on_order ON orders;
CREATE TRIGGER update_stock_on_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_order();

-- Function to check low stock and return products below threshold
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  current_stock INTEGER,
  threshold INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    name,
    stock_quantity,
    low_stock_threshold,
    products.status
  FROM products
  WHERE stock_quantity <= low_stock_threshold
    AND products.status = 'active'
  ORDER BY stock_quantity ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_product_slug(product_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(product_name, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Insert sample products from the current Shop page
INSERT INTO products (name, description, category, price, stock_quantity, benefits, status, featured)
VALUES
  (
    'Multivitamin Complex',
    'Complete daily nutrition with essential vitamins and minerals',
    'supplements',
    299.99,
    150,
    ARRAY['Boosts immunity', 'Increases energy', 'Supports overall health'],
    'active',
    true
  ),
  (
    'Omega-3 Fish Oil',
    'Premium quality fish oil for heart and brain health',
    'supplements',
    349.99,
    120,
    ARRAY['Supports heart health', 'Enhances brain function', 'Reduces inflammation'],
    'active',
    true
  ),
  (
    'Vitamin D3',
    'High-potency vitamin D for bone and immune support',
    'supplements',
    199.99,
    200,
    ARRAY['Strengthens bones', 'Boosts immunity', 'Improves mood'],
    'active',
    false
  ),
  (
    'Probiotics Complex',
    'Advanced probiotic formula for digestive wellness',
    'wellness',
    399.99,
    80,
    ARRAY['Improves digestion', 'Supports gut health', 'Enhances immunity'],
    'active',
    true
  ),
  (
    'Turmeric Curcumin',
    'Powerful anti-inflammatory and antioxidant supplement',
    'wellness',
    279.99,
    100,
    ARRAY['Reduces inflammation', 'Powerful antioxidant', 'Supports joint health'],
    'active',
    false
  ),
  (
    'Collagen Peptides',
    'Hydrolyzed collagen for skin, hair, and joint health',
    'wellness',
    449.99,
    60,
    ARRAY['Improves skin elasticity', 'Strengthens hair', 'Supports joint health'],
    'active',
    true
  );

-- Update slugs for inserted products
UPDATE products SET slug = generate_product_slug(name) WHERE slug IS NULL;

-- Grant permissions
GRANT ALL ON products TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_products TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_product_slug TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Products table created successfully!';
  RAISE NOTICE '✅ Sample products inserted';
  RAISE NOTICE '✅ Stock tracking enabled';
  RAISE NOTICE '✅ Automatic stock deduction on orders';
  RAISE NOTICE '✅ Low stock alert function created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Products will automatically deduct stock when orders are placed';
  RAISE NOTICE '2. Use the admin panel to manage products';
  RAISE NOTICE '3. Shop page will load products from database';
END $$;
