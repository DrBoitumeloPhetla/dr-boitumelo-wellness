# Admin Dashboard Guide

## Overview
The admin dashboard is a separate, password-protected section of the Dr. Boitumelo Wellness website where you can view and manage:
- Customer orders/purchases
- Patient appointments
- Contact form submissions
- Simple statistics and analytics

## Accessing the Admin Dashboard

### Login Credentials
- **URL**: `http://localhost:5173/admin/login` (or your deployed URL + `/admin/login`)
- **Username**: `admin`
- **Password**: `admin123`

> **IMPORTANT**: These are demo credentials. Before deploying to production, update the login logic in `src/context/AuthContext.jsx` to connect to a real backend authentication system.

## Features

### 1. Dashboard Overview (`/admin/dashboard`)
- View quick stats: total orders, revenue, appointments, contact messages
- See recent orders and upcoming appointments
- Quick action buttons to navigate to pending items

### 2. Orders Management (`/admin/orders`)
- View all customer orders with full details
- Filter by status (pending, processing, completed)
- Search by customer name, email, or order ID
- Update order status with one click
- View customer information, shipping address, and order items

### 3. Appointments Management (`/admin/appointments`)
- View all patient appointment bookings
- Filter by appointment type (virtual, telephonic) and status
- Search by patient name, email, or phone
- View complete health information submitted by patients
- Update appointment status (pending, confirmed, completed, cancelled)

### 4. Contact Submissions (`/admin/contacts`)
- View all contact form submissions
- Filter by status (new, read, responded)
- Search by name, email, or phone
- Mark messages as read or responded
- Quick email reply button

## Demo Data

To test the admin dashboard with sample data, you can generate demo data:

1. Open your browser console (F12)
2. Run the following commands:

```javascript
// Import and generate demo data
import { generateDemoData } from './src/utils/generateDemoData.js';
generateDemoData();
```

Or add this temporarily to your code:
```javascript
// In src/main.jsx or any component
import { generateDemoData } from './utils/generateDemoData';
generateDemoData(); // Run once to populate demo data
```

### Clear Demo Data
```javascript
import { clearDemoData } from './utils/generateDemoData';
clearDemoData();
```

## How Data Flows

### Current Setup (Demo Mode)
All data is stored in **localStorage** for demonstration purposes:
- `adminOrders` - Stores order data
- `adminAppointments` - Stores appointment bookings
- `adminContacts` - Stores contact form submissions

When customers:
1. **Place an order** → Data saved to localStorage → Appears in Admin Orders
2. **Book an appointment** → Data saved to localStorage → Appears in Admin Appointments
3. **Submit contact form** → Data saved to localStorage → Appears in Admin Contacts

### Production Setup (Future)
To make this production-ready, you'll need to:

1. **Set up a backend API** (recommended: Node.js + Express)
2. **Add a database** (recommended: MongoDB or PostgreSQL)
3. **Update the authentication** to use real credentials and JWT tokens
4. **Replace localStorage calls** with API calls (axios/fetch)

## File Structure

```
src/
├── pages/Admin/
│   ├── AdminLogin.jsx          # Login page
│   ├── AdminDashboard.jsx      # Main dashboard with stats
│   ├── AdminOrders.jsx         # Orders management
│   ├── AdminAppointments.jsx   # Appointments management
│   └── AdminContacts.jsx       # Contact submissions
├── components/Admin/
│   ├── AdminLayout.jsx         # Sidebar navigation layout
│   └── ProtectedRoute.jsx      # Route protection wrapper
├── context/
│   └── AuthContext.jsx         # Authentication state management
└── utils/
    └── generateDemoData.js     # Demo data generator
```

## Security Notes

### Current Security (Demo Mode)
- Basic password authentication
- Session stored in localStorage
- No encryption
- No rate limiting
- **NOT suitable for production use**

### For Production Deployment
Before going live, implement:
- ✅ Secure backend authentication (JWT, OAuth, etc.)
- ✅ HTTPS encryption
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting on login attempts
- ✅ Session timeout
- ✅ CSRF protection
- ✅ Input validation and sanitization
- ✅ Database security
- ✅ Environment variables for sensitive data

## Customization

### Change Login Credentials
Edit `src/context/AuthContext.jsx`:

```javascript
const login = (username, password) => {
  // Update these credentials
  if (username === 'your_username' && password === 'your_password') {
    // ... rest of code
  }
}
```

### Change Brand Colors
The admin dashboard uses your existing Tailwind config colors:
- Primary Green: `bg-primary-green`
- Primary Gold: `bg-primary-gold`

To change, edit `tailwind.config.js`.

## Support & Next Steps

### Immediate Next Steps
1. Test the admin dashboard with demo data
2. Try creating real orders/appointments from the main website
3. Verify they appear in the admin dashboard
4. Test all filtering and search features

### Future Enhancements
- Add product management (create, edit, delete products)
- Add user management (manage admin accounts)
- Export reports (CSV, PDF)
- Email notifications when new orders/appointments arrive
- Payment integration (Stripe, PayFast)
- Real-time updates (WebSockets)
- Advanced analytics and charts

## Troubleshooting

### Can't access admin pages after login
- Check that `AuthProvider` is wrapping your app in `main.jsx`
- Clear browser cache and localStorage
- Check browser console for errors

### Data not appearing in admin dashboard
- Check that forms are submitting correctly
- Open browser DevTools → Application → Local Storage
- Look for `adminOrders`, `adminAppointments`, `adminContacts` keys
- Generate demo data to test

### Logged out unexpectedly
- The auth token is stored in localStorage
- Clearing browser data will log you out
- Closing the browser tab does NOT log you out

## Questions?
For any issues or questions about the admin dashboard, contact your developer or refer to the main README.md file.
