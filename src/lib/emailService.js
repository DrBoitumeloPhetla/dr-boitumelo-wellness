// Simple Email Service using Make.com webhook
// Sends order details to Make.com, which then sends emails from supplements@drphetla.co.za

const MAKE_ORDER_WEBHOOK = import.meta.env.VITE_MAKE_ORDER_WEBHOOK;

/**
 * Send order emails (both customer confirmation and admin notification)
 * Make.com will handle sending both emails from supplements@drphetla.co.za
 */
export const sendOrderConfirmationEmail = async (orderData) => {
  try {
    const { customer_name, customer_email, customer_phone, items, subtotal, shipping, total, order_id } = orderData;

    const emailData = {
      type: 'new_order',
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      orderId: order_id,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price),
        total: ((typeof item.price === 'number' ? item.price : parseFloat(item.price)) * item.quantity).toFixed(2)
      })),
      subtotal: subtotal ? subtotal.toFixed(2) : total.toFixed(2),
      shipping: shipping ? shipping.toFixed(2) : '0.00',
      total: total.toFixed(2),
      timestamp: new Date().toISOString()
    };

    console.log('📧 Sending order emails via Make.com:', emailData);

    if (MAKE_ORDER_WEBHOOK) {
      const response = await fetch(MAKE_ORDER_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`Make.com webhook failed: ${response.statusText}`);
      }

      console.log('✅ Order emails sent successfully');
      return { success: true, message: 'Order emails sent' };
    } else {
      console.warn('⚠️ Make.com order webhook not configured');
      return { success: false, error: 'Webhook URL not configured' };
    }
  } catch (error) {
    console.error('Error sending order emails:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin notification uses the same webhook (Make.com handles both emails)
 */
export const sendAdminOrderNotification = async (orderData) => {
  // Both customer and admin emails are sent by the same webhook
  // So we just log this and return success
  console.log('✅ Admin notification handled by order confirmation webhook');
  return { success: true, message: 'Admin notification sent' };
};

/**
 * Send booking confirmation emails (both customer and admin)
 * Make.com will handle sending both emails from supplements@drphetla.co.za
 */
export const sendBookingConfirmationEmail = async (bookingData) => {
  try {
    const { customer_name, customer_email, customer_phone, consultation_type, booking_id, total } = bookingData;

    const emailData = {
      type: 'new_booking',
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      bookingId: booking_id,
      consultationType: consultation_type,
      amount: total.toFixed(2),
      calendlyLink: 'https://calendly.com/drboitumelowellnesssupplements/30min',
      timestamp: new Date().toISOString()
    };

    console.log('📧 Sending booking confirmation emails via Make.com:', emailData);

    if (MAKE_ORDER_WEBHOOK) {
      const response = await fetch(MAKE_ORDER_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`Make.com webhook failed: ${response.statusText}`);
      }

      console.log('✅ Booking confirmation emails sent successfully');
      return { success: true, message: 'Booking emails sent' };
    } else {
      console.warn('⚠️ Make.com order webhook not configured');
      return { success: false, error: 'Webhook URL not configured' };
    }
  } catch (error) {
    console.error('Error sending booking emails:', error);
    return { success: false, error: error.message };
  }
};

// Deprecated appointment email functions (keeping for backwards compatibility)
export const sendAppointmentConfirmationEmail = async (appointmentData) => {
  console.log('📧 Deprecated: Use sendBookingConfirmationEmail instead');
  return { success: true, message: 'Use sendBookingConfirmationEmail instead' };
};

export const sendAdminAppointmentNotification = async (appointmentData) => {
  console.log('📧 Deprecated: Use sendBookingConfirmationEmail instead');
  return { success: true, message: 'Use sendBookingConfirmationEmail instead' };
};
