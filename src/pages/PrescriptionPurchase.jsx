import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPrescriptionBottle, FaCheckCircle, FaExclamationTriangle, FaShoppingCart } from 'react-icons/fa';
import { getPrescriptionRequestByCode, markPrescriptionRequestUsed, markPrescriptionFirstVisit } from '../lib/supabase';
import { useCart } from '../context/CartContext';

const PrescriptionPurchase = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadPrescriptionRequest();
  }, [code]);

  const loadPrescriptionRequest = async () => {
    try {
      setLoading(true);
      const data = await getPrescriptionRequestByCode(code);

      if (!data) {
        setError('Invalid prescription code. Please check the link and try again.');
        return;
      }

      if (data.status !== 'approved') {
        setError('This prescription request has not been approved yet.');
        return;
      }

      if (data.used_at) {
        setError('This prescription link has already been used.');
        return;
      }

      // Check if link expired (7 days from approval)
      if (new Date(data.expires_at) < new Date()) {
        setError('This prescription link has expired. Please contact Dr. Boitumelo for a new link.');
        return;
      }

      // Check if 24-hour purchase window has expired (from first visit)
      if (data.first_visited_at) {
        const visitTime = new Date(data.first_visited_at);
        const now = new Date();
        const hoursSinceVisit = (now - visitTime) / (1000 * 60 * 60);

        if (hoursSinceVisit > 24) {
          setError('Your 24-hour purchase window has expired. Please contact Dr. Boitumelo for a new link.');
          return;
        }
      } else {
        // First visit - mark the visit time (starts 24hr countdown)
        await markPrescriptionFirstVisit(code);
      }

      setRequest(data);
    } catch (err) {
      console.error('Error loading prescription request:', err);
      setError('Failed to load prescription details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      // Add product to cart
      addToCart(request.products);

      // Mark prescription request as used
      await markPrescriptionRequestUsed(code);

      // Show success and redirect to cart
      alert('Product added to cart! Redirecting to checkout...');
      setTimeout(() => {
        navigate('/shop');
      }, 1000);
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add product to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-green mb-4"></div>
          <p className="text-gray-600 text-lg">Loading prescription details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <FaExclamationTriangle className="text-5xl text-red-600" />
          </div>
          <h1 className="text-3xl font-montserrat font-bold text-gray-800 mb-4">
            Unable to Process Request
          </h1>
          <p className="text-lg text-gray-700 mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors"
          >
            Return to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-primary-green text-white p-8">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 rounded-full">
                <FaPrescriptionBottle className="text-4xl" />
              </div>
              <div>
                <h1 className="text-3xl font-montserrat font-bold">
                  Prescription Approved
                </h1>
                <p className="text-white/90 mt-1">
                  Dr. Boitumelo has approved your request
                </p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-2xl text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Your Prescription Request Has Been Approved!
                </h2>
                <p className="text-gray-600">
                  Dr. Boitumelo has reviewed your health information and approved your purchase of this product.
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <p className="text-gray-700">
                <strong>Approved for:</strong> {request.customer_name}
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong> {request.customer_email}
              </p>
              <p className="text-gray-700">
                <strong>Link Expires:</strong> {new Date(request.expires_at).toLocaleDateString()} at {new Date(request.expires_at).toLocaleTimeString()}
              </p>
              {request.first_visited_at && (
                <p className="text-gray-700 mt-2 font-semibold text-orange-700">
                  <strong>24-Hour Purchase Window:</strong> {' '}
                  {(() => {
                    const visitTime = new Date(request.first_visited_at);
                    const expiryTime = new Date(visitTime.getTime() + 24 * 60 * 60 * 1000);
                    const hoursLeft = Math.max(0, (expiryTime - new Date()) / (1000 * 60 * 60));
                    return `${Math.floor(hoursLeft)} hours ${Math.floor((hoursLeft % 1) * 60)} minutes remaining`;
                  })()}
                </p>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Approved Product</h3>
            <div className="flex items-center space-x-6 p-6 bg-gray-50 rounded-xl border-2 border-primary-green">
              {request.products?.image_url && (
                <img
                  src={request.products.image_url}
                  alt={request.products.name}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-gray-800 mb-2">
                  {request.products?.name}
                </h4>
                <p className="text-gray-600 mb-4">
                  {request.products?.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-primary-green">
                    R{request.products?.price}
                  </span>
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="px-8 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <FaShoppingCart />
                        <span>Add to Cart & Checkout</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="p-8 bg-yellow-50 border-t border-yellow-200">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
              <FaExclamationTriangle className="text-yellow-600" />
              <span>Important Notes</span>
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span>You have 24 hours from opening this link to complete your purchase</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span>This link can only be used once for your safety</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span>The link will expire on {new Date(request.expires_at).toLocaleDateString()} or after 24 hours, whichever comes first</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span>Follow Dr. Boitumelo's dosage instructions carefully</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span>Contact Dr. Boitumelo if you have any questions or concerns</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrescriptionPurchase;
