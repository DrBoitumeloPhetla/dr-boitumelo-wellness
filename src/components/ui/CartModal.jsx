import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash, FaPlus, FaMinus, FaShoppingBag, FaCheckCircle, FaTag } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { createOrder, saveAbandonedLead, getAffiliateByCode } from '../../lib/supabase';
import { sendAbandonedCartToMake, sendCheckoutStarted, sendPurchaseCompleted } from '../../lib/makeWebhooks';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '../../lib/emailService';
import { redirectToPayFast } from '../../lib/payfast';
import BuyNowPayLaterModal from './BuyNowPayLaterModal';

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
    getItemPrice,
    clearCart,
  } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [showBNPL, setShowBNPL] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  // Coupon code state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [appliedAffiliate, setAppliedAffiliate] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const checkoutStartedSentRef = useRef(false);
  const debounceTimerRef = useRef(null);

  // Phone validation helper - South African numbers are typically 10 digits
  const isPhoneComplete = (phone) => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Check if at least 10 digits (SA standard)
    return digitsOnly.length >= 10;
  };

  // Send "Checkout Started" webhook when user fills in required fields
  // This initiates the 30-minute timer in Make.com
  // Uses debouncing to wait until phone number is complete
  useEffect(() => {
    const hasBasicInfo = showCheckout && checkoutData.name && checkoutData.email && checkoutData.phone && cartItems.length > 0;
    const phoneIsComplete = isPhoneComplete(checkoutData.phone);
    const hasRequiredInfo = hasBasicInfo && phoneIsComplete;

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Only proceed if we have all info including complete phone number
    if (hasRequiredInfo && !checkoutStartedSentRef.current) {
      console.log('📝 All required info complete. Starting 3-second debounce timer...');

      // Wait 3 seconds after user stops typing before sending webhook
      debounceTimerRef.current = setTimeout(() => {
        if (checkoutStartedSentRef.current) return; // Double check

        checkoutStartedSentRef.current = true;

        const checkoutData_toSend = {
          customer: {
            name: checkoutData.name,
            email: checkoutData.email,
            phone: checkoutData.phone
          },
          items: cartItems,
          total: getGrandTotal()
        };

        // Send "Checkout Started" event to Make.com
        console.log('⏰ Debounce timer completed. Sending webhook...');
        sendCheckoutStarted(checkoutData_toSend).then(result => {
          if (result.success) {
            console.log('✅ Checkout Started webhook sent. Session ID:', result.sessionId);
          } else {
            console.error('❌ Failed to send Checkout Started webhook:', result.error);
          }
        });

        // Also save to database for backup
        saveAbandonedLead(checkoutData, 'abandoned_cart').catch(error => {
          console.error('Failed to save abandoned lead:', error);
        });
      }, 3000); // 3 second delay
    } else if (hasBasicInfo && !phoneIsComplete) {
      console.log('⏳ Waiting for complete phone number... Current:', checkoutData.phone);
    }

    // Cleanup: reset flag when checkout is closed
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (!showCheckout) {
        checkoutStartedSentRef.current = false;
      }
    };
  }, [showCheckout, checkoutData.name, checkoutData.email, checkoutData.phone, cartItems.length]);

  // Exit detection: Send webhook if user tries to leave with incomplete checkout
  useEffect(() => {
    if (!showCheckout) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !checkoutStartedSentRef.current) {
        // User is leaving the page/tab
        const hasBasicInfo = checkoutData.name && checkoutData.email && checkoutData.phone && cartItems.length > 0;
        const phoneIsComplete = isPhoneComplete(checkoutData.phone);

        if (hasBasicInfo && phoneIsComplete) {
          console.log('🚪 User leaving page - sending webhook immediately');
          checkoutStartedSentRef.current = true;

          const checkoutData_toSend = {
            customer: {
              name: checkoutData.name,
              email: checkoutData.email,
              phone: checkoutData.phone
            },
            items: cartItems,
            total: getGrandTotal()
          };

          // Use keepalive flag to ensure webhook sends even as page closes
          sendCheckoutStarted(checkoutData_toSend);
          saveAbandonedLead(checkoutData, 'abandoned_cart').catch(() => {});
        }
      }
    };

    const handleBeforeUnload = () => {
      if (!checkoutStartedSentRef.current) {
        const hasBasicInfo = checkoutData.name && checkoutData.email && checkoutData.phone && cartItems.length > 0;
        const phoneIsComplete = isPhoneComplete(checkoutData.phone);

        if (hasBasicInfo && phoneIsComplete) {
          console.log('🚪 Page unloading - sending webhook immediately');
          checkoutStartedSentRef.current = true;

          const checkoutData_toSend = {
            customer: {
              name: checkoutData.name,
              email: checkoutData.email,
              phone: checkoutData.phone
            },
            items: cartItems,
            total: getGrandTotal()
          };

          sendCheckoutStarted(checkoutData_toSend);
          saveAbandonedLead(checkoutData, 'abandoned_cart').catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [showCheckout, checkoutData, cartItems]);

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

  // Calculate grand total (cart total + shipping - coupon discount)
  const getGrandTotal = () => {
    return getCartTotal() + getShippingTotal() - couponDiscount;
  };

  // Handle applying coupon code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const affiliate = await getAffiliateByCode(couponCode.trim());

      if (affiliate) {
        const discount = getCartTotal() * (affiliate.discount_percentage / 100);
        setCouponDiscount(discount);
        setAppliedAffiliate(affiliate);
        setCouponSuccess(`${affiliate.discount_percentage}% discount applied!`);
        setCouponError('');
      } else {
        setCouponError('Invalid or expired coupon code');
        setCouponDiscount(0);
        setAppliedAffiliate(null);
        setCouponSuccess('');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Error validating coupon. Please try again.');
      setCouponDiscount(0);
      setAppliedAffiliate(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponError('');
    setCouponSuccess('');
    setAppliedAffiliate(null);
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
      discountAmount: couponDiscount,
      couponCode: appliedAffiliate?.coupon_code || null,
      affiliateId: appliedAffiliate?.id || null,
      total: getGrandTotal(),
      status: 'pending',
      orderDate: new Date().toISOString()
    };

    try {
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
    // Reset checkout started flag when closing modal
    checkoutStartedSentRef.current = false;

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
    // Reset coupon state
    setCouponCode('');
    setCouponDiscount(0);
    setCouponError('');
    setCouponSuccess('');
    setAppliedAffiliate(null);
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
                          R{(getItemPrice(item) * item.quantity).toFixed(2)}
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
                          {item.discount ? (() => {
                            const effectivePrice = getItemPrice(item);
                            const originalPrice = item.originalPrice || item.price;
                            const isDiscountActive = effectivePrice < parseFloat(originalPrice);
                            return isDiscountActive ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-gray-400 line-through">
                                  R{parseFloat(originalPrice).toFixed(2)}
                                </span>
                                <span className="text-red-600 font-semibold">
                                  R{effectivePrice.toFixed(2)}
                                </span>
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                  {item.discount.discount_type === 'percentage' && `${item.discount.discount_value}% OFF`}
                                  {item.discount.discount_type === 'fixed_amount' && `R${item.discount.discount_value} OFF`}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <p className="text-primary-green font-semibold">
                                  R{parseFloat(originalPrice).toFixed(2)}
                                </p>
                                {item.discount.min_quantity > 1 && (
                                  <p className="text-xs text-gray-500">
                                    Buy {item.discount.min_quantity}+ for {item.discount.discount_value}% off
                                  </p>
                                )}
                              </div>
                            );
                          })() : (
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
                          R{(getItemPrice(item) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Subtotal:</span>
                      <span>R{getCartTotal().toFixed(2)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Discount ({appliedAffiliate?.coupon_code}):</span>
                        <span>-R{couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
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
              {/* Coupon Code Section */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaTag className="text-primary-green" />
                  <span className="font-medium text-sm">Have a coupon code?</span>
                </div>
                {appliedAffiliate ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div>
                      <span className="text-green-700 font-medium">{appliedAffiliate.coupon_code}</span>
                      <span className="text-green-600 text-sm ml-2">({appliedAffiliate.discount_percentage}% off)</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-green focus:ring-1 focus:ring-primary-green outline-none uppercase"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon}
                      className="px-4 py-2 bg-primary-green text-white rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50"
                    >
                      {isApplyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-500 text-xs mt-1">{couponError}</p>
                )}
                {couponSuccess && (
                  <p className="text-green-600 text-xs mt-1">{couponSuccess}</p>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R{getCartTotal().toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>Discount ({appliedAffiliate?.discount_percentage}%):</span>
                    <span>-R{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
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
              <div className="space-y-3">
                <button
                  onClick={() => setShowCheckout(true)}
                  className="btn-primary w-full"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={() => setShowBNPL(true)}
                  className="w-full py-3 px-6 bg-white border-2 border-gray-800 text-gray-800 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Buy Now, Pay Later
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Buy Now Pay Later Modal */}
      <BuyNowPayLaterModal
        isOpen={showBNPL}
        onClose={() => setShowBNPL(false)}
        totalAmount={getGrandTotal()}
        itemDescription={`${cartItems.length} item${cartItems.length > 1 ? 's' : ''} from shop`}
        onSuccess={clearCart}
      />
    </AnimatePresence>
  );
};

export default CartModal;
