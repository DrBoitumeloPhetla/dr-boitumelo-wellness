# Make.com Scenario Templates

This document provides complete step-by-step templates for setting up your Make.com automation scenarios for abandoned cart and abandoned booking recovery.

## Table of Contents
1. [Scenario 1: Abandoned Cart Recovery](#scenario-1-abandoned-cart-recovery)
2. [Scenario 2: Abandoned Booking Recovery](#scenario-2-abandoned-booking-recovery)
3. [Scenario 3: Lead Capture Early Warning](#scenario-3-lead-capture-early-warning)
4. [Testing Your Scenarios](#testing-your-scenarios)

---

## Scenario 1: Abandoned Cart Recovery

### Overview
**Trigger:** Customer adds items to cart, fills in contact info, but doesn't complete payment
**Goal:** AI agent calls customer within 5 minutes to help complete the purchase

### Step-by-Step Setup

#### Module 1: Webhook Trigger
1. In Make.com, create a new scenario
2. Click the "+" button to add a module
3. Search for "Webhooks" and select "Custom Webhook"
4. Click "Create a webhook"
5. Name it: "Abandoned Cart - Dr Boitumelo Wellness"
6. Click "Save"
7. **COPY THE WEBHOOK URL** - you'll add this to your `.env` file as `VITE_MAKE_ABANDONED_CART_WEBHOOK`
8. Keep this webhook structure:
   ```json
   {
     "type": "abandoned_cart",
     "timestamp": "2025-11-01T10:30:00.000Z",
     "customer": {
       "name": "John Doe",
       "email": "john@example.com",
       "phone": "+27123456789",
       "address": "123 Main St",
       "city": "Johannesburg",
       "postalCode": "2000"
     },
     "cart": {
       "items": [
         {
           "id": "vitamin-d-supplement",
           "name": "Vitamin D3 Supplement",
           "price": 250,
           "quantity": 2,
           "total": 500
         }
       ],
       "total": 500,
       "itemCount": 2
     },
     "websiteUrl": "https://drboitumelowellness.co.za",
     "cartUrl": "https://drboitumelowellness.co.za/shop"
   }
   ```

#### Module 2: Data Processing (Optional but Recommended)
1. Add a "Router" module to handle different scenarios
2. Create two routes:
   - **Route 1:** `{{1.cart.total}} > 200` (High-value carts - immediate call)
   - **Route 2:** `{{1.cart.total}} <= 200` (Low-value carts - wait 10 minutes)

#### Module 3: AI Calling Service (Choose ONE)

**Option A: Using Bland.ai**
1. Add "HTTP" module (Make a request)
2. Set URL: `https://api.bland.ai/v1/calls`
3. Set Method: POST
4. Add Headers:
   - `Authorization`: `YOUR_BLAND_API_KEY`
   - `Content-Type`: `application/json`
5. Body (JSON):
   ```json
   {
     "phone_number": "{{1.customer.phone}}",
     "task": "You are a friendly wellness consultant from Dr Boitumelo Phetla's office. A customer named {{1.customer.name}} was interested in purchasing {{join(map(1.cart.items, 'name'), ', ')}} totaling R{{1.cart.total}}. Your goal is to help them complete their purchase. Ask if they had any questions, offer assistance, and gently encourage them to finish their order. Be warm and professional. If they want to complete the order, direct them to {{1.cartUrl}}",
     "voice": "maya",
     "first_sentence": "Hello, is this {{1.customer.name}}? I'm calling from Dr Boitumelo Phetla's Wellness Practice.",
     "record": true,
     "language": "eng"
   }
   ```

**Option B: Using Vapi.ai**
1. Add "HTTP" module (Make a request)
2. Set URL: `https://api.vapi.ai/call`
3. Set Method: POST
4. Add Headers:
   - `Authorization`: `Bearer YOUR_VAPI_API_KEY`
   - `Content-Type`: `application/json`
5. Body (JSON):
   ```json
   {
     "phoneNumber": "{{1.customer.phone}}",
     "assistant": {
       "firstMessage": "Hello, is this {{1.customer.name}}? I'm calling from Dr Boitumelo Phetla's Wellness Practice about your recent interest in our products.",
       "context": "Customer abandoned cart with items: {{join(map(1.cart.items, 'name'), ', ')}}. Cart total: R{{1.cart.total}}. Goal: Help complete purchase. Be friendly and helpful.",
       "model": "gpt-4",
       "voice": "jennifer"
     }
   }
   ```

**Option C: Using Synthflow (No-Code)**
1. Add "Synthflow" module (if available in Make.com)
2. Or use "HTTP" module with Synthflow API
3. Configure with your Synthflow AI agent ID
4. Pass customer data and cart items

#### Module 4: Log the Call
1. Add "Google Sheets" or "Airtable" module
2. Create a row with:
   - Customer Name: `{{1.customer.name}}`
   - Phone: `{{1.customer.phone}}`
   - Email: `{{1.customer.email}}`
   - Cart Total: `{{1.cart.total}}`
   - Items: `{{join(map(1.cart.items, 'name'), ', ')}}`
   - Call Status: `{{3.status}}`
   - Timestamp: `{{1.timestamp}}`

#### Module 5: Send Email Backup
1. Add "Gmail" or "Email" module
2. Send to: `{{1.customer.email}}`
3. Subject: "Complete Your Order - Dr Boitumelo Wellness"
4. Body:
   ```html
   Hi {{1.customer.name}},

   We noticed you were interested in:
   {{join(map(1.cart.items, 'name'), '
   ')}}

   Total: R{{1.cart.total}}

   Complete your order here: {{1.cartUrl}}

   Need help? Reply to this email or call us at +27 XX XXX XXXX.

   Warm regards,
   Dr Boitumelo Phetla
   ```

---

## Scenario 2: Abandoned Booking Recovery

### Overview
**Trigger:** Patient starts booking consultation, fills in info, but doesn't complete
**Goal:** AI agent calls patient within 5 minutes to help schedule appointment

### Step-by-Step Setup

#### Module 1: Webhook Trigger
1. Create new scenario in Make.com
2. Add "Webhooks" → "Custom Webhook"
3. Name it: "Abandoned Booking - Dr Boitumelo Wellness"
4. Click "Save"
5. **COPY THE WEBHOOK URL** - add to `.env` as `VITE_MAKE_ABANDONED_BOOKING_WEBHOOK`
6. Expected webhook structure:
   ```json
   {
     "type": "abandoned_booking",
     "timestamp": "2025-11-01T10:30:00.000Z",
     "patient": {
       "name": "Jane Smith",
       "email": "jane@example.com",
       "phone": "+27123456789"
     },
     "booking": {
       "type": "virtual",
       "preferredDate": "2025-11-05",
       "preferredTime": "14:00",
       "symptoms": "Chronic fatigue, low energy",
       "symptomsStartDate": "2025-10-01",
       "vitaminDTest": "yes",
       "additionalNotes": "Would like to discuss vitamin D deficiency"
     },
     "websiteUrl": "https://drboitumelowellness.co.za",
     "bookingUrl": "https://drboitumelowellness.co.za/"
   }
   ```

#### Module 2: Check Business Hours (Optional)
1. Add "Tools" → "Get variable"
2. Set current time variable
3. Add "Filter" to only proceed during business hours (9am-5pm)

#### Module 3: AI Calling Service

**Option A: Using Bland.ai**
1. Add "HTTP" module
2. URL: `https://api.bland.ai/v1/calls`
3. Method: POST
4. Headers:
   - `Authorization`: `YOUR_BLAND_API_KEY`
   - `Content-Type`: `application/json`
5. Body:
   ```json
   {
     "phone_number": "{{1.patient.phone}}",
     "task": "You are a compassionate healthcare assistant from Dr Boitumelo Phetla's practice. {{1.patient.name}} was scheduling a {{1.booking.type}} consultation for {{formatDate(1.booking.preferredDate, 'MMMM D')}} at {{1.booking.preferredTime}} regarding {{1.booking.symptoms}}. Your goal is to help them complete the booking. Ask if they need any assistance, answer questions about the consultation process, and help them finalize their appointment. Be empathetic and professional.",
     "voice": "maya",
     "first_sentence": "Hello, is this {{1.patient.name}}? I'm calling from Dr Boitumelo Phetla's practice about scheduling your consultation.",
     "record": true,
     "language": "eng"
   }
   ```

**Option B: Using Retell AI (Healthcare-specific)**
1. Add "HTTP" module
2. URL: `https://api.retellai.com/create-call`
3. Method: POST
4. Body:
   ```json
   {
     "to_number": "{{1.patient.phone}}",
     "from_number": "YOUR_RETELL_NUMBER",
     "agent_id": "YOUR_AGENT_ID",
     "metadata": {
       "patient_name": "{{1.patient.name}}",
       "booking_type": "{{1.booking.type}}",
       "symptoms": "{{1.booking.symptoms}}",
       "preferred_date": "{{1.booking.preferredDate}}",
       "preferred_time": "{{1.booking.preferredTime}}"
     }
   }
   ```

#### Module 4: Update CRM/Database
1. Add "Supabase" module (via HTTP)
2. URL: `https://ffjqzvrgjwvcabkqidzw.supabase.co/rest/v1/contacts`
3. Method: POST
4. Headers:
   - `apikey`: `YOUR_SUPABASE_ANON_KEY`
   - `Content-Type`: `application/json`
5. Body:
   ```json
   {
     "name": "{{1.patient.name}}",
     "email": "{{1.patient.email}}",
     "phone": "{{1.patient.phone}}",
     "service_type": "Abandoned Booking Recovery",
     "message": "Attempted booking for {{1.booking.type}} consultation. Called by AI agent.",
     "status": "contacted"
   }
   ```

#### Module 5: Send SMS Reminder
1. Add "Twilio" or "SMS" module
2. To: `{{1.patient.phone}}`
3. Message:
   ```
   Hi {{1.patient.name}}, this is Dr Boitumelo Phetla's practice.

   We're here to help schedule your consultation for {{formatDate(1.booking.preferredDate, 'MMMM D')}}.

   Book online: {{1.bookingUrl}}

   Reply HELP for assistance.
   ```

---

## Scenario 3: Lead Capture Early Warning

### Overview
**Trigger:** Customer/patient fills in basic contact info (name, email, phone)
**Goal:** Capture lead immediately, send to CRM, optionally trigger follow-up

### Step-by-Step Setup

#### Module 1: Webhook Trigger
1. Use the SAME webhooks from Scenarios 1 & 2
2. Add a "Router" at the start to handle different types:
   - **Route 1:** `{{1.type}} = "lead_capture_cart"`
   - **Route 2:** `{{1.type}} = "lead_capture_booking"`
   - **Route 3:** `{{1.type}} = "abandoned_cart"`
   - **Route 4:** `{{1.type}} = "abandoned_booking"`

#### Module 2: Save to Google Sheets (Lead Database)
1. Add "Google Sheets" → "Add a row"
2. Spreadsheet: "Dr Boitumelo Wellness Leads"
3. Sheet: "All Leads"
4. Values:
   - Name: `{{1.lead.name}}`
   - Email: `{{1.lead.email}}`
   - Phone: `{{1.lead.phone}}`
   - Source: `{{1.source}}`
   - Type: `{{1.type}}`
   - Status: "New Lead"
   - Timestamp: `{{1.timestamp}}`

#### Module 3: Add to Email Marketing (Optional)
1. Add "Mailchimp" or "ActiveCampaign" module
2. Add subscriber:
   - Email: `{{1.lead.email}}`
   - First Name: `{{1.lead.name}}`
   - Phone: `{{1.lead.phone}}`
   - Tag: "Website Lead - {{1.source}}"

#### Module 4: Notify Admin via Slack/Email
1. Add "Slack" → "Send a message" or "Gmail" module
2. Message:
   ```
   🔔 NEW LEAD CAPTURED!

   Name: {{1.lead.name}}
   Phone: {{1.lead.phone}}
   Email: {{1.lead.email}}
   Source: {{1.source}}
   Type: {{1.type}}
   Time: {{formatDate(1.timestamp, 'HH:mm:ss')}}

   This lead has shown interest but hasn't completed yet.
   ```

---

## Advanced: Combined Scenario with Smart Routing

### Complete Flow with Decision Logic

```
[Webhook Trigger]
       |
       v
   [Router by Type]
       |
       +---> [lead_capture_cart] --> Save to CRM --> Email Marketing
       |
       +---> [lead_capture_booking] --> Save to CRM --> Email Marketing
       |
       +---> [abandoned_cart] --> Router by Value
       |                              |
       |                              +---> [Total > R500] --> Immediate AI Call
       |                              |
       |                              +---> [Total <= R500] --> Wait 10 min --> AI Call
       |
       +---> [abandoned_booking] --> Check Business Hours
                                          |
                                          +---> [Yes] --> Immediate AI Call
                                          |
                                          +---> [No] --> Schedule for 9am next day
```

---

## AI Agent Script Templates

### Script 1: Abandoned Cart (High-Value)
```
You are a friendly wellness consultant from Dr Boitumelo Phetla's practice.

CONTEXT:
- Customer Name: {{customer.name}}
- Items in Cart: {{cart.items}}
- Total Value: R{{cart.total}}
- They were browsing but didn't complete purchase

YOUR GOAL:
Help them complete their purchase without being pushy.

CONVERSATION FLOW:
1. Warm greeting: "Hello, is this {{customer.name}}? I'm calling from Dr Boitumelo Phetla's Wellness Practice."

2. Acknowledge interest: "I noticed you were interested in our {{main_product_name}}. That's one of our most popular products!"

3. Offer help: "I wanted to reach out to see if you had any questions or if there's anything I can help you with?"

4. Address concerns:
   - If price concern: "We do offer payment plans for orders over R500"
   - If product question: "The {{product}} is specifically formulated for..."
   - If shipping concern: "We offer free shipping on orders over R300"

5. Gentle close: "Would you like me to help you complete your order? I can send you a direct link via SMS."

6. Thank them: "Thank you so much for considering Dr Boitumelo's products. We're here if you need anything!"

TONE: Warm, professional, helpful, not pushy
FORBIDDEN: Never pressure, never be rude, never argue
```

### Script 2: Abandoned Booking (Consultation)
```
You are a compassionate healthcare assistant from Dr Boitumelo Phetla's practice.

CONTEXT:
- Patient Name: {{patient.name}}
- Consultation Type: {{booking.type}} (virtual or telephonic)
- Preferred Date: {{booking.preferredDate}}
- Symptoms: {{booking.symptoms}}
- They started booking but didn't complete payment

YOUR GOAL:
Help them complete their appointment booking with empathy.

CONVERSATION FLOW:
1. Warm greeting: "Hello, is this {{patient.name}}? I'm calling from Dr Boitumelo Phetla's practice."

2. Acknowledge their needs: "I see you were scheduling a {{booking.type}} consultation with Dr Phetla regarding {{brief_symptom_mention}}."

3. Show empathy: "We understand that dealing with {{symptoms}} can be challenging, and we'd love to help you."

4. Offer assistance: "I wanted to check if you had any questions about the consultation process or if there's anything preventing you from completing your booking?"

5. Address concerns:
   - If cost concern: "Consultations are R{{consultation_price}}. We do accept medical aid and can help with claims."
   - If time concern: "Dr Phetla has several time slots available. Would {{alternative_time}} work better?"
   - If technical issue: "I can help you complete the booking right now over the phone if that's easier."

6. Provide reassurance: "Dr Phetla specializes in {{relevant_specialty}} and has helped many patients with similar concerns."

7. Gentle close: "Would you like to confirm your appointment for {{booking.preferredDate}} at {{booking.preferredTime}}?"

8. Next steps: "Perfect! I'll send you a confirmation via SMS and email with all the details."

TONE: Empathetic, professional, reassuring, patient-focused
FORBIDDEN: Never diagnose, never minimize symptoms, never rush
REMEMBER: This is healthcare - prioritize patient comfort and trust
```

---

## Testing Your Scenarios

### Test Mode Setup
1. In each scenario, click the "Run once" button
2. This will wait for a webhook trigger
3. Keep the Make.com tab open

### Test from Your Website
1. Go to your website: http://localhost:5173
2. Add items to cart → fill in checkout form → wait 7 seconds → close modal
3. Check Make.com - you should see the scenario execute
4. Check your phone/email for AI call or messages

### Test Data
Use test phone numbers and emails:
- Your own phone for testing AI calls
- `test@example.com` for email testing
- Test credit cards (if payment integration added)

### What to Verify
- ✅ Webhook receives correct data structure
- ✅ Customer/patient data passes through correctly
- ✅ AI agent receives proper context
- ✅ Calls are made within expected timeframe
- ✅ Data logs to Google Sheets/CRM
- ✅ Email backups send successfully

---

## POPIA Compliance Checklist

Before going live with AI calling:

- [ ] Add privacy notice to website about automated follow-up calls
- [ ] Include opt-out option: "Reply STOP to opt out of calls"
- [ ] Store consent: "By proceeding, you agree to receive follow-up calls"
- [ ] Provide clear identification: AI must say "I'm an automated assistant"
- [ ] Respect opt-outs: Maintain do-not-call list in Make.com
- [ ] Record calls: For quality and compliance (check AI platform settings)
- [ ] Limit call attempts: Maximum 2 calls per abandoned action

### Sample Privacy Notice
```
By providing your phone number, you agree to receive follow-up calls
and SMS from Dr Boitumelo Phetla's practice to assist with your order
or appointment. Reply STOP to opt out. Standard rates may apply.
```

---

## Cost Estimates

### Make.com
- **Free Plan:** 1,000 operations/month
- **Core Plan:** R170/month - 10,000 operations
- **Pro Plan:** R275/month - 40,000 operations

### AI Calling Services (per minute)
- **Bland.ai:** R2.50/min
- **Vapi.ai:** R1.80/min
- **Synthflow:** R3.00/min
- **Retell AI:** R2.20/min

### Example Monthly Cost (100 abandoned carts/bookings)
- Make.com Core: R170
- AI Calls (avg 2 min/call × 100): R250-R350
- SMS (optional backup): R50
- **Total:** ~R470-R570/month

---

## Support Resources

- **Make.com Academy:** https://www.make.com/en/academy
- **Bland.ai Docs:** https://docs.bland.ai
- **Vapi Docs:** https://docs.vapi.ai
- **Webhook Testing:** Use Make.com's "Run once" feature
- **This Project's Guide:** See `MAKE_AUTOMATION_GUIDE.md` for more details

---

## Quick Start Checklist

1. [ ] Create Make.com account (free trial)
2. [ ] Set up Scenario 1 (Abandoned Cart)
3. [ ] Copy webhook URL to `.env` file
4. [ ] Test with your website's cart
5. [ ] Verify data appears in Make.com
6. [ ] Set up Scenario 2 (Abandoned Booking)
7. [ ] Copy webhook URL to `.env` file
8. [ ] Test with booking form
9. [ ] Choose AI calling provider
10. [ ] Sign up and get API key
11. [ ] Add AI calling module to scenarios
12. [ ] Test end-to-end with your phone
13. [ ] Monitor first week of calls
14. [ ] Adjust scripts based on results

**You're all set!** These scenarios will automatically recover abandoned carts and bookings with AI-powered phone calls.
