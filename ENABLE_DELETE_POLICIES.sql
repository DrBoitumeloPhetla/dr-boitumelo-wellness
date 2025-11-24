-- Add DELETE policies for orders and appointments tables
-- This allows the admin panel (using anon key) to delete records

-- ============================================
-- ORDERS TABLE - Add DELETE Policy
-- ============================================

-- Policy: Allow anonymous to delete orders (for admin operations via anon key)
CREATE POLICY IF NOT EXISTS "Allow anonymous order deletion"
  ON public.orders
  FOR DELETE
  TO anon
  USING (true);

-- ============================================
-- APPOINTMENTS TABLE - Add DELETE Policy
-- ============================================

-- Policy: Allow anonymous to delete appointments (for admin operations via anon key)
CREATE POLICY IF NOT EXISTS "Allow anonymous appointment deletion"
  ON public.appointments
  FOR DELETE
  TO anon
  USING (true);

-- ============================================
-- VERIFY ROW LEVEL SECURITY IS ENABLED
-- ============================================

-- Make sure RLS is enabled on both tables (if not already)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
