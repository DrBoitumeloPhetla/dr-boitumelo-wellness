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

  // 1. Already materialized? Browser path beat us. Clean up pending if any.
  const { data: existing } = await supabase
    .from('orders')
    .select('order_id')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existing) {
    console.log('ITN: order already exists, skipping', orderId);
    await supabase.from('pending_orders').delete().eq('order_id', orderId);
    return;
  }

  // 2. Read the pending row written by CartModal before PayFast.
  const { data: pending, error: pendingErr } = await supabase
    .from('pending_orders')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (pendingErr || !pending) {
    console.error('ITN: no pending order for', orderId, pendingErr);
    return;
  }

  // 3. Insert into orders as 'processing'.
  const orderInsert = {
    order_id: pending.order_id,
    customer_name: pending.customer_name,
    customer_email: pending.customer_email,
    customer_phone: pending.customer_phone,
    customer_address: pending.customer_address,
    customer_city: pending.customer_city,
    customer_postal_code: pending.customer_postal_code,
    customer_notes: pending.customer_notes,
    items: pending.items,
    total: pending.total,
    status: 'processing',
    order_date: pending.created_at,
  };
  if (pending.subtotal !== null && pending.subtotal !== undefined) orderInsert.subtotal = pending.subtotal;
  if (pending.shipping !== null && pending.shipping !== undefined) orderInsert.shipping = pending.shipping;
  if (pending.coupon_code) orderInsert.coupon_code = pending.coupon_code;
  if (pending.discount_amount) orderInsert.discount_amount = pending.discount_amount;
  if (pending.affiliate_id) orderInsert.affiliate_id = pending.affiliate_id;

  const { data: order, error: insertErr } = await supabase
    .from('orders')
    .insert([orderInsert])
    .select()
    .single();

  if (insertErr) {
    // Race condition — browser path materialized in parallel. It owns the
    // confirmation email.
    console.warn('ITN: order insert race, browser path won', insertErr);
    await supabase.from('pending_orders').delete().eq('order_id', orderId);
    return;
  }

  // 4. Clean up pending row.
  await supabase.from('pending_orders').delete().eq('order_id', orderId);

  // 5. Affiliate stats — only credit real, paid sales.
  if (pending.affiliate_id && pending.subtotal && num(pending.subtotal) > 0) {
    try {
      const subtotal = num(pending.subtotal);
      const { data: aff } = await supabase
        .from('affiliates')
        .select('total_sales, total_orders')
        .eq('id', pending.affiliate_id)
        .maybeSingle();
      if (aff) {
        await supabase
          .from('affiliates')
          .update({
            total_sales: num(aff.total_sales) + subtotal,
            total_orders: (aff.total_orders || 0) + 1,
          })
          .eq('id', pending.affiliate_id);
      }
    } catch (err) {
      console.error('ITN: failed to update affiliate stats:', err);
    }
  }

  // 6. We created the order — fire the Make.com order-confirmation webhook.
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

  // 1. Already materialized? (Browser path beat us here.) Just clean up.
  const { data: existing } = await supabase
    .from('appointments')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (existing) {
    console.log('ITN: appointment already exists, skipping', bookingId);
    await supabase.from('pending_bookings').delete().eq('booking_id', bookingId);
    return;
  }

  // 2. Pick up the pending row written by BookingModal before PayFast.
  const { data: pending, error: pendingErr } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (pendingErr || !pending) {
    console.error('ITN: no pending booking for', bookingId, pendingErr);
    return;
  }

  // 3. Insert into appointments as paid + scheduled.
  const { data: appointment, error: insertErr } = await supabase
    .from('appointments')
    .insert({
      booking_id: pending.booking_id,
      customer_name: pending.customer_name,
      customer_email: pending.customer_email,
      customer_phone: pending.customer_phone,
      consultation_type: pending.consultation_type,
      appointment_date: pending.appointment_date,
      start_time: pending.start_time,
      end_time: pending.end_time,
      price: pending.price,
      payment_status: 'paid',
      appointment_status: 'scheduled',
      location: pending.location,
    })
    .select()
    .single();

  if (insertErr) {
    // Race condition — browser materialized between our existence check
    // and this insert. Let the browser path own the webhook.
    console.warn('ITN: insert race detected, browser path won', insertErr);
    await supabase.from('pending_bookings').delete().eq('booking_id', bookingId);
    return;
  }

  // 4. Clean up — pending row + slot reservation.
  await supabase.from('pending_bookings').delete().eq('booking_id', bookingId);
  if (pending.reservation_id) {
    try {
      await supabase.from('slot_reservations').delete().eq('id', pending.reservation_id);
    } catch (err) {
      console.error('ITN: failed to cancel reservation', err);
    }
  }

  // 5. We created the row — fire the Make.com "created" webhook.
  if (!MAKE_APPOINTMENTS_WEBHOOK) {
    console.warn('ITN: VITE_MAKE_WEBHOOK_APPOINTMENTS not set, skipping webhook');
    return;
  }

  await fetch(MAKE_APPOINTMENTS_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'created',
      id: appointment.booking_id,
      customer_name: appointment.customer_name,
      customer_email: appointment.customer_email,
      customer_phone: appointment.customer_phone,
      consultation_type: appointment.consultation_type,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      price: appointment.price,
      location: appointment.location,
      appointment_status: 'scheduled',
    }),
  });
}

async function handleWebinar(supabase, body) {
  const orderId = body.m_payment_id;
  const pendingId = orderId.replace(/^WEBINAR-/, '');
  const pfPaymentId = body.pf_payment_id || null;

  // 1. Already materialized? Browser path beat us — just clean up.
  const { data: existing } = await supabase
    .from('webinar_registrations')
    .select('id')
    .eq('id', pendingId)
    .maybeSingle();

  if (existing) {
    console.log('ITN: webinar registration already exists, skipping', pendingId);
    await supabase.from('pending_webinar_registrations').delete().eq('id', pendingId);
    return;
  }

  // 2. Read the pending row.
  const { data: pending, error: pendingErr } = await supabase
    .from('pending_webinar_registrations')
    .select('*')
    .eq('id', pendingId)
    .maybeSingle();

  if (pendingErr || !pending) {
    console.error('ITN: no pending webinar registration for', pendingId, pendingErr);
    return;
  }

  // 3. Insert into webinar_registrations as paid, reusing the pending id.
  const { data: registration, error: insertErr } = await supabase
    .from('webinar_registrations')
    .insert({
      id: pending.id,
      webinar_id: pending.webinar_id,
      first_name: pending.first_name,
      last_name: pending.last_name,
      email: pending.email,
      phone: pending.phone,
      profession: pending.profession,
      hpcsa_number: pending.hpcsa_number,
      payment_status: 'paid',
      payment_reference: pfPaymentId,
    })
    .select('*, webinars(*)')
    .single();

  if (insertErr) {
    // Race condition — browser materialized in parallel. Let browser fire
    // the webhook.
    console.warn('ITN: webinar insert race, browser path won', insertErr);
    await supabase.from('pending_webinar_registrations').delete().eq('id', pendingId);
    return;
  }

  // 4. Clean up pending row.
  await supabase.from('pending_webinar_registrations').delete().eq('id', pendingId);

  // 5. We created the row — fire the Make.com payment-confirmed webhook.
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
      title: pending.title || '',
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
