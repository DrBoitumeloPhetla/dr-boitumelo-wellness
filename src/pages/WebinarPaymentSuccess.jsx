import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaEnvelope, FaCalendarAlt, FaClock, FaUserMd } from 'react-icons/fa';
import { updateWebinarRegistrationPayment, getWebinarRegistrationById } from '../lib/supabase';

const WebinarPaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const registrationId = searchParams.get('registration_id');
  const [updating, setUpdating] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const updatePayment = async () => {
      if (registrationId) {
        try {
          // Get payment reference from URL if PayFast sends it
          const paymentRef = searchParams.get('pf_payment_id') || `PAY-${Date.now()}`;

          await updateWebinarRegistrationPayment(registrationId, {
            status: 'paid',
            reference: paymentRef
          });
          console.log('Payment status updated successfully');

          // Fetch full registration details for confirmation email
          try {
            const registration = await getWebinarRegistrationById(registrationId);

            if (registration) {
              const webinarDate = new Date(registration.webinars?.date);
              const formattedDate = webinarDate.toLocaleDateString('en-ZA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              // Trigger confirmation email webhook
              const confirmationWebhook = import.meta.env.VITE_MAKE_WEBINAR_PAYMENT_WEBHOOK;
              await fetch(confirmationWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'webinar_payment_confirmed',
                  registrationId: registrationId,
                  firstName: registration.first_name,
                  lastName: registration.last_name,
                  email: registration.email,
                  phone: registration.phone,
                  profession: registration.profession,
                  hpcsaNumber: registration.hpcsa_number,
                  webinarTitle: registration.webinars?.title,
                  webinarDescription: registration.webinars?.description,
                  webinarDate: formattedDate,
                  webinarTime: '6:00 PM - 6:30 PM SAST',
                  webinarPrice: registration.webinars?.price,
                  paymentReference: paymentRef,
                  timestamp: new Date().toISOString()
                })
              });
              console.log('Payment confirmation webhook triggered');
            }
          } catch (webhookErr) {
            console.error('Confirmation webhook error:', webhookErr);
          }
        } catch (err) {
          console.error('Error updating payment status:', err);
          setError('Payment received but status update failed. Please contact support.');
        }
      }
      setUpdating(false);
    };

    updatePayment();
  }, [registrationId, searchParams]);

  if (updating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-green mb-4"></div>
          <p className="text-gray-600 text-lg">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-green to-green-dark text-white p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <FaCheckCircle className="text-5xl" />
            </div>
            <h1 className="text-3xl font-montserrat font-bold mb-2">
              Payment Successful!
            </h1>
            <p className="text-white/90">
              Thank you for registering for Vitamin D Talks
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {error ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            ) : (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                <p className="text-sm text-green-700">
                  Your payment has been received and your registration is being processed.
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUserMd className="text-primary-green" />
                  What happens next?
                </h3>
                <ol className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-green text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Dr. Boitumelo will verify your HPCSA registration number</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-green text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Once approved, you'll receive an email with the Zoom meeting link</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-green text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>You'll also receive a calendar invite for the webinar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-green text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span>A reminder will be sent 24 hours before the webinar</span>
                  </li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FaEnvelope className="text-primary-green" />
                  Check Your Email
                </h3>
                <p className="text-sm text-gray-600">
                  A confirmation email has been sent to your registered email address.
                  Please check your spam folder if you don't see it in your inbox.
                </p>
              </div>

              <div className="text-center pt-4">
                <Link
                  to="/vitamin-d-talks"
                  className="inline-block px-8 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors"
                >
                  Back to Vitamin D Talks
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WebinarPaymentSuccess;
