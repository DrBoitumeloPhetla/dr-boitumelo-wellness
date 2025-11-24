-- Add Clients Table to Supabase Database
-- This table aggregates all customer/patient information from orders, appointments, and contacts

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,

  -- Address Information
  address TEXT,
  city TEXT,
  postal_code TEXT,

  -- Client Type and Status
  client_type TEXT DEFAULT 'lead', -- 'lead', 'customer', 'patient', 'both'
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'archived'

  -- Tracking Information
  first_contact_date TIMESTAMPTZ DEFAULT NOW(),
  last_contact_date TIMESTAMPTZ DEFAULT NOW(),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,

  -- Purchase Preferences
  favorite_products JSONB DEFAULT '[]'::jsonb,

  -- Notes and Tags
  notes TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Source tracking
  source TEXT, -- 'website', 'referral', 'social_media', etc.

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON clients(last_contact_date DESC);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies (public can read for now, you'll update later)
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
CREATE POLICY "Enable read access for all users" ON clients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON clients;
CREATE POLICY "Enable insert for all users" ON clients FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON clients;
CREATE POLICY "Enable update for all users" ON clients FOR UPDATE USING (true);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- Create view for client summary with latest activity
CREATE OR REPLACE VIEW client_summary AS
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,
  c.address,
  c.city,
  c.client_type,
  c.status,
  c.total_orders,
  c.total_spent,
  c.total_appointments,
  c.first_contact_date,
  c.last_contact_date,
  c.favorite_products,
  c.tags,
  c.notes,
  -- Get latest order info
  (SELECT order_id FROM orders WHERE
   (orders.customer_name = c.name OR orders.customer_email = c.email OR orders.customer_phone = c.phone)
   ORDER BY created_at DESC LIMIT 1) as latest_order_id,
  (SELECT created_at FROM orders WHERE
   (orders.customer_name = c.name OR orders.customer_email = c.email OR orders.customer_phone = c.phone)
   ORDER BY created_at DESC LIMIT 1) as latest_order_date,
  -- Get latest appointment info
  (SELECT appointment_id FROM appointments WHERE
   (appointments.name = c.name OR appointments.email = c.email OR appointments.phone = c.phone)
   ORDER BY created_at DESC LIMIT 1) as latest_appointment_id,
  (SELECT created_at FROM appointments WHERE
   (appointments.name = c.name OR appointments.email = c.email OR appointments.phone = c.phone)
   ORDER BY created_at DESC LIMIT 1) as latest_appointment_date
FROM clients c;

-- Function to sync client data from orders
CREATE OR REPLACE FUNCTION sync_client_from_order()
RETURNS TRIGGER AS $$
DECLARE
  client_id UUID;
  existing_client RECORD;
BEGIN
  -- Check if client exists (by phone or email)
  SELECT * INTO existing_client FROM clients
  WHERE phone = NEW.customer_phone OR (email IS NOT NULL AND email = NEW.customer_email)
  LIMIT 1;

  IF existing_client IS NULL THEN
    -- Create new client
    INSERT INTO clients (
      name, email, phone, address, city, postal_code,
      client_type, total_orders, total_spent,
      first_contact_date, last_contact_date, source
    ) VALUES (
      NEW.customer_name,
      NEW.customer_email,
      NEW.customer_phone,
      NEW.customer_address,
      NEW.customer_city,
      NEW.customer_postal_code,
      'customer',
      1,
      NEW.total,
      NOW(),
      NOW(),
      'website'
    );
  ELSE
    -- Update existing client
    UPDATE clients SET
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total,
      last_contact_date = NOW(),
      client_type = CASE
        WHEN client_type = 'patient' THEN 'both'
        ELSE 'customer'
      END,
      -- Update address if not set
      address = COALESCE(address, NEW.customer_address),
      city = COALESCE(city, NEW.customer_city),
      postal_code = COALESCE(postal_code, NEW.customer_postal_code),
      email = COALESCE(email, NEW.customer_email)
    WHERE id = existing_client.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync client data from appointments
CREATE OR REPLACE FUNCTION sync_client_from_appointment()
RETURNS TRIGGER AS $$
DECLARE
  existing_client RECORD;
BEGIN
  -- Check if client exists (by phone or email)
  SELECT * INTO existing_client FROM clients
  WHERE phone = NEW.phone OR (email IS NOT NULL AND email = NEW.email)
  LIMIT 1;

  IF existing_client IS NULL THEN
    -- Create new client
    INSERT INTO clients (
      name, email, phone,
      client_type, total_appointments,
      first_contact_date, last_contact_date, source
    ) VALUES (
      NEW.name,
      NEW.email,
      NEW.phone,
      'patient',
      1,
      NOW(),
      NOW(),
      'website'
    );
  ELSE
    -- Update existing client
    UPDATE clients SET
      total_appointments = total_appointments + 1,
      last_contact_date = NOW(),
      client_type = CASE
        WHEN client_type = 'customer' THEN 'both'
        ELSE 'patient'
      END,
      email = COALESCE(email, NEW.email)
    WHERE id = existing_client.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-sync clients
DROP TRIGGER IF EXISTS sync_client_on_order ON orders;
CREATE TRIGGER sync_client_on_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_client_from_order();

DROP TRIGGER IF EXISTS sync_client_on_appointment ON appointments;
CREATE TRIGGER sync_client_on_appointment
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION sync_client_from_appointment();

-- Grant permissions
GRANT ALL ON clients TO anon, authenticated;
GRANT SELECT ON client_summary TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Clients table created successfully!';
  RAISE NOTICE '✅ Indexes created for fast queries';
  RAISE NOTICE '✅ Triggers created to auto-sync from orders and appointments';
  RAISE NOTICE '✅ Client summary view created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Your existing orders and appointments will NOT be synced automatically';
  RAISE NOTICE '2. New orders/appointments will auto-create/update client records';
  RAISE NOTICE '3. You can manually import existing data using the admin panel';
END $$;
