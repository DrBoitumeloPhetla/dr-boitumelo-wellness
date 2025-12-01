# 🔒 Google reCAPTCHA v3 Implementation Guide

## What is reCAPTCHA v3?
- **Invisible** - No checkbox, no puzzle, no interruption
- Runs in background and gives each user interaction a score (0.0 to 1.0)
- You decide the threshold (e.g., 0.5 = accept, below 0.5 = reject as bot)
- Best for user experience

---

## Step 1: Get Your reCAPTCHA Keys (5 minutes)

### 1.1 Go to Google reCAPTCHA Admin
Visit: https://www.google.com/recaptcha/admin

### 1.2 Create New Site
1. Click **"+"** button (top right)
2. Fill in the form:
   - **Label:** `Dr. Boitumelo Wellness`
   - **reCAPTCHA type:** Select **reCAPTCHA v3**
   - **Domains:**
     - Add: `localhost` (for local testing)
     - Add: `drboitumelowellness.co.za` (your live domain)
     - Add: `www.drboitumelo wellness.co.za` (if using www)
   - **Accept the Terms of Service**
3. Click **Submit**

### 1.3 Save Your Keys
You'll get two keys:
- **Site Key** (public) - Example: `6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Secret Key** (private) - Example: `6LcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`

⚠️ **IMPORTANT:** Keep the Secret Key private! Never commit it to Git!

---

## Step 2: Add Environment Variable

### 2.1 Add to Local `.env` File
Add this line to your `.env` file:
```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

### 2.2 Add to Netlify Environment Variables
1. Go to Netlify Dashboard
2. Select your site → Site settings → Environment variables
3. Click **Add a variable**
4. Add:
   - **Key:** `VITE_RECAPTCHA_SITE_KEY`
   - **Value:** `your_site_key_here` (the public site key from Google)
5. Click **Save**

---

## Step 3: Install reCAPTCHA Package

Run this command in your terminal:
```bash
npm install react-google-recaptcha-v3
```

---

## Step 4: Wrap Your App with reCAPTCHA Provider

### Update `src/main.jsx`:

Find your current `main.jsx` and wrap the app with the reCAPTCHA provider:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </GoogleReCaptchaProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## Step 5: Use reCAPTCHA in Forms

### Example 1: Contact Form

Update your contact form component to use reCAPTCHA:

```jsx
import { useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const ContactForm = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!executeRecaptcha) {
      console.log('reCAPTCHA not loaded');
      return;
    }

    setSubmitting(true);

    try {
      // Get reCAPTCHA token
      const token = await executeRecaptcha('contact_form');

      // Verify token is valid (score above 0.5 means likely human)
      // You can do this verification on your backend (recommended)
      // Or just include the token in your form submission

      // Submit form with token
      const response = await fetch('your-api-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recaptchaToken: token
        })
      });

      if (response.ok) {
        alert('Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
        required
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        placeholder="Message"
        required
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
};
```

---

## Step 6: Which Forms Need reCAPTCHA?

### High Priority (Most Important):
1. **Contact Form** (`src/pages/Contact.jsx`)
2. **Review Submission** (`src/components/ui/ReviewModal.jsx`)
3. **Booking Form** (`src/components/ui/BookingModal.jsx`)
4. **Prescription Request** (`src/components/ui/PrescriptionRequestModal.jsx`)

### Medium Priority:
5. **Admin Login** (`src/pages/Admin/AdminLogin.jsx`) - Optional but recommended

---

## Step 7: Verify Token on Backend (OPTIONAL BUT RECOMMENDED)

For maximum security, verify the token on your backend (Netlify Function or Supabase Edge Function):

```javascript
// Example Netlify Function
export async function handler(event) {
  const { recaptchaToken, ...formData } = JSON.parse(event.body);

  // Verify token with Google
  const verifyResponse = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=YOUR_SECRET_KEY&response=${recaptchaToken}`
    }
  );

  const verifyData = await verifyResponse.json();

  // Check if score is above threshold (0.5 is good default)
  if (verifyData.success && verifyData.score >= 0.5) {
    // Process form submission
    return { statusCode: 200, body: 'Success' };
  } else {
    // Reject as potential bot
    return { statusCode: 403, body: 'Failed reCAPTCHA verification' };
  }
}
```

---

## Step 8: Testing

### Local Testing:
1. Start your dev server: `npm run dev`
2. Submit a form
3. Check browser console for "reCAPTCHA token: ..." message
4. No errors = working correctly ✓

### Production Testing:
1. Deploy to Netlify
2. Test on live site
3. Go to [reCAPTCHA Admin](https://www.google.com/recaptcha/admin) → Analytics
4. You should see requests coming in

---

## 🎯 Quick Implementation for Your Website

Since you're using Make.com webhooks for most forms, the simplest approach:

### Option 1: Frontend-Only (Easiest - 15 minutes)
Just get the token and include it in webhook payload:

```jsx
const token = await executeRecaptcha('form_submit');

await fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify({
    ...formData,
    recaptchaToken: token,
    recaptchaScore: 'verify on make.com'  // You can verify on Make.com side
  })
});
```

### Option 2: With Backend Verification (Most Secure - 30 minutes)
1. Create a Netlify Function to verify tokens
2. Forms submit to Netlify Function first
3. Function verifies token → then triggers Make.com webhook

---

## 📊 Understanding Scores

reCAPTCHA v3 returns a score from 0.0 to 1.0:
- **1.0** = Very likely a legitimate user
- **0.5** = Unclear (default threshold)
- **0.0** = Very likely a bot

### Recommended Thresholds:
- **Contact/Review Forms:** 0.5
- **Booking/Prescription:** 0.3 (more lenient, don't want to block real patients)
- **Admin Login:** 0.7 (more strict)

---

## 🚨 Important Notes

1. **Site Key vs Secret Key:**
   - Site Key = Public (goes in frontend code)
   - Secret Key = Private (NEVER put in frontend, only backend)

2. **Rate Limits:**
   - Free tier: 1 million assessments/month
   - Should be plenty for your site

3. **Privacy:**
   - reCAPTCHA v3 runs on every page
   - Shows badge in bottom-right corner
   - Can hide badge with CSS (but must keep Terms of Service link visible)

4. **Testing:**
   - Use `localhost` domain during development
   - Tokens are domain-specific

---

## 🎨 Optional: Hide reCAPTCHA Badge

If you want to hide the badge (must keep ToS in footer):

```css
/* Add to your global CSS */
.grecaptcha-badge {
  visibility: hidden;
}
```

Then add this to your footer:
```html
<p className="text-xs text-gray-500">
  This site is protected by reCAPTCHA and the Google{' '}
  <a href="https://policies.google.com/privacy">Privacy Policy</a> and{' '}
  <a href="https://policies.google.com/terms">Terms of Service</a> apply.
</p>
```

---

## ✅ Checklist

- [ ] Get reCAPTCHA keys from Google
- [ ] Add `VITE_RECAPTCHA_SITE_KEY` to `.env`
- [ ] Add `VITE_RECAPTCHA_SITE_KEY` to Netlify
- [ ] Install `npm install react-google-recaptcha-v3`
- [ ] Wrap app with `GoogleReCaptchaProvider` in `main.jsx`
- [ ] Add reCAPTCHA to contact form
- [ ] Add reCAPTCHA to review form
- [ ] Add reCAPTCHA to booking form
- [ ] Add reCAPTCHA to prescription request form
- [ ] Test locally
- [ ] Deploy and test on production
- [ ] Monitor reCAPTCHA analytics

---

## 🆘 Troubleshooting

### "reCAPTCHA not loaded" error
- Make sure `GoogleReCaptchaProvider` wraps your entire app
- Check that `VITE_RECAPTCHA_SITE_KEY` is set

### "Invalid domain" error
- Make sure you added your domain in reCAPTCHA admin
- For local testing, add `localhost`

### Badge not showing
- This is normal for v3 - it's invisible
- Badge only shows in bottom-right corner

---

## 📚 Resources

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [react-google-recaptcha-v3 Documentation](https://www.npmjs.com/package/react-google-recaptcha-v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)

---

**Need help? Let me know and I can implement it for you!**
