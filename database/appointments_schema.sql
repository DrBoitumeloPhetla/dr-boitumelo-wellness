-- ============================================
-- UNIFIED APPOINTMENTS SYSTEM
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Create the appointments table (unified for all consultation types)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "BOOK-1737312000000"

  -- Customer details
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),

  -- Appointment details
  consultation_type VARCHAR(50) NOT NULL,  -- 'telephonic', 'virtual', 'face_to_face'
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,  -- Always start_time + 30 minutes

  -- Pricing
  price DECIMAL(10,2) NOT NULL,

  -- Status tracking
  payment_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'paid', 'refunded'
  appointment_status VARCHAR(50) DEFAULT 'scheduled',  -- 'scheduled', 'completed', 'cancelled', 'no_show'

  -- Location (for face-to-face)
  location VARCHAR(500),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create slot_reservations table (temporary holds during booking process)
CREATE TABLE IF NOT EXISTS slot_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_id VARCHAR(100) NOT NULL,  -- Browser session identifier
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- Auto-expire after 10 minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE slot_reservations DISABLE ROW LEVEL SECURITY;

-- 4. Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(appointment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(consultation_type);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, start_time);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON slot_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON slot_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_session ON slot_reservations(session_id);

-- 5. Create updated_at trigger for appointments
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- 6. Create function to clean up expired reservations (run periodically or on query)
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS void AS $$
BEGIN
  DELETE FROM slot_reservations WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CALENDAR SETTINGS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS calendar_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  working_hours JSONB DEFAULT '{
    "monday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "thursday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "friday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "saturday": {"enabled": false, "start": "09:00", "end": "13:00"},
    "sunday": {"enabled": false, "start": "09:00", "end": "13:00"}
  }'::jsonb,
  break_times JSONB DEFAULT '[{"start": "13:00", "end": "14:00", "label": "Lunch Break"}]'::jsonb,
  blocked_dates JSONB DEFAULT '[]'::jsonb,
  blocked_time_slots JSONB DEFAULT '[]'::jsonb,
  time_slot_duration INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default calendar settings if not exists
INSERT INTO calendar_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('appointments', 'slot_reservations', 'calendar_settings');

-- Check appointments columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments';
