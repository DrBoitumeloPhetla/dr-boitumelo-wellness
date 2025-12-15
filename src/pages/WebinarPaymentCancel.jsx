import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTimesCircle, FaRedo, FaQuestionCircle } from 'react-icons/fa';

const WebinarPaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const registrationId = searchParams.get('registration_id');

  return (
    <div className="min-h-screen bg-cream pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <FaTimesCircle className="text-5xl" />
            </div>
            <h1 className="text-3xl font-montserrat font-bold mb-2">
              Payment Cancelled
            </h1>
            <p className="text-white/90">
              Your webinar registration was not completed
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm text-yellow-700">
                Your payment was cancelled or could not be processed. No charges have been made to your account.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaQuestionCircle className="text-primary-green" />
                  What would you like to do?
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-green">•</span>
                    <span>Try the payment again from the Vitamin D Talks page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-green">•</span>
                    <span>Use a different payment method</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-green">•</span>
                    <span>Contact us if you're experiencing payment issues</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/vitamin-d-talks"
                  className="flex-1 px-6 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors text-center flex items-center justify-center gap-2"
                >
                  <FaRedo />
                  Try Again
                </Link>
                <Link
                  to="/#contact"
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WebinarPaymentCancel;
