# Make.com Automation Guide - Lead Capture & AI Follow-up

## Overview
This guide will help you set up Make.com automations to capture abandoned carts and abandoned bookings, then have an AI agent follow up via phone call.

## Automations We'll Create

### 1. Abandoned Cart Recovery
**Trigger**: Customer enters checkout details but doesn't complete purchase
**Action**: Send data to Make.com → AI agent calls customer

### 2. Abandoned Booking Recovery
**Trigger**: Patient enters info but doesn't complete booking
**Action**: Send data to Make.com → AI agent calls patient

## Part 1: Set Up Make.com Webhooks

### Step 1: Create Make.com Account
1. Go to https://www.make.com
2. Sign up for free account
3. Verify your email

### Step 2: Create Abandoned Cart Scenario

1. **Create New Scenario**
   - Click "Create a new scenario"
   - Name it: "Abandoned Cart - AI Follow-up"

2. **Add Webhook Trigger**
   - Click the `+` button
   - Search for "Webhooks"
   - Select "Custom webhook"
   - Click "Create a webhook"
   - Name it: "Abandoned Cart Webhook"
   - Click "Save"
   - **Copy the webhook URL** (you'll need this!)

3. **Configure Data Structure**
   The webhook will receive this data:
   ```json
   {
     "type": "abandoned_cart",
     "timestamp": "2024-01-15T10:30:00Z",
     "customer": {
       "name": "John Doe",
       "email": "john@example.com",
       "phone": "+27 81 234 5678",
       "address": "123 Main St",
       "city": "Johannesburg",
       "postalCode": "2001"
     },
     "cart": {
       "items": [
         {
           "id": "1",
           "name": "Vitamin D3 Capsules",
           "price": 299.99,
           "quantity": 2
         }
       ],
       "total": 599.98,
       "itemCount": 2
     }
   }
   ```

4. **Add AI Calling Module**
   - Click `+` after the webhook
   - Search for your AI calling service (e.g., Bland.ai, Vapi, Synthflow)
   - Configure with:
     - **Phone Number**: `{{customer.phone}}`
     - **Customer Name**: `{{customer.name}}`
     - **Script Variables**:
       - Items: `{{cart.items}}`
       - Total: `{{cart.total}}`
       - Cart URL: `https://yourwebsite.com/shop`

5. **Save & Activate**
   - Click "Save" (bottom right)
   - Toggle "Scheduling" to ON
   - Your webhook URL is ready!

### Step 3: Create Abandoned Booking Scenario

1. **Create Another Scenario**
   - Click "Scenarios" → "Create a new scenario"
   - Name it: "Abandoned Booking - AI Follow-up"

2. **Add Webhook Trigger**
   - Add "Custom webhook"
   - Name it: "Abandoned Booking Webhook"
   - **Copy the webhook URL**

3. **Configure Data Structure**
   The webhook will receive:
   ```json
   {
     "type": "abandoned_booking",
     "timestamp": "2024-01-15T10:30:00Z",
     "patient": {
       "name": "Jane Smith",
       "email": "jane@example.com",
       "phone": "+27 82 345 6789"
     },
     "booking": {
       "type": "virtual",
       "preferredDate": "2024-01-20",
       "preferredTime": "10:00",
       "symptoms": "Fatigue and low energy"
     }
   }
   ```

4. **Add AI Calling Module**
   - Configure with:
     - **Phone Number**: `{{patient.phone}}`
     - **Patient Name**: `{{patient.name}}`
     - **Script Variables**:
       - Consultation Type: `{{booking.type}}`
       - Preferred Date: `{{booking.preferredDate}}`
       - Symptoms: `{{booking.symptoms}}`
       - Booking URL: `https://yourwebsite.com/`

5. **Save & Activate**

## Part 2: Get Your Webhook URLs

After creating both scenarios, you should have:

1. **Abandoned Cart Webhook URL**
   - Example: `https://hook.us1.make.com/abc123def456ghi789`

2. **Abandoned Booking Webhook URL**
   - Example: `https://hook.us1.make.com/xyz789uvw456rst123`

**Save these URLs!** You'll add them to your `.env` file.

## Part 3: Add Webhooks to Your Website

### Update .env File

Add these lines to your `.env` file:

```env
VITE_MAKE_ABANDONED_CART_WEBHOOK=your_abandoned_cart_webhook_url_here
VITE_MAKE_ABANDONED_BOOKING_WEBHOOK=your_abandoned_booking_webhook_url_here
```

Replace with your actual Make.com webhook URLs from Part 2.

## Part 4: How It Works

### Abandoned Cart Flow

1. **Customer enters checkout page**
   - Fills in name, email, phone, address
   - Adds items to cart

2. **Customer fills form but doesn't click "Complete Order"**
   - After 3 seconds of inactivity, data is sent to Make.com
   - OR when they close the tab/navigate away

3. **Make.com receives data**
   - Webhook triggers
   - Data passed to AI agent

4. **AI agent makes call**
   - Calls customer's phone number
   - Mentions specific items in cart
   - Offers to help complete purchase
   - Can provide discount code

### Abandoned Booking Flow

1. **Patient enters booking modal**
   - Fills in name, email, phone
   - Selects date/time preference
   - Enters symptoms

2. **Patient fills form but doesn't complete booking**
   - After moving to last step but not submitting
   - Data sent to Make.com

3. **Make.com receives data**
   - Webhook triggers
   - Data passed to AI agent

4. **AI agent makes call**
   - Calls patient's phone number
   - References their symptoms
   - Offers to help book appointment
   - Can answer questions about the process

## Part 5: AI Agent Script Examples

### Abandoned Cart Script

```
Hi [Customer Name], this is [AI Assistant Name] from Dr. Boitumelo Wellness.

I noticed you were interested in purchasing [list items] from our online shop,
but it looks like you didn't complete your order.

Is there anything I can help you with? Perhaps you had questions about:
- Shipping details
- Product information
- Payment options

I'd be happy to assist you in completing your order, or I can have
someone from our team call you back at a better time. What would work best for you?

[If interested]: Great! I can help you complete your order now, or would you
prefer to do it online? I can also offer you a 10% discount code if that helps: WELLNESS10

[End]: Thank you for your interest in Dr. Boitumelo Wellness! Have a great day.
```

### Abandoned Booking Script

```
Hi [Patient Name], this is [AI Assistant Name] from Dr. Boitumelo Wellness.

I noticed you started booking a [consultation type] appointment with us regarding
[mention symptoms if provided], but didn't complete the booking process.

I wanted to reach out to see if:
- You had any questions about our services
- You needed help selecting a date and time
- There was any technical issue with the booking

I can help you complete your booking right now over the phone, or I can schedule
a call back from Dr. Boitumelo's office. Which would you prefer?

[If interested]: Perfect! Let me help you with that. What date and time work best
for your schedule?

[End]: We look forward to helping you with your wellness journey. Take care!
```

## Part 6: Recommended AI Calling Services

### Option 1: Bland.ai
- **Best for**: Simple, affordable AI calls
- **Pricing**: Pay per minute
- **Setup**: Easy integration with Make.com
- **URL**: https://www.bland.ai

### Option 2: Vapi
- **Best for**: Advanced conversational AI
- **Pricing**: Per minute + features
- **Setup**: Make.com compatible
- **URL**: https://vapi.ai

### Option 3: Synthflow
- **Best for**: No-code AI voice agents
- **Pricing**: Monthly plans
- **Setup**: Direct Make.com integration
- **URL**: https://synthflow.ai

### Option 4: Retell AI
- **Best for**: Realistic conversations
- **Pricing**: Usage-based
- **Setup**: API compatible with Make.com

## Part 7: Testing Your Automations

### Test Abandoned Cart

1. Go to your website shop
2. Add items to cart
3. Click checkout
4. Fill in all details (use test phone number)
5. **Don't click "Complete Order"**
6. Wait 5 seconds or close tab
7. Check Make.com scenario execution history
8. Verify webhook received data

### Test Abandoned Booking

1. Go to booking modal
2. Fill in patient info (use test phone number)
3. Select date and time
4. Fill in symptoms
5. **Don't click final "Book Appointment"**
6. Close modal or navigate away
7. Check Make.com scenario execution
8. Verify webhook received data

## Part 8: Advanced Features

### Add Email Follow-up

After the AI call, send a follow-up email:

1. In Make.com scenario, add "Email" module after AI call
2. Configure:
   - **To**: `{{customer.email}}`
   - **Subject**: "Complete Your Order - Special Offer Inside"
   - **Body**: Include cart items, discount code, direct link

### Add SMS Reminder

Before the AI call, send SMS:

1. Add "SMS" module (Twilio, etc.)
2. Send: "Hi [Name], we noticed you left items in your cart. Reply YES if you'd like us to call you to complete your order."
3. Only trigger AI call if they reply YES

### Track Conversions

1. Add "Supabase" module after AI call
2. Create table: `lead_follow_ups`
3. Log:
   - Lead ID
   - Type (cart/booking)
   - Call outcome
   - Conversion (yes/no)
   - Notes

## Part 9: Privacy & Compliance

### POPIA Compliance (South Africa)

Since you're capturing personal data:

1. **Add Consent Checkbox**
   - "I agree to be contacted about my abandoned cart/booking"
   - Only send data if checked

2. **Privacy Policy**
   - Update to mention automated follow-up
   - Explain data usage
   - Provide opt-out option

3. **Data Retention**
   - Delete data after 30 days if no conversion
   - Provide unsubscribe option

### Best Practices

- ✅ Only call during business hours (9am-5pm)
- ✅ Maximum 2 call attempts
- ✅ Provide opt-out in first call
- ✅ Respect "Do Not Call" requests
- ✅ Keep calls under 3 minutes
- ✅ Be helpful, not pushy

## Part 10: Cost Estimates

### Make.com
- **Free Plan**: 1,000 operations/month (good for testing)
- **Core Plan**: $9/month - 10,000 operations
- **Pro Plan**: $16/month - 10,000 operations + premium apps

### AI Calling (Average)
- **Per Call**: $0.10 - $0.30 per minute
- **Per Month**: Depends on volume
  - 50 calls/month @ 2 min each = ~$15-30
  - 200 calls/month @ 2 min each = ~$60-120

### Total Estimated Cost
- **Low Volume** (50 abandoned/month): ~$25-40/month
- **Medium Volume** (200 abandoned/month): ~$75-135/month

## Quick Setup Checklist

- [ ] Create Make.com account
- [ ] Create Abandoned Cart scenario
- [ ] Create Abandoned Booking scenario
- [ ] Copy both webhook URLs
- [ ] Add URLs to `.env` file
- [ ] Choose AI calling service
- [ ] Connect AI service to Make.com
- [ ] Write AI agent scripts
- [ ] Test with dummy data
- [ ] Add privacy consent checkboxes
- [ ] Update privacy policy
- [ ] Go live!

## Next Steps

Once you have your Make.com webhook URLs:
1. Give them to me
2. I'll integrate them into your CartModal and BookingModal
3. We'll test the complete flow
4. You'll start capturing leads automatically!

---

**Questions or need help?** Let me know your Make.com webhook URLs and which AI calling service you want to use, and I'll complete the integration! 🚀
