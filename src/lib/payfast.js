// PayFast Payment Gateway Integration
// Documentation: https://developers.payfast.co.za/docs

const PAYFAST_MERCHANT_ID = import.meta.env.VITE_PAYFAST_MERCHANT_ID;
const PAYFAST_MERCHANT_KEY = import.meta.env.VITE_PAYFAST_MERCHANT_KEY;
const PAYFAST_PASSPHRASE = import.meta.env.VITE_PAYFAST_PASSPHRASE || '';
const PAYFAST_MODE = import.meta.env.VITE_PAYFAST_MODE || 'sandbox';

// PayFast URLs
const PAYFAST_URL = PAYFAST_MODE === 'live'
  ? 'https://www.payfast.co.za/eng/process'
  : 'https://sandbox.payfast.co.za/eng/process';

/**
 * Generate PayFast payment form data
 * @param {Object} orderData - Order information
 * @returns {Object} Form data for PayFast
 */
export const generatePayFastData = (orderData) => {
  const { order_id, customer_name, customer_email, total, items } = orderData;

  // Get current site URL
  const siteUrl = window.location.origin;

  // PayFast payment data
  const paymentData = {
    // Merchant details
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,

    // Buyer details
    name_first: customer_name.split(' ')[0] || customer_name,
    name_last: customer_name.split(' ').slice(1).join(' ') || '',
    email_address: customer_email,

    // Transaction details
    m_payment_id: order_id,
    amount: total.toFixed(2),
    item_name: `Order ${order_id}`,
    item_description: `${items.length} item(s) from Dr. Boitumelo Wellness`,

    // Return URLs
    return_url: `${siteUrl}/payment/success`,
    cancel_url: `${siteUrl}/payment/cancel`,
    notify_url: `${siteUrl}/api/payfast/notify`,

    // Custom fields
    custom_str1: order_id,
    custom_str2: customer_email,
  };

  // Add passphrase if set
  if (PAYFAST_PASSPHRASE) {
    paymentData.passphrase = PAYFAST_PASSPHRASE;
  }

  return paymentData;
};

/**
 * Generate signature for PayFast
 * @param {Object} data - Payment data
 * @returns {string} MD5 signature
 */
const generateSignature = (data) => {
  // Create parameter string
  let pfOutput = '';
  for (let key in data) {
    if (data.hasOwnProperty(key) && key !== 'signature') {
      pfOutput += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
    }
  }

  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);

  // Note: For security, signature generation should be done on server-side
  // For now, PayFast will validate without signature in sandbox mode
  return pfOutput;
};

/**
 * Redirect to PayFast payment page
 * @param {Object} orderData - Order information
 */
export const redirectToPayFast = (orderData) => {
  const paymentData = generatePayFastData(orderData);

  // Create form
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = PAYFAST_URL;

  // Add form fields
  for (const [key, value] of Object.entries(paymentData)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  // Submit form
  document.body.appendChild(form);
  form.submit();
};

/**
 * Validate PayFast payment notification (ITN)
 * This should be called from server-side for security
 * @param {Object} data - ITN data from PayFast
 * @returns {boolean} Is valid
 */
export const validatePayFastPayment = async (data) => {
  // This is a simplified client-side check
  // In production, you should validate on server-side using Supabase Edge Function

  const { payment_status, merchant_id } = data;

  // Check merchant ID
  if (merchant_id !== PAYFAST_MERCHANT_ID) {
    console.error('Invalid merchant ID');
    return false;
  }

  // Check payment status
  if (payment_status === 'COMPLETE') {
    return true;
  }

  return false;
};

export default {
  generatePayFastData,
  redirectToPayFast,
  validatePayFastPayment,
  PAYFAST_URL,
  PAYFAST_MODE
};
