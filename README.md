# Dr. Boitumelo Wellness Website

A modern e-commerce wellness website built with React, Vite, and Supabase.

## Features

- 🛒 **E-commerce Shop**: Browse and purchase wellness products and supplements
- 📦 **Product Management**: Admin dashboard for managing products, inventory, and orders
- 💰 **Discounts & Sales**: Create and manage promotional campaigns (Black Friday, BOGO, etc.)
- 📧 **Order Notifications**: Email confirmations for customers and admin (via Make.com)
- 🚚 **Shipping Management**: Configure shipping costs per product
- 📱 **Responsive Design**: Mobile-friendly interface
- ⭐ **Reviews & Testimonials**: Customer feedback with image/video uploads
- 📊 **Admin Dashboard**: Comprehensive order and product management

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Email**: Make.com webhooks with SMTP
- **Deployment**: Ready for Netlify/Vercel

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd dr-boitumelo-wellness
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MAKE_ORDER_WEBHOOK=your-make-webhook-url
VITE_ADMIN_EMAIL=internal@drphetla.co.za
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173)

## Database Setup

Run the SQL scripts in the `database/` folder in your Supabase SQL editor:

1. `add_shipping_cost.sql` - Adds shipping cost column to products
2. `discounts_system.sql` - Creates discount/sales system
3. `check_admin_user.sql` - Verifies admin user setup

## Admin Access

- URL: `/admin/login`
- Default credentials: Check with administrator

## Project Structure

```
dr-boitumelo-wellness/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── context/         # React Context (Cart, Auth)
│   ├── lib/             # Utilities (Supabase, Email)
│   └── data/            # Static data
├── database/            # SQL migration scripts
└── public/              # Static assets
```

## Features in Development

- 💳 Payment Gateway Integration (Coming Soon)
- 📧 Full Email Notification System
- 📅 Appointment Booking System

## Contributing

This is a private project. Contact the administrator for access.

## License

Private - All rights reserved
