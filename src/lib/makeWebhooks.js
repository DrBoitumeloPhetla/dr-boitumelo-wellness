// Make.com Webhook Integration for Lead Capture

const ABANDONED_CART_WEBHOOK = import.meta.env.VITE_MAKE_ABANDONED_CART_WEBHOOK;
const ABANDONED_BOOKING_WEBHOOK = import.meta.env.VITE_MAKE_ABANDONED_BOOKING_WEBHOOK;

/**
 * Send abandoned cart data to Make.com for AI follow-up
 * @param {Object} cartData - Cart and customer information
 */
export const sendAbandonedCartToMake = async (cartData) => {
  if (!ABANDONED_CART_WEBHOOK) {
    console.warn('Abandoned cart webhook not configured');
    return { success: false, error: 'Webhook not configured' };
  }

  try {
    const payload = {
      type: 'abandoned_cart',
      timestamp: new Date().toISOString(),
      source: 'checkout_form', // Required for Make.com routing
      customer: {
        name: cartData.customer.name,
        email: cartData.customer.email,
        phone: cartData.customer.phone,
        address: cartData.customer.address,
        city: cartData.customer.city,
        postalCode: cartData.customer.postalCode,
      },
      cart: {
        items: cartData.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        total: cartData.total,
        itemCount: cartData.items.reduce((sum, item) => sum + item.quantity, 0)
      },
      websiteUrl: window.location.origin,
      cartUrl: `${window.location.origin}/shop`
    };

    console.log('🔍 Webhook URL:', ABANDONED_CART_WEBHOOK);
    console.log('📦 Payload:', payload);

    // Try fetch first with keepalive flag (similar to sendBeacon but with better compatibility)
    try {
      console.log('📤 Sending webhook with fetch + keepalive...');
      const response = await fetch(ABANDONED_CART_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true // This keeps the request alive even if page closes
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log('✅ Abandoned cart sent to Make.com successfully');
      return { success: true, data: payload };
    } catch (fetchError) {
      // If fetch fails, fallback to sendBeacon as last resort
      console.warn('⚠️ Fetch failed, trying sendBeacon as fallback:', fetchError);
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const sent = navigator.sendBeacon(ABANDONED_CART_WEBHOOK, blob);

      if (sent) {
        console.log('✅ Sent via sendBeacon fallback');
        return { success: true, data: payload };
      }

      throw fetchError; // Throw original error
    }
  } catch (error) {
    console.error('❌ Error sending abandoned cart to Make.com:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send abandoned booking data to Make.com for AI follow-up
 * @param {Object} bookingData - Booking and patient information
 */
export const sendAbandonedBookingToMake = async (bookingData) => {
  if (!ABANDONED_BOOKING_WEBHOOK) {
    console.warn('Abandoned booking webhook not configured');
    return { success: false, error: 'Webhook not configured' };
  }

  try {
    const payload = {
      type: 'abandoned_booking',
      timestamp: new Date().toISOString(),
      source: 'booking_form', // Required for Make.com routing
      patient: {
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
      },
      booking: {
        type: bookingData.type, // 'virtual' or 'telephonic'
        preferredDate: bookingData.date ? new Date(bookingData.date).toISOString().split('T')[0] : null,
        preferredTime: bookingData.time,
        symptoms: bookingData.symptoms,
        symptomsStartDate: bookingData.symptomsStartDate,
        vitaminDTest: bookingData.vitaminDTest,
        additionalNotes: bookingData.additionalNotes
      },
      websiteUrl: window.location.origin,
      bookingUrl: `${window.location.origin}/`
    };

    const response = await fetch(ABANDONED_BOOKING_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Make.com webhook failed: ${response.status}`);
    }

    console.log('✅ Abandoned booking sent to Make.com successfully');
    return { success: true, data: payload };
  } catch (error) {
    console.error('❌ Error sending abandoned booking to Make.com:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send lead capture when user enters info (early capture)
 * This captures the lead even if they don't reach the final step
 * @param {Object} leadData - Basic lead information
 * @param {string} leadType - 'cart' or 'booking'
 */
export const sendLeadCaptureToMake = async (leadData, leadType = 'cart') => {
  const webhook = leadType === 'cart' ? ABANDONED_CART_WEBHOOK : ABANDONED_BOOKING_WEBHOOK;

  if (!webhook) {
    console.warn(`Lead capture webhook not configured for type: ${leadType}`);
    return { success: false, error: 'Webhook not configured' };
  }

  try {
    const payload = {
      type: `lead_capture_${leadType}`,
      timestamp: new Date().toISOString(),
      lead: {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
      },
      source: leadType === 'cart' ? 'checkout_form' : 'booking_form',
      status: 'early_capture',
      websiteUrl: window.location.origin
    };

    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Make.com webhook failed: ${response.status}`);
    }

    console.log(`✅ Lead capture sent to Make.com (${leadType})`);
    return { success: true, data: payload };
  } catch (error) {
    console.error(`❌ Error sending lead capture to Make.com:`, error);
    return { success: false, error: error.message };
  }
};
