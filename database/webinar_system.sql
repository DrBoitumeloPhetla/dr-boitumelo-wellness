-- ============================================
-- VITAMIN D TALKS WEBINAR SYSTEM
-- For healthcare practitioner webinar registrations
-- ============================================

-- Step 1: Create webinars table
CREATE TABLE IF NOT EXISTS webinars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME DEFAULT '10:00:00',
  duration_minutes INTEGER DEFAULT 60,
  price DECIMAL(10, 2) DEFAULT 250.00,
  zoom_link TEXT,
  zoom_meeting_id TEXT,
  max_attendees INTEGER DEFAULT 100,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create webinar_registrations table
CREATE TABLE IF NOT EXISTS webinar_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  hpcsa_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  zoom_registrant_id TEXT,
  attended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_webinars_date ON webinars(date);
CREATE INDEX IF NOT EXISTS idx_webinars_status ON webinars(status);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_webinar_id ON webinar_registrations(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_email ON webinar_registrations(email);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_hpcsa ON webinar_registrations(hpcsa_number);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_status ON webinar_registrations(status);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_payment ON webinar_registrations(payment_status);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for webinars
DROP POLICY IF EXISTS "Anyone can view webinars" ON webinars;
DROP POLICY IF EXISTS "Anyone can insert webinars" ON webinars;
DROP POLICY IF EXISTS "Anyone can update webinars" ON webinars;
DROP POLICY IF EXISTS "Anyone can delete webinars" ON webinars;

CREATE POLICY "Anyone can view webinars"
  ON webinars FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert webinars"
  ON webinars FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can update webinars"
  ON webinars FOR UPDATE TO public USING (true);

CREATE POLICY "Anyone can delete webinars"
  ON webinars FOR DELETE TO public USING (true);

-- Step 6: Create RLS policies for webinar_registrations
DROP POLICY IF EXISTS "Anyone can view webinar_registrations" ON webinar_registrations;
DROP POLICY IF EXISTS "Anyone can insert webinar_registrations" ON webinar_registrations;
DROP POLICY IF EXISTS "Anyone can update webinar_registrations" ON webinar_registrations;
DROP POLICY IF EXISTS "Anyone can delete webinar_registrations" ON webinar_registrations;

CREATE POLICY "Anyone can view webinar_registrations"
  ON webinar_registrations FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert webinar_registrations"
  ON webinar_registrations FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can update webinar_registrations"
  ON webinar_registrations FOR UPDATE TO public USING (true);

CREATE POLICY "Anyone can delete webinar_registrations"
  ON webinar_registrations FOR DELETE TO public USING (true);

-- Step 7: Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_webinar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_webinar_timestamp ON webinars;
CREATE TRIGGER trigger_update_webinar_timestamp
  BEFORE UPDATE ON webinars
  FOR EACH ROW
  EXECUTE FUNCTION update_webinar_timestamp();

DROP TRIGGER IF EXISTS trigger_update_webinar_registration_timestamp ON webinar_registrations;
CREATE TRIGGER trigger_update_webinar_registration_timestamp
  BEFORE UPDATE ON webinar_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_webinar_timestamp();

-- Step 8: Insert the 2026 Vitamin D Talks webinar series
-- Last Sunday of each month from Feb to Oct 2026
INSERT INTO webinars (title, description, topic, date, time, price) VALUES
  ('Overview & Diagnosis', 'Comprehensive introduction to Vitamin D - its importance, testing methods, and diagnostic approaches for healthcare practitioners.', 'Feb - Overview & Diagnosis', '2026-02-22', '10:00:00', 250.00),
  ('Supplementation & Dosing', 'Evidence-based supplementation strategies and dosing protocols for different patient populations.', 'Mar - Supplementation & Dosing', '2026-03-29', '10:00:00', 250.00),
  ('Hair, Skin & Nails', 'The role of Vitamin D in dermatological health and aesthetic medicine.', 'Apr - Hair, Skin & Nails', '2026-04-26', '10:00:00', 250.00),
  ('Respiratory Health', 'Vitamin D''s impact on respiratory function, immunity, and lung health.', 'May - Respiratory', '2026-05-31', '10:00:00', 250.00),
  ('Reproductive Health', 'Vitamin D in fertility, pregnancy, and reproductive system health.', 'June - Reproductive', '2026-06-28', '10:00:00', 250.00),
  ('Neurology', 'Neurological implications of Vitamin D deficiency and supplementation.', 'July - Neurology', '2026-07-26', '10:00:00', 250.00),
  ('Bone, Teeth & Muscle', 'Classical roles of Vitamin D in musculoskeletal health.', 'Aug - Bone, Teeth & Muscle', '2026-08-30', '10:00:00', 250.00),
  ('Autoimmune Conditions', 'Vitamin D''s immunomodulatory effects and autoimmune disease management.', 'Sep - Autoimmune', '2026-09-27', '10:00:00', 250.00),
  ('Cardiovascular Health', 'Vitamin D and heart health - current evidence and clinical applications.', 'Oct - Cardiovascular', '2026-10-25', '10:00:00', 250.00)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE webinars IS 'Stores Vitamin D Talks webinar series information';
COMMENT ON TABLE webinar_registrations IS 'Stores healthcare practitioner registrations for webinars';
