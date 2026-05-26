import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaEnvelope, FaUserMd } from 'react-icons/fa';
import {
  getWebinarRegistrationById,
  updateWebinarRegistrationPaymentStatus,
} from '../lib/supabase';

const WebinarPaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [updating, setUpdating] = useState(true);
  const [error, setError] = useState(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const processRegistration = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {
        // The order_id we passed to PayFast was `WEBINAR-<registration_uuid>`.
        // PayFast returns it back as `payment_id` (and also `m_payment_id`).
        const rawId =
          searchParams.get('payment_id') || searchParams.get('m_payment_id');

        if (!rawId || !rawId.startsWith('WEBINAR-')) {
          setError(
            'Registration reference not found. If you completed payment, please contact support.'
          );
          setUpdating(false);
          return;
        }

        const registrationId = rawId.replace(/^WEBINAR-/, '');
        const pfPaymentRef = searchParams.get('pf_payment_id') || null;

        const registration = await getWebinarRegistrationById(registrationId);

        if (!registration) {
          setError(
            'We could not locate your registration. Please contact support.'
          );
          setUpdating(false);
          return;
        }

        // If the ITN webhook already processed this (status === 'paid'),
        // just show success without sending the webhook again.
        if (registration.payment_status === 'paid') {
          setUpdating(false);
          return;
        }

        await updateWebinarRegistrationPaymentStatus(
          registrationId,
          'paid',
          pfPaymentRef
        );

        const meta = JSON.parse(
          localStorage.getItem('pendingWebinarMeta') || '{}'
        );

        const webinarDateRaw = registration.webinars?.date;
        const formattedDate = webinarDateRaw
          ? new Date(webinarDateRaw).toLocaleDateString('en-ZA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Monthly';

        // Fire the Make.com webhook for the payment-confirmed email.
        const webhookUrl = import.meta.env.VITE_MAKE_WEBINAR_APPROVAL_WEBHOOK;
        if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'webinar_payment_confirmed',
                registrationId: registration.id,
                title: meta.title || '',
                firstName: registration.first_name,
                lastName: registration.last_name,
                email: registration.email,
                phone: registration.phone,
                profession: registration.profession,
                hpcsaNumber: registration.hpcsa_number,
                webinarTitle: meta.webinarTitle || registration.webinars?.title || 'Vitamin D Talks',
                webinarDate: formattedDate,
                webinarTime: '19h00 - 20h00 SAST',
                webinarPrice: meta.webinarPrice || registration.webinars?.price,
                paymentReference: pfPaymentRef,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch (webhookErr) {
            console.error('Webhook error:', webhookErr);
          }
        }

        localStorage.removeItem('pendingWebinarMeta');
      } catch (err) {
        console.error('Error confirming registration:', err);
        setError(
          'Payment received but we hit an issue confirming the registration. Please contact support.'
        );
      }
      setUpdating(false);
    };

    processRegistration();
  }, [searchParams]);

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
