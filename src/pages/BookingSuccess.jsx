import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaHome } from 'react-icons/fa';

const BookingSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center"
      >
        {/* Success Icon */}
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

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-4xl font-montserrat font-bold text-primary-green mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Thank you for your payment. Your consultation booking has been confirmed.
          </p>
        </motion.div>


        {/* What's Next */}
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
              <span>You'll receive a payment confirmation email shortly</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-green mr-2">✓</span>
              <span>Your appointment has been scheduled and confirmed</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-green mr-2">✓</span>
              <span>You should have received a calendar invitation from Calendly</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-green mr-2">✓</span>
              <span>Dr. Boitumelo will contact you at your scheduled time</span>
            </li>
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex justify-center"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors"
          >
            <FaHome />
            <span>Back to Home</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default BookingSuccess;
