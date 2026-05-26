import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaHome, FaCalendarAlt, FaVideo, FaPhone, FaUserMd, FaMapMarkerAlt, FaClock, FaEnvelope } from 'react-icons/fa';
import {
  getConsultationBookingByBookingId,
  updateConsultationBookingPaymentStatus,
  triggerMakeWebhook,
} from '../lib/supabase';
import { sendFaceToFaceBooking } from '../lib/makeWebhooks';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookingData, setBookingData] = useState(null);
  const [appointmentSaved, setAppointmentSaved] = useState(false);
  const [error, setError] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    const confirmAppointment = async () => {
      if (processedRef.current) return;
      processedRef.current = true;

      const bookingId = searchParams.get('order_id') || searchParams.get('m_payment_id');

      if (!bookingId) {
        setError('No booking reference found. Please contact support.');
        return;
      }

      // Idempotency guard across reloads/redirects in the same session.
      const processedKey = `booking_processed_${bookingId}`;
      if (sessionStorage.getItem(processedKey)) {
        const booking = await getConsultationBookingByBookingId(bookingId);
        if (booking) {
          setBookingData(booking);
          setAppointmentSaved(true);
        }
        return;
      }

      try {
        const booking = await getConsultationBookingByBookingId(bookingId);

        if (!booking) {
          setError(
            'We could not find your booking. Please contact support with reference: ' +
              bookingId
          );
          return;
        }

        setBookingData(booking);

        // If the ITN webhook already flipped this to paid, just show success.
        if (booking.payment_status === 'paid') {
          setAppointmentSaved(true);
          sessionStorage.setItem(processedKey, 'true');
          return;
        }

        await updateConsultationBookingPaymentStatus(bookingId, 'paid');

        const isFaceToFaceNoSlot =
          booking.consultation_type === 'face_to_face' && !booking.appointment_date;

        if (isFaceToFaceNoSlot) {
          await sendFaceToFaceBooking({
            booking_id: booking.booking_id,
            customer_name: booking.customer_name,
            customer_email: booking.customer_email,
            customer_phone: booking.customer_phone,
            consultation_type: booking.consultation_type,
            consultation_price: booking.price,
            location: booking.location,
          });
        } else {
          await triggerMakeWebhook('created', {
            id: booking.booking_id,
            customer_name: booking.customer_name,
            customer_email: booking.customer_email,
            customer_phone: booking.customer_phone,
            consultation_type: booking.consultation_type,
            appointment_date: booking.appointment_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            price: booking.price,
            location: booking.location,
            appointment_status: 'scheduled',
          });
        }

        setAppointmentSaved(true);
        sessionStorage.setItem(processedKey, 'true');
        localStorage.removeItem('pendingBookingMeta');
      } catch (err) {
        console.error('Error confirming appointment:', err);
        setError('There was an issue confirming your appointment. Please contact support.');
        processedRef.current = false;
      }
    };

    confirmAppointment();
  }, [searchParams]);

  const getConsultationInfo = (type) => {
    const info = {
      'virtual': {
        name: 'Virtual Consultation',
        icon: <FaVideo className="text-2xl text-green-600" />,
        iconBg: 'bg-green-100',
      },
      'telephonic': {
        name: 'Telephonic Consultation',
        icon: <FaPhone className="text-2xl text-blue-600" />,
        iconBg: 'bg-blue-100',
      },
      'face_to_face': {
        name: 'Face-to-Face Consultation',
        icon: <FaUserMd className="text-2xl text-purple-600" />,
        iconBg: 'bg-purple-100',
      }
    };
    return info[type] || info['virtual'];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-cream p-4 pt-24">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center mb-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <FaCheckCircle className="text-5xl text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-montserrat font-bold text-primary-green mb-2">
            {bookingData?.consultation_type === 'face_to_face' && !bookingData?.appointment_date
              ? 'Consultation Secured!'
              : 'Booking Confirmed!'}
          </h1>
          <p className="text-gray-600">
            {bookingData?.consultation_type === 'face_to_face' && !bookingData?.appointment_date
              ? 'Thank you for securing your Face-to-Face Consultation. We will respond within 24 hours to finalize a suitable date and time.'
              : 'Your appointment has been successfully booked and confirmed.'}
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center"
          >
            <p className="text-red-700">{error}</p>
          </motion.div>
        )}

        {bookingData && appointmentSaved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
          >
            <div className="bg-[#2d5f3f] p-4 text-white">
              <div className="flex items-center justify-center space-x-2">
                <FaCalendarAlt className="text-xl" />
                <h2 className="text-xl font-semibold">Appointment Details</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
                <div className={`${getConsultationInfo(bookingData.consultation_type).iconBg} p-4 rounded-full`}>
                  {getConsultationInfo(bookingData.consultation_type).icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {getConsultationInfo(bookingData.consultation_type).name}
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {bookingData.appointment_date ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <FaCalendarAlt className="text-gray-400 w-5" />
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium text-gray-800">{formatDate(bookingData.appointment_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <FaClock className="text-gray-400 w-5" />
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium text-gray-800">
                          {(bookingData.start_time || '').substring(0, 5)} - {(bookingData.end_time || '').substring(0, 5)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-3">
                    <FaClock className="text-gray-400 w-5" />
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium text-purple-700">To be confirmed within 24 hours</p>
                    </div>
                  </div>
                )}

                {bookingData.location && (
                  <div className="flex items-center space-x-3">
                    <FaMapMarkerAlt className="text-gray-400 w-5" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-800">{bookingData.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <FaEnvelope className="text-gray-400 w-5" />
                  <div>
                    <p className="text-sm text-gray-500">Confirmation sent to</p>
                    <p className="font-medium text-gray-800">{bookingData.customer_email}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="text-2xl font-bold text-green-600">R{bookingData.price}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {appointmentSaved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-6"
          >
            <h3 className="font-montserrat font-bold text-lg mb-4 text-gray-800">What happens next?</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-1 mt-0.5">
                  <FaCheckCircle className="text-green-600 text-sm" />
                </div>
                <span className="text-gray-700">A confirmation email will be sent to your email address</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-1 mt-0.5">
                  <FaCheckCircle className="text-green-600 text-sm" />
                </div>
                <span className="text-gray-700">You may receive a reminder before your appointment</span>
              </li>
              {bookingData?.consultation_type === 'virtual' && (
                <li className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full p-1 mt-0.5">
                    <FaCheckCircle className="text-green-600 text-sm" />
                  </div>
                  <span className="text-gray-700">A video call link will be sent before your consultation</span>
                </li>
              )}
              {bookingData?.consultation_type === 'telephonic' && (
                <li className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full p-1 mt-0.5">
                    <FaCheckCircle className="text-green-600 text-sm" />
                  </div>
                  <span className="text-gray-700">Dr. Boitumelo will call you at your scheduled time</span>
                </li>
              )}
              {bookingData?.consultation_type === 'face_to_face' && !bookingData?.appointment_date && (
                <li className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full p-1 mt-0.5">
                    <FaCheckCircle className="text-green-600 text-sm" />
                  </div>
                  <span className="text-gray-700">We will contact you within 24 hours to finalize a suitable date and time slot</span>
                </li>
              )}
              {bookingData?.consultation_type === 'face_to_face' && bookingData?.appointment_date && (
                <li className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full p-1 mt-0.5">
                    <FaCheckCircle className="text-green-600 text-sm" />
                  </div>
                  <span className="text-gray-700">Please arrive 10 minutes before your appointment time</span>
                </li>
              )}
            </ul>
          </motion.div>
        )}

        {bookingData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-6"
          >
            <p className="text-sm text-gray-500">
              Booking Reference: <span className="font-mono font-medium">{bookingData.booking_id}</span>
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 px-8 py-3 bg-[#2d5f3f] text-white rounded-xl font-semibold hover:bg-[#234a31] transition-colors shadow-lg"
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
