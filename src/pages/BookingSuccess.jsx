import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaHome, FaCalendarAlt } from 'react-icons/fa';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [calendlyBooked, setCalendlyBooked] = useState(false);
  const [showCalendly, setShowCalendly] = useState(true);

  // Load Calendly widget script and listen for booking events
  useEffect(() => {
    if (showCalendly) {
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          if (window.Calendly) {
            window.Calendly.initInlineWidget({
              url: `https://calendly.com/drboitumelowellnesssupplements/30min?hide_gdpr_banner=1&background_color=f0fdf4&text_color=1f2937&primary_color=eab308`,
              parentElement: document.querySelector('.calendly-inline-widget'),
            });
          }
        };
      } else {
        if (window.Calendly) {
          setTimeout(() => {
            const widgetElement = document.querySelector('.calendly-inline-widget');
            if (widgetElement) {
              widgetElement.innerHTML = '';
              window.Calendly.initInlineWidget({
                url: `https://calendly.com/drboitumelowellnesssupplements/30min?hide_gdpr_banner=1&background_color=f0fdf4&text_color=1f2937&primary_color=eab308`,
                parentElement: widgetElement,
              });
            }
          }, 100);
        }
      }

      // Listen for Calendly booking events
      const handleCalendlyEvent = (e) => {
        if (e.data.event === 'calendly.event_scheduled') {
          console.log('Calendly event scheduled:', e.data);
          setCalendlyBooked(true);
          setShowCalendly(false);
        }
      };

      window.addEventListener('message', handleCalendlyEvent);

      return () => {
        window.removeEventListener('message', handleCalendlyEvent);
      };
    }
  }, [showCalendly]);

  return (
    <div className="min-h-screen bg-cream p-4 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Payment Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center mb-6"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <FaCheckCircle className="text-4xl text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-montserrat font-bold text-primary-green mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Thank you for your payment. Please select your preferred appointment time below.
          </p>
        </motion.div>

        {/* Calendly Booking Section */}
        {showCalendly && !calendlyBooked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
          >
            <div className="bg-primary-green p-4 text-white">
              <div className="flex items-center justify-center space-x-2">
                <FaCalendarAlt className="text-xl" />
                <h2 className="text-xl font-semibold">Select Your Appointment Time</h2>
              </div>
              <p className="text-green-100 text-sm text-center mt-1">
                Choose a date and time that works best for you
              </p>
            </div>
            <div
              className="calendly-inline-widget"
              data-url="https://calendly.com/drboitumelowellnesssupplements/30min?hide_gdpr_banner=1&background_color=f0fdf4&text_color=1f2937&primary_color=eab308"
              style={{ minWidth: '320px', height: '650px' }}
            />
          </motion.div>
        )}

        {/* Appointment Confirmed Section */}
        {calendlyBooked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <FaCalendarAlt className="text-4xl text-blue-600" />
            </div>
            <h2 className="text-2xl font-montserrat font-bold text-primary-green mb-2">
              Appointment Confirmed!
            </h2>
            <p className="text-gray-600 mb-6">
              Your consultation has been scheduled. You will receive a confirmation email shortly.
            </p>

            {/* What's Next */}
            <div className="bg-blue-50 rounded-xl p-6 text-left max-w-md mx-auto">
              <h3 className="font-montserrat font-semibold text-lg mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-green mr-2">✓</span>
                  <span>You'll receive a calendar invitation from Calendly</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-green mr-2">✓</span>
                  <span>A confirmation email will be sent to your email address</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-green mr-2">✓</span>
                  <span>Dr. Boitumelo will contact you at your scheduled time</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Back to Home Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors shadow-lg"
          >
            <FaHome />
            <span>Back to Home</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingSuccess;
