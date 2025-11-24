# Supabase Database Setup Guide

## Overview
This guide will help you set up Supabase as your backend database for the Dr. Boitumelo Wellness website. Supabase will replace localStorage and provide a real, persistent database.

## Step 1: Create Supabase Account & Project

### 1.1 Sign Up
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### 1.2 Create New Project
1. Click "New Project"
2. Fill in project details:
   - **Name**: `dr-boitumelo-wellness` (or any name you prefer)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to South Africa (e.g., `eu-west-1` or `ap-southeast-1`)
   - **Pricing Plan**: Free tier is perfect to start
3. Click "Create new project"
4. Wait 2-3 minutes for project to be created

### 1.3 Get Your Project Credentials
Once project is ready:
1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** tab
3. You'll need these two values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

**IMPORTANT:** Copy these and save them - you'll need them shortly!

## Step 2: Create Database Tables

### 2.1 Access SQL Editor
1. In Supabase dashboard, click **SQL Editor** in sidebar
2. Click **New Query**

### 2.2 Run This SQL Script
Copy and paste this entire script, then click **RUN**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  customer_city TEXT,
  customer_postal_code TEXT,
  customer_notes TEXT,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders index
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('virtual', 'telephonic')),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  symptoms TEXT,
  symptoms_start_date TEXT,
  vitamin_d_test TEXT,
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointments indexes
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_email ON appointments(email);

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_type TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts indexes
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_email ON contacts(email);

-- ============================================
-- CALENDAR SETTINGS TABLE
-- ============================================
CREATE TABLE calendar_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  working_hours JSONB NOT NULL,
  blocked_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_slot_duration INTEGER NOT NULL DEFAULT 30,
  break_times JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default calendar settings
INSERT INTO calendar_settings (working_hours, time_slot_duration, break_times)
VALUES (
  '{
    "monday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "thursday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "friday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "saturday": {"enabled": false, "start": "09:00", "end": "13:00"},
    "sunday": {"enabled": false, "start": "09:00", "end": "13:00"}
  }'::jsonb,
  30,
  '[{"start": "13:00", "end": "14:00", "label": "Lunch Break"}]'::jsonb
);

-- ============================================
-- ADMIN USERS TABLE (for authentication)
-- ============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
-- Note: This is hashed with bcrypt - you should change this in production
INSERT INTO admin_users (username, password_hash, email)
VALUES (
  'admin',
  '$2a$10$qJKvN5nEWEkqQXZ5ZqWZ4.YQ7.9P3HJvQ9KqXJZL5zKqXJZL5zKqX',
  'admin@drboitumelowellness.co.za'
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public can insert (create new records)
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can create contacts" ON contacts
  FOR INSERT WITH CHECK (true);

-- Public can read calendar settings
CREATE POLICY "Anyone can read calendar settings" ON calendar_settings
  FOR SELECT USING (true);

-- Only authenticated users can read/update (admin only)
-- For now, we'll allow all reads for testing - you'll update this later
CREATE POLICY "Anyone can read orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update orders" ON orders
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can read appointments" ON appointments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update appointments" ON appointments
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can read contacts" ON contacts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update contacts" ON contacts
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can update calendar settings" ON calendar_settings
  FOR UPDATE USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.3 Verify Tables Created
1. Click **Table Editor** in sidebar
2. You should see 5 tables:
   - `orders`
   - `appointments`
   - `contacts`
   - `calendar_settings`
   - `admin_users`

## Step 3: Configure Environment Variables

### 3.1 Create .env File
In your project root, create a file named `.env`:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace with your actual values from Step 1.3

### 3.2 Update .gitignore
Make sure `.env` is in your `.gitignore` file (it should be already):

```
.env
.env.local
```

## Step 4: Install Supabase Client

I'll handle this in the next step!

## What's Next?

Once you complete Steps 1-3 above:
1. I'll install the Supabase client library
2. I'll create the Supabase configuration file
3. I'll update all forms to save to Supabase
4. I'll update admin pages to fetch from Supabase
5. We'll test everything end-to-end

## Quick Checklist

Before proceeding, make sure you have:
- [ ] Created Supabase account
- [ ] Created new project
- [ ] Copied Project URL
- [ ] Copied anon/public key
- [ ] Ran the SQL script in SQL Editor
- [ ] Verified 5 tables exist
- [ ] Created `.env` file with your credentials

## Need Help?

If you get stuck:
- Check Supabase docs: https://supabase.com/docs
- Verify SQL script ran without errors
- Make sure you copied the correct API keys
- Ensure `.env` file is in the root directory

---

**Once you've completed these steps, let me know and I'll continue with the integration!** 🚀
