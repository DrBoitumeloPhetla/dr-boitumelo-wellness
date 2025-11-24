# Clients & Leads Feature - Setup Guide

## Overview
The Clients & Leads feature provides a comprehensive CRM system to manage all your customers and patients in one place.

## What's Been Created

### 1. Database Table
- **Table:** `clients`
- **Location:** SQL script at `CLIENTS_TABLE_SETUP.sql`
- **Features:**
  - Stores all client information (name, email, phone, address)
  - Tracks client type (customer, patient, both, lead)
  - Calculates total orders, total spent, total appointments
  - Auto-syncs from orders and appointments
  - Purchase history with favorite products

### 2. Helper Functions
- **Location:** `src/lib/supabase.js`
- **Functions:**
  - `getAllClients()` - Get all clients
  - `searchClients(searchTerm)` - Search by name/email/phone
  - `filterClientsByType(clientType)` - Filter by type
  - `getClientById(clientId)` - Get single client
  - `getClientWithHistory(clientId)` - Get client with full order/appointment history
  - `updateClient(clientId, updates)` - Update client info
  - `deleteClient(clientId)` - Delete client
  - `syncExistingDataToClients()` - Import existing orders/appointments

### 3. Admin Page
- **Location:** `src/pages/Admin/AdminClients.jsx`
- **Route:** `/admin/clients`
- **Features:**
  - Search by name, email, or phone
  - Filter by client type (customer, patient, both, lead)
  - Filter by status (active, inactive, archived)
  - View client details with full history
  - Export to CSV
  - Sync existing data button
  - Stats cards showing totals

## Setup Steps

### Step 1: Run SQL Script in Supabase (5 minutes)

1. Open your Supabase dashboard: https://supabase.com
2. Go to your project: `dr-boitumelo-wellness`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `CLIENTS_TABLE_SETUP.sql`
6. Copy the ENTIRE contents
7. Paste into Supabase SQL Editor
8. Click **RUN** (or press Ctrl+Enter)
9. Wait for success message

### Step 2: Verify Table Created (1 minute)

1. Click **Table Editor** in Supabase sidebar
2. You should see a new table: **clients**
3. Click on it to see the columns:
   - id, name, email, phone
   - address, city, postal_code
   - client_type, status
   - total_orders, total_spent, total_appointments
   - favorite_products, notes, tags
   - first_contact_date, last_contact_date
   - created_at, updated_at

### Step 3: Access the Clients Page

1. Go to your admin dashboard: http://localhost:5174/admin/login
2. Login with: `admin` / `admin123`
3. Click **"Clients & Leads"** in the sidebar (second item)
4. You should see an empty clients list

### Step 4: Sync Existing Data (2 minutes)

1. On the Clients page, click the **"Sync Data"** button (top right)
2. Confirm the action
3. Wait for the sync to complete
4. You should see a success message: "✅ Successfully synced X clients!"
5. Your existing orders and appointments are now imported as clients

## Features Explained

### Auto-Sync from Orders & Appointments

**Triggers are set up to automatically:**
- Create a new client record when a new order is placed
- Create a new client record when a new appointment is booked
- Update existing client records with new orders/appointments
- Calculate totals automatically (orders, spent, appointments)

This means **from now on, all new orders and bookings will automatically create/update client records!**

### Client Types

- **Customer:** Someone who has purchased products
- **Patient:** Someone who has booked appointments
- **Both:** Someone who has both purchased AND booked appointments
- **Lead:** Someone who filled in info but didn't complete (from abandoned cart/booking)

### Search & Filters

**Search:**
- Type any name, email, or phone number
- Results update in real-time

**Filters:**
- **Type Filter:** All Types, Customers, Patients, Both, Leads
- **Status Filter:** All Status, Active, Inactive, Archived

### View Client Details

Click the eye icon (👁️) on any client to see:
- Full contact information
- Client summary (type, status, totals)
- Complete order history with items and totals
- Complete appointment history with dates and symptoms
- Notes (if any)

### Export to CSV

Click **"Export CSV"** button to download a spreadsheet with:
- Name, Email, Phone, City
- Type, Status
- Total Orders, Total Spent, Total Appointments
- First Contact, Last Contact

**Use cases:**
- Import into your email marketing tool
- Create mailing lists
- Analyze customer behavior
- Share with your team

## Usage Scenarios

### Scenario 1: Find a Specific Client

1. Go to Clients page
2. Type their name/phone in search box
3. Click eye icon to see their history
4. See all their past orders and appointments

### Scenario 2: Export All Customers

1. Filter by Type: "Customers"
2. Click "Export CSV"
3. Open in Excel/Google Sheets
4. You now have a list of all customers with purchase totals

### Scenario 3: Follow Up with Leads

1. Filter by Type: "Leads"
2. These are people who started but didn't complete
3. Export to CSV
4. Use for targeted follow-up campaigns

### Scenario 4: See Top Spenders

1. No filter needed - table is sorted by last contact date
2. Look at the "Revenue" column
3. Export CSV and sort by "Total Spent" in Excel
4. Identify your VIP customers

## Data Structure

### What's Tracked Per Client:

**Basic Info:**
- Name
- Email
- Phone
- Address
- City
- Postal Code

**Client Classification:**
- Type (customer/patient/both/lead)
- Status (active/inactive/archived)
- Source (website/referral/etc)

**Activity Metrics:**
- Total Orders
- Total Amount Spent
- Total Appointments Booked
- First Contact Date
- Last Contact Date

**Purchase Preferences:**
- Favorite Products (JSON array)
- Tags (for categorization)
- Notes (admin notes)

**Related Data:**
- Full order history
- Full appointment history

## Benefits

### 1. **Single Source of Truth**
- All customer/patient data in one place
- No more searching through orders and appointments separately
- Unified view of client relationships

### 2. **Better Customer Service**
- Quickly find client history
- See what they've purchased before
- See their appointment history
- Personalized service based on history

### 3. **Marketing & Follow-Up**
- Export lists for email marketing
- Target customers who haven't bought in a while
- Follow up with leads who didn't complete

### 4. **Business Insights**
- See total revenue per client
- Identify repeat customers
- Track customer lifetime value
- Understand purchase patterns

### 5. **POPIA Compliance**
- All client data in one secure database
- Easy to update or delete client records
- Centralized data management

## Integration with Existing Features

### Orders
- Every new order automatically creates/updates a client record
- Client's total_orders increments
- Client's total_spent increases
- Client type becomes "customer" (or "both" if they're already a patient)

### Appointments
- Every new appointment automatically creates/updates a client record
- Client's total_appointments increments
- Client type becomes "patient" (or "both" if they're already a customer)

### Abandoned Cart/Booking (Make.com)
- Can be enhanced to also create "lead" type clients
- Track leads who didn't complete purchase/booking

## Future Enhancements (Optional)

You could add:
- Email campaigns directly from the Clients page
- SMS messaging to specific client segments
- Client notes/comments system
- Appointment reminders based on last visit
- Product recommendations based on purchase history
- Client loyalty/rewards tracking
- Birthday/anniversary tracking
- Custom tags for segmentation

## Troubleshooting

### No clients appearing after sync?
- Check that you have existing orders or appointments in the database
- Check browser console for errors
- Verify the SQL script ran successfully

### Can't export CSV?
- Make sure you're using a modern browser (Chrome, Firefox, Edge)
- Check if pop-up blocker is preventing download
- Try disabling any ad blockers

### Duplicate clients?
- Clients are matched by phone number or email
- If someone uses different phones/emails, they might appear as duplicates
- You can manually merge by updating one and deleting the other

### Client data not syncing from new orders?
- Check that the database triggers were created successfully
- Re-run the SQL script if needed
- Check Supabase logs for any errors

## Summary

**What you have now:**
- Complete client database with all customer/patient info
- Auto-sync from orders and appointments
- Search and filter capabilities
- CSV export for marketing
- Full client history view

**Access:**
- URL: http://localhost:5174/admin/clients
- Login: admin / admin123

**Next step:**
Run the SQL script in Supabase to activate the feature!

---

**Need help?** Check the browser console for any error messages, or review the SQL script output in Supabase for any issues.
