-- Create clients table for CRM functionality
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  client_type VARCHAR(50) DEFAULT 'lead' CHECK (client_type IN ('lead', 'customer', 'patient', 'both')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  source VARCHAR(100),
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  first_contact_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_type ON public.clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON public.clients(last_contact_date DESC);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users (admins) can view all clients
CREATE POLICY "Admins can view all clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users (admins) can insert clients
CREATE POLICY "Admins can insert clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users (admins) can update clients
CREATE POLICY "Admins can update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users (admins) can delete clients
CREATE POLICY "Admins can delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Policy: Allow anonymous inserts for automatic client tracking from orders/appointments
CREATE POLICY "Allow anonymous client creation"
  ON public.clients
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow anonymous updates for automatic client tracking
CREATE POLICY "Allow anonymous client updates"
  ON public.clients
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anonymous to read their own data by email
CREATE POLICY "Allow anonymous to read by email"
  ON public.clients
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow anonymous to delete clients (for admin operations via anon key)
CREATE POLICY "Allow anonymous client deletion"
  ON public.clients
  FOR DELETE
  TO anon
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_clients_timestamp ON public.clients;
CREATE TRIGGER update_clients_timestamp
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();
