// Make.com Webhook Integration for Lead Capture

const ABANDONED_CART_WEBHOOK = import.meta.env.VITE_MAKE_ABANDONED_CART_WEBHOOK;
const ABANDONED_BOOKING_WEBHOOK = import.meta.env.VITE_MAKE_ABANDONED_BOOKING_WEBHOOK;
const CHECKOUT_TRACKING_WEBHOOK = 'https://hook.eu2.make.com/sh4jyus34epoqcsbc8mlypmvt3otxtw5';
const BNPL_APPLICATION_WEBHOOK = import.meta.env.VITE_MAKE_BNPL_WEBHOOK;

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

/**
 * Send "Checkout Started" event to Make.com
 * This initiates the 30-minute abandoned cart timer in Make.com
 * @param {Object} checkoutData - Customer and cart information
 */
export const sendCheckoutStarted = async (checkoutData) => {
  if (!CHECKOUT_TRACKING_WEBHOOK) {
    console.warn('Checkout tracking webhook not configured');
    return { success: false, error: 'Webhook not configured' };
  }

  try {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('checkout_session_id');
    if (!sessionId) {
      // Fallback for browsers that don't support crypto.randomUUID()
      sessionId = crypto.randomUUID ? crypto.randomUUID() :
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('checkout_session_id', sessionId);
    }

    const payload = {
      type: "checkout_started",
      session_id: sessionId,
      customer: {
        name: checkoutData.customer.name,
        email: checkoutData.customer.email,
        phone: checkoutData.customer.phone
      },
      cart_items: checkoutData.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      })),
      cart_total: checkoutData.total,
      source: "website_checkout",
      timestamp: new Date().toISOString()
    };

    console.log('📤 Sending Checkout Started webhook to Make.com...');
    console.log('Session ID:', sessionId);

    const response = await fetch(CHECKOUT_TRACKING_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log('✅ Checkout Started sent to Make.com successfully');
    return { success: true, sessionId, data: payload };
  } catch (error) {
    console.error('❌ Error sending Checkout Started to Make.com:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send "Purchase Completed" event to Make.com
 * This cancels the abandoned cart timer in Make.com
 */
export const sendPurchaseCompleted = async () => {
  if (!CHECKOUT_TRACKING_WEBHOOK) {
    console.warn('Checkout tracking webhook not configured');
    return { success: false, error: 'Webhook not configured' };
  }

  try {
    const sessionId = sessionStorage.getItem('checkout_session_id');

    if (!sessionId) {
      console.warn('No checkout session ID found');
      return { success: false, error: 'No session ID' };
    }

    const payload = {
      type: "purchase_completed",
      session_id: sessionId,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Sending Purchase Completed webhook to Make.com...');
    console.log('Session ID:', sessionId);

    const response = await fetch(CHECKOUT_TRACKING_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log('✅ Purchase Completed sent to Make.com successfully');

    // Clear the session ID after successful purchase
    sessionStorage.removeItem('checkout_session_id');

    return { success: true, data: payload };
  } catch (error) {
    console.error('❌ Error sending Purchase Completed to Make.com:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Buy Now Pay Later application to Make.com
 * Includes base64-encoded file attachments
 */
export const sendBNPLApplication = async (applicationData) => {
  if (!BNPL_APPLICATION_WEBHOOK) {
    console.warn('BNPL webhook not configured');
    return { success: false, error: 'Webhook not configured' };
  }

  try {
    const payload = {
      type: 'bnpl_application',
      timestamp: new Date().toISOString(),
      customer: {
        fullName: applicationData.fullName,
        idNumber: applicationData.idNumber,
        email: applicationData.email,
        mobile: applicationData.mobile
      },
      payment: {
        advanceAmount: applicationData.advanceAmount,
        repaymentPeriod: applicationData.repaymentPeriod,
        totalRepayable: applicationData.totalRepayable,
        monthlyInstallment: applicationData.monthlyInstallment
      },
      itemDescription: applicationData.itemDescription,
      attachments: {
        idDocument: {
          filename: applicationData.idDocument.filename,
          contentType: applicationData.idDocument.contentType,
          base64: applicationData.idDocument.base64
        },
        bankStatement: {
          filename: applicationData.bankStatement.filename,
          contentType: applicationData.bankStatement.contentType,
          base64: applicationData.bankStatement.base64
        },
        payslip: {
          filename: applicationData.payslip.filename,
          contentType: applicationData.payslip.contentType,
          base64: applicationData.payslip.base64
        }
      }
    };

    console.log('📤 Sending BNPL application to Make.com...');

    const response = await fetch(BNPL_APPLICATION_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log('✅ BNPL application sent to Make.com successfully');
    return { success: true, data: payload };
  } catch (error) {
    console.error('❌ Error sending BNPL application to Make.com:', error);
    return { success: false, error: error.message };
  }
};
