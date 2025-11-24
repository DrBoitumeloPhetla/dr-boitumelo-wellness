-- Migration Script: Add Existing Products to Database
-- This script adds all your current products from products.json to the database
-- Run this in your Supabase SQL Editor

-- First, make sure the products table exists (run PRODUCTS_TABLE_SETUP.sql first if not)

-- Insert all existing products with stock tracking
INSERT INTO products (name, description, category, price, stock_quantity, low_stock_threshold, image_url, benefits, status, featured)
VALUES
  -- Alpha Lipoic Acid
  (
    'Alpha Lipoic Acid',
    'Powerful antioxidant supplement that supports cellular energy production and helps protect against oxidative stress.',
    'Antioxidants',
    350.00,
    100,
    10,
    '/Aplha-Lipoic-Acid-B-1-551x1024.png',
    ARRAY['Powerful antioxidant protection', 'Supports healthy blood sugar levels', 'Promotes nerve health', 'Enhances cellular energy'],
    'active',
    true
  ),

  -- Magnesium Glycinate
  (
    'Magnesium Glycinate',
    'Essential mineral that supports muscle function, bone health, and cardiovascular wellness.',
    'Minerals',
    250.00,
    100,
    10,
    '/Magnesium-Blue-1-551x1024.png',
    ARRAY['Supports muscle and nerve function', 'Promotes bone health', 'Helps maintain heart health', 'Aids in energy production'],
    'active',
    true
  ),

  -- Oxidation Immuno
  (
    'Oxidation Immuno',
    'Comprehensive immune support formula with powerful antioxidants to strengthen your body''s natural defenses.',
    'Immune Support',
    249.00,
    100,
    10,
    '/Oxidation-Immuno-B-1-551x1024.png',
    ARRAY['Strengthens immune system', 'Antioxidant protection', 'Supports overall wellness', 'Enhances natural defenses'],
    'active',
    true
  ),

  -- Oxidation Iron Penta
  (
    'Oxidation Iron Penta',
    'High-quality iron supplement that supports healthy red blood cell production and energy levels.',
    'Minerals',
    250.00,
    100,
    10,
    '/Iron-1-551x1024.png',
    ARRAY['Supports healthy red blood cells', 'Combats fatigue', 'Improves energy levels', 'Essential for oxygen transport'],
    'active',
    false
  ),

  -- Collagen Type I & III with Vitamin C
  (
    'Collagen Type I & III with Vitamin C',
    'Premium collagen supplement for skin elasticity, joint health, and overall beauty from within.',
    'Beauty & Wellness',
    200.00,
    100,
    10,
    '/Collagen-B-1-551x1024.png',
    ARRAY['Supports skin elasticity', 'Promotes joint health', 'Strengthens hair and nails', 'Anti-aging properties'],
    'active',
    true
  ),

  -- Oxidation Nutri
  (
    'Oxidation Nutri',
    'Comprehensive nutritional support with antioxidants to promote overall health and vitality.',
    'Nutrition',
    249.00,
    100,
    10,
    '/Oxdation-Nutri-B-1-551x1024.png',
    ARRAY['Complete nutritional support', 'Rich in antioxidants', 'Supports cellular health', 'Enhances vitality'],
    'active',
    false
  ),

  -- Oxidation Entero
  (
    'Oxidation Entero',
    'Advanced digestive health formula that supports gut health and optimal nutrient absorption.',
    'Digestive Health',
    245.00,
    100,
    10,
    '/Entero-1-551x1024.png',
    ARRAY['Supports digestive health', 'Promotes gut balance', 'Enhances nutrient absorption', 'Improves digestive comfort'],
    'active',
    true
  ),

  -- Oxidation Omega 3
  (
    'Oxidation Omega 3',
    'High-potency Omega-3 fatty acids for heart health, brain function, and anti-inflammatory support.',
    'Heart Health',
    125.00,
    100,
    10,
    '/Oxidation-Omega-3-B-2-551x1024.png',
    ARRAY['Supports cardiovascular health', 'Enhances brain function', 'Anti-inflammatory properties', 'Promotes healthy triglycerides'],
    'active',
    true
  ),

  -- Oxidation VitaMinerals
  (
    'Oxidation VitaMinerals',
    'Complete multivitamin and mineral formula for comprehensive daily nutritional support.',
    'Multivitamins',
    500.00,
    100,
    10,
    '/Vitaminerals-551x1024.png',
    ARRAY['Complete daily nutrition', 'Essential vitamins and minerals', 'Supports overall health', 'Boosts energy and vitality'],
    'active',
    true
  ),

  -- Oxidation VitaMinerals Start
  (
    'Oxidation VitaMinerals Start',
    'Beginner-friendly multivitamin formula perfect for starting your wellness journey.',
    'Multivitamins',
    399.00,
    100,
    10,
    '/Vitaminerals-Start-551x1024.png',
    ARRAY['Perfect for beginners', 'Balanced nutrition', 'Easy to digest', 'Gentle on the stomach'],
    'active',
    true
  ),

  -- Contoured Sleep Eye Mask
  (
    'Contoured Sleep Eye Mask',
    'Premium contoured sleep eye mask designed for ultimate comfort and complete light blockage for restful sleep.',
    'Wellness Accessories',
    200.00,
    50,
    5,
    '/Contoured-Sleep-Eye-Mask.png',
    ARRAY['Complete light blockage', 'Contoured for comfort', 'Promotes better sleep quality', 'Gentle on eyes and skin'],
    'active',
    true
  ),

  -- Silver Standard Package
  (
    'Silver Standard Package',
    'Curated wellness package with essential supplements to kickstart your health journey.',
    'Wellness Packages',
    845.00,
    30,
    5,
    '/Silver-Standard-Package.png',
    ARRAY['Essential wellness support', 'Cost-effective bundle', 'Comprehensive nutrition', 'Perfect for beginners'],
    'active',
    true
  ),

  -- Gold Standard Package
  (
    'Gold Standard Package',
    'Premium wellness package combining our most popular supplements for comprehensive health support.',
    'Wellness Packages',
    1000.00,
    30,
    5,
    '/Gold-Standard-Package.png',
    ARRAY['Complete wellness solution', 'Enhanced value bundle', 'Advanced nutritional support', 'Targets multiple health areas'],
    'active',
    true
  ),

  -- Platinum Standard Package
  (
    'Platinum Standard Package',
    'Elite wellness package featuring premium supplements for those serious about their health.',
    'Wellness Packages',
    1450.00,
    30,
    5,
    '/Platinum-Standard-Package.png',
    ARRAY['Premium supplement collection', 'Maximum health benefits', 'Superior nutritional coverage', 'Best value for money'],
    'active',
    true
  ),

  -- Diamond Standard Package
  (
    'Diamond Standard Package',
    'The ultimate wellness package with our complete range of supplements for total health transformation.',
    'Wellness Packages',
    1600.00,
    30,
    5,
    '/Diamond-Standard-Package.png',
    ARRAY['Complete supplement range', 'Ultimate health optimization', 'All-inclusive wellness support', 'Premium customer experience'],
    'active',
    true
  )
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  benefits = EXCLUDED.benefits,
  featured = EXCLUDED.featured;

-- Update slugs for all products
UPDATE products SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully migrated 15 products to the database!';
  RAISE NOTICE '';
  RAISE NOTICE 'Products added:';
  RAISE NOTICE '- 10 Individual supplements';
  RAISE NOTICE '- 4 Wellness packages';
  RAISE NOTICE '- 1 Wellness accessory';
  RAISE NOTICE '';
  RAISE NOTICE 'All products have:';
  RAISE NOTICE '- Default stock: 100 units (50 for accessories, 30 for packages)';
  RAISE NOTICE '- Low stock threshold: 10 units (5 for accessories and packages)';
  RAISE NOTICE '- Active status';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Visit /admin/products to manage stock levels';
END $$;
