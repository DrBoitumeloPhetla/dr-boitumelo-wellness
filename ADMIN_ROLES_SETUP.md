# Admin Roles & Activity Logging Setup Guide

## Step 1: Generate Password Hashes

Before running the SQL migration, you need to generate bcrypt password hashes for the new users.

### Option A: Using an online tool (Quick & Easy)
1. Go to: https://bcrypt-generator.com/
2. Enter the password for Lerato
3. Select "10" rounds
4. Copy the generated hash
5. Repeat for Potlako's password

### Option B: Using Node.js (Recommended for production)
```bash
# Install bcrypt if not already installed
npm install bcrypt

# Run this in Node.js console or create a temp script
node
```

```javascript
const bcrypt = require('bcrypt');

// Generate hash for Lerato's password
const leratoPassword = 'YourSecurePasswordHere';  // Choose a strong password
const leratoHash = await bcrypt.hash(leratoPassword, 10);
console.log('Lerato hash:', leratoHash);

// Generate hash for Potlako's password
const potlakoPassword = 'YourSecurePasswordHere';  // Choose a strong password
const potlakoHash = await bcrypt.hash(potlakoPassword, 10);
console.log('Potlako hash:', potlakoHash);
```

## Step 2: Update the SQL Migration

1. Open `supabase-migrations/add-roles-and-activity-logs.sql`
2. Replace `$2a$10$YourHashedPasswordHere1` with Lerato's actual password hash
3. Replace `$2a$10$YourHashedPasswordHere2` with Potlako's actual password hash
4. Update the email addresses if needed

## Step 3: Run the Migration in Supabase

### Method 1: Using Supabase Dashboard (Easiest)
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "+ New Query"
4. Copy and paste the entire contents of `add-roles-and-activity-logs.sql`
5. Click "Run" button
6. Verify success in the output panel

### Method 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push --file supabase-migrations/add-roles-and-activity-logs.sql
```

## Step 4: Verify the Changes

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check if role column was added
SELECT username, role, email, created_at FROM admin_users;

-- Check if activity_logs table was created
SELECT * FROM activity_logs LIMIT 5;

-- Verify the three users exist
SELECT username, role FROM admin_users
WHERE username IN ('DrBBPhetla', 'Lerato', 'Potlako');
```

Expected results:
- DrBBPhetla should have role = 'super_admin'
- Lerato and Potlako should have role = 'staff'

## Step 5: Test Login

After the migration is complete, try logging in with each account:

1. **DrBBPhetla** (Super Admin)
   - Should see: Dashboard, Products, Orders, Discounts, Appointments, Prescriptions, Activity Logs
   - Can: view, create, edit, delete everything

2. **Lerato** (Staff)
   - Should see: Products, Orders, Discounts, Appointments, Prescriptions (view only)
   - Can: view prescriptions but NOT approve/reject/delete
   - Can: view, create, edit products/orders/discounts (NO delete)

3. **Potlako** (Staff)
   - Same permissions as Lerato

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: The migration uses `IF NOT EXISTS` clauses, but if you need to re-run:
```sql
-- Drop and recreate (WARNING: deletes data)
DROP TABLE IF EXISTS activity_logs CASCADE;
ALTER TABLE admin_users DROP COLUMN IF EXISTS role;
-- Then re-run the migration
```

### Issue: Cannot login with new users
**Solution**:
1. Verify password hash was set correctly
2. Check if users were inserted: `SELECT * FROM admin_users WHERE username IN ('Lerato', 'Potlako');`
3. Make sure the password you're entering matches the one you hashed

### Issue: Activity logs not appearing
**Solution**:
1. Check if table exists: `SELECT * FROM activity_logs LIMIT 1;`
2. Verify insert permissions: `GRANT INSERT ON activity_logs TO authenticated;`
3. Check browser console for errors

## What Happens Next

After completing setup, the application will:
- Automatically log all admin actions to `activity_logs` table
- Show "Super Admin" or "Staff" badge next to username in admin panel
- Hide restricted buttons/pages for staff users
- Allow DrBBPhetla to view full activity history in Activity Logs page

## Security Notes

🔒 **Important Security Practices:**
1. Use strong passwords (12+ characters, mixed case, numbers, symbols)
2. Store passwords securely (use password manager)
3. Never commit actual passwords to git
4. Change default passwords immediately after first login
5. Regularly review activity logs for suspicious activity
6. Consider enabling 2FA for super admin account (future enhancement)

## Need Help?

If you encounter any issues:
1. Check Supabase logs in dashboard
2. Verify environment variables are set correctly
3. Ensure you're using the correct database (not test/staging)
4. Contact support with error messages and steps taken
