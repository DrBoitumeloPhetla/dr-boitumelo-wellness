import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash, FaPlus, FaMinus, FaShoppingBag, FaCheckCircle } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { createOrder, saveAbandonedLead } from '../../lib/supabase';
import { sendAbandonedCartToMake } from '../../lib/makeWebhooks';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '../../lib/emailService';
import { redirectToPayFast } from '../../lib/payfast';

// Get wait time from environment variable (default to 30 minutes)
const ABANDONED_WAIT_TIME = parseInt(import.meta.env.VITE_ABANDONED_WAIT_TIME) || 1800000;

const CartModal = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    clearCart,
  } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  const abandonedCartTimerRef = useRef(null);
  const abandonedCartSentRef = useRef(false);
  const timerStartedRef = useRef(false);

  // Track abandoned cart - trigger after inactivity
  // Start timer ONCE when user fills in required fields, don't restart on every keystroke
  useEffect(() => {
    const hasRequiredInfo = showCheckout && checkoutData.name && checkoutData.email && checkoutData.phone && cartItems.length > 0;

    // Start timer only if we have required info and timer hasn't been started yet
    if (hasRequiredInfo && !timerStartedRef.current && !abandonedCartSentRef.current) {
      console.log('✅ Starting abandoned cart timer for 1 minute...');
      timerStartedRef.current = true;

      // Capture current checkout data to avoid stale closure
      const currentCheckoutData = { ...checkoutData };
      const currentCartItems = [...cartItems];

      // Set timer - send abandoned cart data after configured wait time
      abandonedCartTimerRef.current = setTimeout(async () => {
        console.log('⏰ 1 minute elapsed - sending abandoned cart webhook...');
        try {
          const abandonedData = {
            customer: currentCheckoutData,
            items: currentCartItems,
            subtotal: getCartTotal(),
            shipping: getShippingTotal(),
            total: getGrandTotal()
          };

          // Save to database first
          console.log('💾 Saving abandoned lead to database...');
          await saveAbandonedLead(currentCheckoutData, 'abandoned_cart');
          console.log('✅ Saved to database');

          // Then send webhook
          console.log('📤 Sending webhook to Make.com...');
          const result = await sendAbandonedCartToMake(abandonedData);
          console.log('✅ Webhook response:', result);

          abandonedCartSentRef.current = true;
          console.log('✅ Abandoned cart webhook sent successfully!');
        } catch (error) {
          console.error('❌ Error sending abandoned cart:', error);
        }
      }, ABANDONED_WAIT_TIME);
    }

    // Cleanup: only clear on unmount, not on re-renders
    return () => {
      // Don't clear the timer on re-renders - only when component unmounts
      console.log('🔄 useEffect cleanup running, showCheckout:', showCheckout);
    };
  }, [showCheckout, checkoutData.name, checkoutData.email, checkoutData.phone, cartItems.length]);

  const handleInputChange = (e) => {
    setCheckoutData({
      ...checkoutData,
      [e.target.name]: e.target.value,
    });
  };

  // Calculate total shipping cost for all items in cart
  const getShippingTotal = () => {
    // Flat shipping rate of R168 for all orders
    return cartItems.length > 0 ? 168 : 0;
  };

  // Calculate grand total (cart total + shipping)
  const getGrandTotal = () => {
    return getCartTotal() + getShippingTotal();
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    // Prepare order data
    const order_id = 'ORD-' + Date.now();
    const orderData = {
      id: order_id,
      customer: {
        name: checkoutData.name,
        email: checkoutData.email,
        phone: checkoutData.phone,
        address: checkoutData.address,
        city: checkoutData.city,
        postalCode: checkoutData.postalCode,
        notes: checkoutData.notes
      },
      items: cartItems,
      subtotal: getCartTotal(),
      shipping: getShippingTotal(),
      total: getGrandTotal(),
      status: 'pending',
      orderDate: new Date().toISOString()
    };

    try {
      // Clear abandoned cart timer and reset flags - they're completing the order!
      if (abandonedCartTimerRef.current) {
        clearTimeout(abandonedCartTimerRef.current);
      }
      timerStartedRef.current = false;
      abandonedCartSentRef.current = false;

      // Store order data in sessionStorage (will be created after payment confirmation)
      sessionStorage.setItem(`pending_order_${order_id}`, JSON.stringify(orderData));
      console.log('Order data stored, redirecting to payment...');

      // Redirect to PayFast for payment
      console.log('Redirecting to PayFast for payment...');
      redirectToPayFast({
        order_id: order_id,
        customer_name: orderData.customer.name,
        customer_email: orderData.customer.email,
        total: getGrandTotal(),
        items: cartItems
      });

    } catch (error) {
      console.error('Error processing checkout:', error);
      alert('There was an error processing your order. Please try again.');
    }
  };

  const handleCloseModal = () => {
    // Clear timer and reset flags when closing modal
    if (abandonedCartTimerRef.current) {
      clearTimeout(abandonedCartTimerRef.current);
    }
    timerStartedRef.current = false;
    abandonedCartSentRef.current = false;

    setIsCartOpen(false);
    setShowCheckout(false);
    setOrderComplete(false);
    // Reset checkout form
    setCheckoutData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      notes: '',
    });
  };

  if (!isCartOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-green to-green-dark text-white p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaShoppingBag className="text-2xl" />
              <h2 className="text-2xl font-montserrat font-bold">
                {orderComplete ? 'Order Confirmed' : showCheckout ? 'Checkout' : 'Shopping Cart'}
              </h2>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {orderComplete ? (
              // Order Confirmation Screen
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="mb-6">
                  <FaCheckCircle className="text-7xl text-green-500 mx-auto mb-4" />
                  <h3 className="text-3xl font-montserrat font-bold text-dark-text mb-2">
                    Order Received!
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Thank you for your order. We've received your information and will contact you shortly to finalize payment and delivery details.
                  </p>
                </div>

                <div className="bg-sage p-6 rounded-xl max-w-md mx-auto text-left space-y-4 mb-6">
                  <h4 className="font-montserrat font-semibold text-lg mb-4">
                    Order Summary
                  </h4>
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-300">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-semibold">
                          R{((typeof item.price === 'number' ? item.price : parseFloat(item.price)) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Subtotal:</span>
                      <span>R{getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Shipping:</span>
                      <span>{getShippingTotal() === 0 ? 'FREE' : `R${getShippingTotal().toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-montserrat font-bold border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span className="text-primary-green">R{getGrandTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-cream p-6 rounded-xl max-w-md mx-auto mb-6 text-left">
                  <h5 className="font-montserrat font-semibold mb-3">What happens next?</h5>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="text-primary-green mr-2">✓</span>
                      <span>Complete your payment to finalize the order</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-green mr-2">✓</span>
                      <span>You'll receive an order confirmation email at <strong>{checkoutData.email}</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-green mr-2">✓</span>
                      <span>Your order will be prepared and shipped to <strong>{checkoutData.city}</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-green mr-2">✓</span>
                      <span>Delivery typically takes 3-5 business days</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-800">
                      <strong>Note:</strong> Payment gateway integration in progress. Our team will contact you at <strong>{checkoutData.phone}</strong> to complete payment securely.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    clearCart();
                    handleCloseModal();
                  }}
                  className="btn-primary"
                >
                  Continue Shopping
                </button>
              </motion.div>
            ) : !showCheckout ? (
              // Cart Items View
              <>
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-montserrat font-semibold text-gray-600 mb-2">
                      Your cart is empty
                    </h3>
                    <p className="text-gray-500">Add some products to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-cream rounded-xl p-4 flex items-center space-x-4"
                      >
                        {/* Product Image */}
                        <img
                          src={item.image_url || item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />

                        {/* Product Details */}
                        <div className="flex-1">
                          <h4 className="font-montserrat font-semibold text-dark-text">
                            {item.name}
                          </h4>
                          {item.discount ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-gray-400 line-through">
                                R{item.originalPrice}
                              </span>
                              <span className="text-red-600 font-semibold">
                                R{item.price}
                              </span>
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                {item.discount.discount_type === 'percentage' && `${item.discount.discount_value}% OFF`}
                                {item.discount.discount_type === 'fixed_amount' && `R${item.discount.discount_value} OFF`}
                              </span>
                            </div>
                          ) : (
                            <p className="text-primary-green font-semibold">
                              R{item.price}
                            </p>
                          )}

                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 bg-white rounded-full hover:bg-primary-green hover:text-white transition-colors"
                            >
                              <FaMinus className="text-xs" />
                            </button>
                            <span className="font-semibold w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 bg-white rounded-full hover:bg-primary-green hover:text-white transition-colors"
                            >
                              <FaPlus className="text-xs" />
                            </button>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Checkout Form
              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="bg-cream p-6 rounded-xl space-y-4">
                  <h4 className="font-montserrat font-semibold text-lg text-dark-text mb-4">
                    Delivery Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-dark-text mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={checkoutData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-dark-text mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={checkoutData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-dark-text mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={checkoutData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="078 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-dark-text mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={checkoutData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="Johannesburg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-medium text-dark-text mb-2">
                        Delivery Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={checkoutData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-dark-text mb-2">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={checkoutData.postalCode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="2000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-dark-text mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={checkoutData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none resize-none"
                      placeholder="Any special instructions for your order..."
                    />
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white border-2 border-primary-green/20 p-6 rounded-xl">
                  <h4 className="font-montserrat font-semibold text-lg text-dark-text mb-4">
                    Order Summary
                  </h4>
                  <div className="space-y-2 mb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-semibold">
                          R{((typeof item.price === 'number' ? item.price : parseFloat(item.price)) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Subtotal:</span>
                      <span>R{getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Shipping:</span>
                      <span>{getShippingTotal() === 0 ? 'FREE' : `R${getShippingTotal().toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-montserrat font-bold border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span className="text-primary-green">R{getGrandTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="px-6 py-3 text-primary-green hover:bg-sage rounded-lg transition-colors"
                  >
                    ← Back to Cart
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Proceed to Payment
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer - Only show if not in checkout, not complete, and cart has items */}
          {!showCheckout && !orderComplete && cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-white">
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Shipping:</span>
                  <span>{getShippingTotal() === 0 ? 'FREE' : `R${getShippingTotal().toFixed(2)}`}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <span className="text-lg font-montserrat font-semibold">Total:</span>
                  <span className="text-2xl font-montserrat font-bold text-primary-green">
                    R{getGrandTotal().toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                className="btn-primary w-full"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CartModal;
