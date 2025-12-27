import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaArrowLeft, FaArrowRight, FaVideo, FaPhone, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import { redirectToPayFast } from '../../lib/payfast';

const BookingModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Choose consultation type, 2: Payment, 3: Calendly booking
  const [consultationType, setConsultationType] = useState(''); // 'virtual' or 'telephonic'
  const [consultationPrice, setConsultationPrice] = useState(0);
  const [calendlyKey, setCalendlyKey] = useState(0); // Key to force widget remount
  const [calendlyEventData, setCalendlyEventData] = useState(null); // Store Calendly booking data
  const [calendlyBooked, setCalendlyBooked] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Load Calendly widget script and listen for booking events
  useEffect(() => {
    if (isOpen && step === 3) {
      // Force widget to remount by updating key
      setCalendlyKey(prev => prev + 1);

      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);

        // Initialize widget after script loads
        script.onload = () => {
          if (window.Calendly) {
            window.Calendly.initInlineWidget({
              url: `https://calendly.com/drboitumelowellnesssupplements/30min?hide_gdpr_banner=1&background_color=f0fdf4&text_color=1f2937&primary_color=eab308`,
              parentElement: document.querySelector('.calendly-inline-widget'),
            });
          }
        };
      } else {
        // Script already exists, just reinitialize the inline widget
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
          setCalendlyEventData(e.data.payload);
          setCalendlyBooked(true);
        }
      };

      window.addEventListener('message', handleCalendlyEvent);

      return () => {
        window.removeEventListener('message', handleCalendlyEvent);
      };
    }
  }, [isOpen, step]);

  const handlePayment = async () => {
    // Validate customer info
    if (!customerName.trim() || !customerEmail.trim()) {
      alert('Please enter your name and email address.');
      return;
    }

    setProcessing(true);
    try {
      // Generate booking ID
      const booking_id = 'BOOK-' + Date.now();

      // Store booking data in localStorage for retrieval after payment
      localStorage.setItem('pendingBooking', JSON.stringify({
        booking_id,
        customer_name: customerName,
        customer_email: customerEmail,
        consultation_type: consultationType,
        consultation_price: consultationPrice,
        created_at: new Date().toISOString()
      }));

      // Redirect to PayFast for payment
      redirectToPayFast({
        order_id: booking_id,
        customer_name: customerName,
        customer_email: customerEmail,
        total: consultationPrice,
        items: [{
          name: `${consultationType === 'virtual' ? 'Virtual' : 'Telephonic'} Consultation`,
          quantity: 1,
          price: consultationPrice
        }]
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment. Please try again.');
      setProcessing(false);
    }
  };

  const handleConsultationTypeSelect = (type) => {
    setConsultationType(type);
    setConsultationPrice(type === 'virtual' ? 1500 : 1000);
    setStep(2); // Go to payment step
  };

  const handleClose = () => {
    setStep(1);
    setConsultationType('');
    setConsultationPrice(0);
    setCustomerName('');
    setCustomerEmail('');
    setPaymentComplete(false);
    setCalendlyBooked(false);
    setCalendlyEventData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative"
        >
          {/* Header */}
          <div className="bg-[#2d5f3f] p-3 text-white relative">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="absolute top-2 left-2 text-white hover:text-gray-200 transition-colors flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-lg text-sm"
              >
                <FaArrowLeft className="text-xs" />
                <span>Back</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-all shadow-lg hover:scale-110"
            >
              <FaTimes className="text-sm" />
            </button>
            <h2 className="text-xl font-bold text-center text-white">
              {step === 1 && 'Choose Consultation Type'}
              {step === 2 && 'Payment'}
              {step === 3 && 'Book Your Appointment'}
            </h2>
            <p className="text-white mt-1 text-center text-xs">
              {step === 1 && 'Select the type of consultation you prefer'}
              {step === 2 && `Complete payment for ${consultationType} consultation (R${consultationPrice})`}
              {step === 3 && 'Choose your preferred appointment time'}
            </p>
          </div>

          {/* Content */}
          <div className={step === 1 ? "p-5 overflow-y-auto bg-[#2d5f3f]" : "overflow-y-auto"} style={{ maxHeight: 'calc(90vh - 80px)' }}>

            {/* STEP 1: Choose Consultation Type */}
            {step === 1 && (
              <div className="space-y-4">
                <div
                  onClick={() => handleConsultationTypeSelect('virtual')}
                  className="bg-white/95 p-6 rounded-xl border-2 border-white/30 hover:border-yellow-500 cursor-pointer transition-all transform hover:scale-105"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-4 rounded-full">
                      <FaVideo className="text-3xl text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">Virtual Consultation</h3>
                      <p className="text-gray-600 text-sm mt-1">Video call consultation with Dr. Boitumelo</p>
                      <p className="text-yellow-600 font-bold text-lg mt-2">R1,500</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleConsultationTypeSelect('telephonic')}
                  className="bg-white/95 p-6 rounded-xl border-2 border-white/30 hover:border-yellow-500 cursor-pointer transition-all transform hover:scale-105"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <FaPhone className="text-3xl text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">Telephonic Consultation</h3>
                      <p className="text-gray-600 text-sm mt-1">Phone call consultation with Dr. Boitumelo</p>
                      <p className="text-yellow-600 font-bold text-lg mt-2">R1,000</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div className="p-8 bg-white">
                <div className="max-w-md mx-auto">
                  <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-700 font-semibold">{consultationType === 'virtual' ? 'Virtual' : 'Telephonic'} Consultation</span>
                      <span className="text-2xl font-bold text-green-600">R{consultationPrice}</span>
                    </div>
                  </div>

                  {/* Customer Info Form */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-100 p-6 rounded-xl border-2 border-yellow-300 text-center">
                    <FaCreditCard className="text-5xl text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Secure Payment</h3>
                    <p className="text-gray-600 text-sm mb-6">Complete your payment to proceed with booking your appointment</p>

                    <button
                      onClick={handlePayment}
                      disabled={processing || !customerName.trim() || !customerEmail.trim()}
                      className="w-full px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-xl hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Pay R{consultationPrice}</span>
                          <FaArrowRight />
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 mt-4">
                      After payment, you'll be able to select your preferred appointment time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Calendly Booking (after payment) */}
            {step === 3 && (
              <div className="h-full" key={`calendly-${calendlyKey}`}>
                <div className="px-4 pt-3 pb-2 bg-green-50 border-b border-green-200">
                  <div className="flex items-center space-x-2">
                    <FaCheckCircle className="text-green-600" />
                    <p className="text-green-800 text-sm">
                      <strong>Payment Complete!</strong> Now select your preferred appointment time below.
                    </p>
                  </div>
                </div>
                {calendlyBooked && (
                  <div className="px-4 pt-3 pb-2 bg-blue-50 border-b border-blue-200">
                    <p className="text-blue-800 text-sm">
                      <strong>✓ Appointment booked!</strong> You will receive a confirmation email shortly.
                    </p>
                  </div>
                )}
                <div
                  className="calendly-inline-widget"
                  data-url="https://calendly.com/drboitumelowellnesssupplements/30min?hide_gdpr_banner=1&background_color=f0fdf4&text_color=1f2937&primary_color=eab308"
                  style={{ minWidth: '320px', height: '600px' }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingModal;
