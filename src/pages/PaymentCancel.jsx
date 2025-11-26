import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTimesCircle, FaHome, FaShoppingCart } from 'react-icons/fa';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center"
      >
        {/* Cancel Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full">
            <FaTimesCircle className="text-6xl text-red-600" />
          </div>
        </motion.div>

        {/* Cancel Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-4xl font-montserrat font-bold text-red-600 mb-4">
            Payment Cancelled
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Your payment was cancelled. No charges have been made.
          </p>
        </motion.div>

        {/* Information Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-left"
        >
          <h3 className="font-montserrat font-semibold text-lg mb-3 text-amber-800">
            What happened?
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            You cancelled the payment process before it was completed. Your order has been saved but not processed.
          </p>
          <p className="text-sm text-gray-700">
            If you encountered any issues or have questions, please don't hesitate to contact us at{' '}
            <a href="mailto:supplements@drphetla.co.za" className="text-primary-green font-semibold hover:underline">
              supplements@drphetla.co.za
            </a>
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors"
          >
            <FaShoppingCart />
            <span>Continue Shopping</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white text-primary-green border-2 border-primary-green rounded-lg font-semibold hover:bg-sage transition-colors"
          >
            <FaHome />
            <span>Back to Home</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentCancel;
