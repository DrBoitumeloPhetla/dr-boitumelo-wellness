import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaArrowLeft, FaArrowRight, FaVideo, FaPhone, FaCreditCard } from 'react-icons/fa';
import { redirectToPayFast } from '../../lib/payfast';

const BookingModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Choose consultation type, 2: Calendly booking, 3: Payment
  const [consultationType, setConsultationType] = useState(''); // 'virtual' or 'telephonic'
  const [consultationPrice, setConsultationPrice] = useState(0);
  const [calendlyKey, setCalendlyKey] = useState(0); // Key to force widget remount
  const [calendlyEventData, setCalendlyEventData] = useState(null); // Store Calendly booking data
  const [calendlyBooked, setCalendlyBooked] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load Calendly widget script and listen for booking events
  useEffect(() => {
    if (isOpen && step === 2) {
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
          // Auto-advance to payment step after 2 seconds
          setTimeout(() => {
            setStep(3);
          }, 2000);
        }
      };

      window.addEventListener('message', handleCalendlyEvent);

      return () => {
        window.removeEventListener('message', handleCalendlyEvent);
      };
    }
  }, [isOpen, step]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Generate booking ID
      const booking_id = 'BOOK-' + Date.now();

      // Extract user info from Calendly event data
      const invitee = calendlyEventData?.invitee || {};
      const customerName = invitee.name || 'Guest';
      const customerEmail = invitee.email || '';

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
    setStep(2); // Go directly to Calendly widget
  };

  const handleClose = () => {
    setStep(1);
    setConsultationType('');
    setConsultationPrice(0);
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
              {step === 2 && 'Book Your Appointment'}
              {step === 3 && 'Payment'}
            </h2>
            <p className="text-white mt-1 text-center text-xs">
              {step === 1 && 'Select the type of consultation you prefer'}
              {step === 2 && 'Choose your preferred appointment time'}
              {step === 3 && `Complete payment for ${consultationType} consultation (R${consultationPrice})`}
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

            {/* STEP 2: Calendly Booking */}
            {step === 2 && (
              <div className="h-full" key={`calendly-${calendlyKey}`}>
                {calendlyBooked && (
                  <div className="px-4 pt-3 pb-2 bg-green-50 border-b border-green-200">
                    <p className="text-green-800 text-sm">
                      <strong>✓ Appointment booked!</strong> Redirecting to payment...
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

            {/* STEP 3: Payment */}
            {step === 3 && (
              <div className="p-8 bg-white">
                <div className="max-w-md mx-auto">
                  <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-700 font-semibold">{consultationType === 'virtual' ? 'Virtual' : 'Telephonic'} Consultation</span>
                      <span className="text-2xl font-bold text-green-600">R{consultationPrice}</span>
                    </div>
                    <div className="border-t border-green-300 pt-3 space-y-1 text-sm">
                      {calendlyEventData?.invitee && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-semibold">{calendlyEventData.invitee.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-semibold">{calendlyEventData.invitee.email}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Appointment:</span>
                        <span className="font-semibold text-green-600">✓ Scheduled</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-100 p-6 rounded-xl border-2 border-yellow-300 text-center">
                    <FaCreditCard className="text-5xl text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Secure Payment</h3>
                    <p className="text-gray-600 text-sm mb-6">Complete your payment to confirm your consultation booking</p>

                    <button
                      onClick={handlePayment}
                      disabled={processing}
                      className="w-full px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-xl hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Proceed to Payment</span>
                          <FaArrowRight />
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 mt-4">
                      Your appointment is reserved. Payment is required to confirm.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingModal;
