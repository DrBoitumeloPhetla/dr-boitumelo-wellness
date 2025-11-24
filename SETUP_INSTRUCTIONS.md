# Database Setup Instructions

This guide will help you set up your products database and admin system.

## Step 1: Run the Database Setup Scripts

You need to run two SQL scripts in your Supabase SQL Editor:

### 1.1 Create Products Table
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `PRODUCTS_TABLE_SETUP.sql`
5. Paste into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

**What this does:**
- Creates the `products` table with all necessary columns
- Sets up automatic stock deduction when orders are placed
- Creates low stock alert function
- Adds database triggers and security policies

### 1.2 Migrate Your Existing Products
1. Stay in the **SQL Editor**
2. Click **New Query** again
3. Copy the contents of `MIGRATE_PRODUCTS.sql`
4. Paste into the SQL Editor
5. Click **Run** or press `Ctrl+Enter`

**What this does:**
- Adds all 15 of your existing products to the database
- Sets default stock levels:
  - Individual supplements: 100 units
  - Wellness packages: 30 units
  - Accessories: 50 units
- Sets low stock thresholds (10 for supplements, 5 for packages/accessories)

## Step 2: Access the Admin Panel

### 2.1 Login Credentials
- **URL**: http://localhost:5173/admin/login (or your deployed URL)
- **Username**: `admin`
- **Password**: `admin123`

> **Note**: These are temporary development credentials. After running the SQL scripts, you can use `admin/ChangeMe123!` for production.

### 2.2 Navigate to Products
1. After logging in, click **Products** in the sidebar
2. You'll see all 15 products loaded from the database

## Step 3: Manage Your Inventory

### Edit Stock Levels
1. Click the **Edit** button on any product
2. Update the **Stock Quantity** field
3. Click **Save Product**

### Low Stock Alerts
- Products below their threshold show an orange "Low Stock" badge
- Out of stock products (0 quantity) show a red "Out of Stock" badge
- The admin dashboard displays a low stock alert banner

### Add New Products
1. Click **Add Product** button
2. Fill in product details:
   - Name, description, category, price
   - Stock quantity and low stock threshold
   - Upload image or enter image URL
   - Benefits (comma-separated)
   - Status (active/inactive)
   - Featured checkbox
3. Click **Save Product**

## Your Current Products

Here are all the products that will be added:

### Individual Supplements (10)
1. **Alpha Lipoic Acid** - R350 (Featured)
2. **Magnesium Glycinate** - R250 (Featured)
3. **Oxidation Immuno** - R249 (Featured)
4. **Oxidation Iron Penta** - R250
5. **Collagen Type I & III with Vitamin C** - R200 (Featured)
6. **Oxidation Nutri** - R249
7. **Oxidation Entero** - R245 (Featured)
8. **Oxidation Omega 3** - R125 (Featured)
9. **Oxidation VitaMinerals** - R500 (Featured)
10. **Oxidation VitaMinerals Start** - R399 (Featured)

### Wellness Accessories (1)
11. **Contoured Sleep Eye Mask** - R200 (Featured)

### Wellness Packages (4)
12. **Silver Standard Package** - R845 (Featured)
13. **Gold Standard Package** - R1000 (Featured)
14. **Platinum Standard Package** - R1450 (Featured)
15. **Diamond Standard Package** - R1600 (Featured)

## Features Available

### Automatic Stock Management
- Stock automatically decreases when orders are placed
- Products automatically marked as "out of stock" when quantity reaches 0
- Low stock alerts when inventory is below threshold

### Admin Features
- ✅ View all products in grid layout
- ✅ Filter by category
- ✅ Edit product details and stock
- ✅ Delete products
- ✅ Add new products with image upload
- ✅ Low stock dashboard alerts

### Customer Experience
- Shop page loads products from database
- Out of stock items can't be added to cart
- Low stock warnings displayed
- Stock quantity shown on product cards

## Troubleshooting

### Products not showing in admin?
- Make sure you ran both SQL scripts
- Check browser console for errors
- Verify Supabase connection in `.env` file

### Can't login to admin?
- Use `admin/admin123` (fallback credentials)
- After SQL setup: `admin/ChangeMe123!`

### Images not displaying?
- Images use relative paths from `/public` folder
- Make sure image files are in the public folder
- Or upload new images when editing products

## Next Steps

1. ✅ Run the SQL scripts
2. ✅ Login to admin panel
3. ✅ Update stock quantities for each product based on your actual inventory
4. ✅ Add any new products as needed
5. ✅ Test the shop page to see products with stock indicators

---

**Need Help?**
- Check the browser console for errors
- Verify your Supabase project URL and anon key in `.env`
- Make sure the dev server is running: `npm run dev`
