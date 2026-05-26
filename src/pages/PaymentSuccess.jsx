import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaHome, FaShoppingBag } from 'react-icons/fa';
import { getOrderByOrderId, updateOrderStatus } from '../lib/supabase';
import { sendOrderConfirmationEmail } from '../lib/emailService';
import { sendPurchaseCompleted } from '../lib/makeWebhooks';
import { useCart } from '../context/CartContext';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [processing, setProcessing] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;

    const processPayment = async () => {
      const orderId = searchParams.get('m_payment_id') || searchParams.get('order_id');

      if (!orderId) {
        console.error('No order ID in URL');
        setProcessing(false);
        return;
      }

      const processedKey = `order_processed_${orderId}`;
      if (sessionStorage.getItem(processedKey)) {
        setProcessing(false);
        return;
      }
      hasProcessedRef.current = true;

      try {
        // Look up the order that was saved before the PayFast redirect.
        const order = await getOrderByOrderId(orderId);

        if (!order) {
          console.error('Order not found in database:', orderId);
          alert(
            'We could not find your order. Please contact support with order ID: ' +
              orderId
          );
          setProcessing(false);
          return;
        }

        const displayOrder = {
          id: order.order_id,
          customer_email: order.customer_email,
          total: parseFloat(order.total),
        };

        // If the order has already been processed (e.g. ITN webhook beat us
        // to it), just show success — don't re-send emails.
        const alreadyProcessed =
          order.status === 'processing' ||
          order.status === 'completed' ||
          order.status === 'shipped' ||
          order.status === 'delivered';

        if (alreadyProcessed) {
          setOrderDetails(displayOrder);
          sessionStorage.setItem(processedKey, 'true');
          clearCart();
          setProcessing(false);
          return;
        }

        await updateOrderStatus(orderId, 'processing');

        await sendOrderConfirmationEmail({
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          items: order.items,
          subtotal: order.subtotal,
          shipping: order.shipping || 0,
          total: order.total,
          order_id: order.order_id,
        });

        sendPurchaseCompleted().catch((err) =>
          console.warn('Purchase Completed webhook failed:', err)
        );

        setOrderDetails(displayOrder);
        sessionStorage.setItem(processedKey, 'true');
        clearCart();
      } catch (error) {
        console.error('Error processing payment success:', error);
        alert('There was an error confirming your order. Please contact support.');
      } finally {
        setProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, clearCart]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-green mb-4"></div>
          <h2 className="text-2xl font-montserrat font-semibold text-dark-text">
            Processing your payment...
          </h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your order</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full">
            <FaCheckCircle className="text-6xl text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-4xl font-montserrat font-bold text-primary-green mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </motion.div>

        {orderDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-cream rounded-xl p-6 mb-8 text-left"
          >
            <h3 className="font-montserrat font-semibold text-lg mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-semibold">{orderDetails.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold">{orderDetails.customer_email}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                <span className="text-gray-600">Total Paid:</span>
                <span className="font-semibold text-primary-green text-lg">
                  R{orderDetails.total.toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-blue-50 rounded-xl p-6 mb-8 text-left"
        >
          <h3 className="font-montserrat font-semibold text-lg mb-3">What happens next?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-primary-green mr-2">✓</span>
              <span>You'll receive an order confirmation email shortly</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-green mr-2">✓</span>
              <span>We'll prepare your order and ship it within 1-2 business days</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-green mr-2">✓</span>
              <span>You'll receive tracking information via email</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-green mr-2">✓</span>
              <span>Delivery typically takes 3-5 business days</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors"
          >
            <FaHome />
            <span>Back to Home</span>
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white text-primary-green border-2 border-primary-green rounded-lg font-semibold hover:bg-sage transition-colors"
          >
            <FaShoppingBag />
            <span>Continue Shopping</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
