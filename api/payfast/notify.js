// PayFast ITN (Instant Transaction Notification) webhook.
//
// This is the server-side safety net. PayFast POSTs payment confirmation
// to this endpoint regardless of whether the customer's browser returned
// to the success page. Without this, orders/bookings/registrations could
// be permanently lost when mobile browsers kill the tab or banking apps
// redirect to a different browser context.
//
// Flow:
//   1. Receive ITN POST from PayFast (form-urlencoded)
//   2. Validate the ITN by posting the body back to PayFast's /validate
//      endpoint and checking the response is "VALID"
//   3. If payment_status === COMPLETE, route by m_payment_id prefix:
//        ORD-*     -> update order, send Make.com order email
//        BOOK-*    -> update appointment, send Make.com appointment webhook
//        WEBINAR-* -> update registration, send Make.com payment-confirmed email
//   4. Each update is idempotent — if the record is already marked paid
//      we skip the webhook to avoid sending duplicate emails.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const PAYFAST_MODE = process.env.VITE_PAYFAST_MODE === 'live' ? 'live' : 'sandbox';
const MAKE_ORDER_WEBHOOK = process.env.VITE_MAKE_ORDER_WEBHOOK;
const MAKE_WEBINAR_WEBHOOK = process.env.VITE_MAKE_WEBINAR_APPROVAL_WEBHOOK;
const MAKE_APPOINTMENTS_WEBHOOK = process.env.VITE_MAKE_WEBHOOK_APPOINTMENTS;

const PAYFAST_VALIDATE_URL =
  PAYFAST_MODE === 'live'
    ? 'https://www.payfast.co.za/eng/query/validate'
    : 'https://sandbox.payfast.co.za/eng/query/validate';

// Post the original ITN body back to PayFast. They return "VALID" or "INVALID".
// This is the most reliable validation method — no signature math needed.
async function validateWithPayFast(body) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }

  const resp = await fetch(PAYFAST_VALIDATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const text = (await resp.text()).trim();
  return text === 'VALID';
}

function num(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
}

async function handleOrder(supabase, body) {
  const orderId = body.m_payment_id;

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error || !order) {
    console.error('ITN: order not found', orderId, error);
    return;
  }

  const alreadyProcessed = ['processing', 'completed', 'shipped', 'delivered'].includes(order.status);
  if (alreadyProcessed) {
    console.log('ITN: order already processed, skipping', orderId);
    return;
  }

  const { error: updErr } = await supabase
    .from('orders')
    .update({ status: 'processing' })
    .eq('order_id', orderId);
  if (updErr) {
    console.error('ITN: failed to update order', updErr);
    return;
  }

  if (!MAKE_ORDER_WEBHOOK) {
    console.warn('ITN: VITE_MAKE_ORDER_WEBHOOK not set, skipping email');
    return;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const payload = {
    type: 'new_order',
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    orderId: order.order_id,
    items: items.map((item) => {
      const price = num(item.price);
      return {
        name: item.name,
        quantity: item.quantity,
        price,
        total: (price * (item.quantity || 1)).toFixed(2),
      };
    }),
    subtotal: order.subtotal ? num(order.subtotal).toFixed(2) : num(order.total).toFixed(2),
    shipping: order.shipping ? num(order.shipping).toFixed(2) : '0.00',
    total: num(order.total).toFixed(2),
    timestamp: new Date().toISOString(),
  };

  await fetch(MAKE_ORDER_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function handleBooking(supabase, body) {
  const bookingId = body.m_payment_id;

  const { data: booking, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error || !booking) {
    console.error('ITN: booking not found', bookingId, error);
    return;
  }

  if (booking.payment_status === 'paid') {
    console.log('ITN: booking already paid, skipping', bookingId);
    return;
  }

  await supabase
    .from('appointments')
    .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
    .eq('booking_id', bookingId);

  if (!MAKE_APPOINTMENTS_WEBHOOK) {
    console.warn('ITN: VITE_MAKE_WEBHOOK_APPOINTMENTS not set, skipping webhook');
    return;
  }

  await fetch(MAKE_APPOINTMENTS_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'created',
      id: booking.booking_id,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      consultation_type: booking.consultation_type,
      appointment_date: booking.appointment_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      price: booking.price,
      location: booking.location,
      appointment_status: 'scheduled',
    }),
  });
}

async function handleWebinar(supabase, body) {
  const orderId = body.m_payment_id;
  const registrationId = orderId.replace(/^WEBINAR-/, '');
  const pfPaymentId = body.pf_payment_id || null;

  const { data: registration, error } = await supabase
    .from('webinar_registrations')
    .select('*, webinars(*)')
    .eq('id', registrationId)
    .maybeSingle();

  if (error || !registration) {
    console.error('ITN: webinar registration not found', registrationId, error);
    return;
  }

  if (registration.payment_status === 'paid') {
    console.log('ITN: webinar registration already paid, skipping', registrationId);
    return;
  }

  await supabase
    .from('webinar_registrations')
    .update({ payment_status: 'paid', payment_reference: pfPaymentId })
    .eq('id', registrationId);

  if (!MAKE_WEBINAR_WEBHOOK) {
    console.warn('ITN: VITE_MAKE_WEBINAR_APPROVAL_WEBHOOK not set, skipping email');
    return;
  }

  const webinarDateRaw = registration.webinars?.date;
  const formattedDate = webinarDateRaw
    ? new Date(webinarDateRaw).toLocaleDateString('en-ZA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Monthly';

  await fetch(MAKE_WEBINAR_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'webinar_payment_confirmed',
      registrationId: registration.id,
      firstName: registration.first_name,
      lastName: registration.last_name,
      email: registration.email,
      phone: registration.phone,
      profession: registration.profession,
      hpcsaNumber: registration.hpcsa_number,
      webinarTitle: registration.webinars?.title || 'Vitamin D Talks',
      webinarDate: formattedDate,
      webinarTime: '19h00 - 20h00 SAST',
      webinarPrice: registration.webinars?.price,
      paymentReference: pfPaymentId,
      timestamp: new Date().toISOString(),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const body = req.body;
  if (!body || typeof body !== 'object') {
    console.error('ITN: invalid body shape');
    return res.status(400).send('Invalid body');
  }

  // Always respond 200 to PayFast quickly. PayFast retries if it doesn't get
  // a 200 within a few seconds — we'd rather take time to process correctly
  // than block on PayFast's retry logic.

  try {
    const valid = await validateWithPayFast(body);
    if (!valid) {
      console.error('ITN: PayFast validate-back returned INVALID', { m_payment_id: body.m_payment_id });
      return res.status(400).send('Invalid ITN');
    }

    if (body.payment_status !== 'COMPLETE') {
      console.log('ITN: payment not complete, status=', body.payment_status);
      return res.status(200).send('OK');
    }

    const orderId = body.m_payment_id;
    if (!orderId) {
      console.error('ITN: missing m_payment_id');
      return res.status(400).send('Missing m_payment_id');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    if (orderId.startsWith('ORD-')) {
      await handleOrder(supabase, body);
    } else if (orderId.startsWith('BOOK-')) {
      await handleBooking(supabase, body);
    } else if (orderId.startsWith('WEBINAR-')) {
      await handleWebinar(supabase, body);
    } else {
      console.warn('ITN: unknown m_payment_id prefix', orderId);
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('ITN handler error:', err);
    return res.status(500).send('Server error');
  }
}
