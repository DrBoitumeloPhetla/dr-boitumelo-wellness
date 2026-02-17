import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaHome, FaCalendarAlt, FaVideo, FaPhone, FaUserMd, FaMapMarkerAlt, FaClock, FaEnvelope } from 'react-icons/fa';
import { createConsultationBooking, triggerMakeWebhook } from '../lib/supabase';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [appointmentSaved, setAppointmentSaved] = useState(false);
  const [error, setError] = useState(null);
  const appointmentSavedRef = useRef(false);

  // Save appointment data to database on mount
  useEffect(() => {
    const saveAppointment = async () => {
      // Prevent double-saving
      if (appointmentSavedRef.current) return;

      const pendingBooking = localStorage.getItem('pendingBooking');
      if (pendingBooking) {
        try {
          appointmentSavedRef.current = true;
          const data = JSON.parse(pendingBooking);
          setBookingData(data);

          // Create the appointment in the database
          await createConsultationBooking({
            bookingId: data.booking_id,
            customerName: data.customer_name,
            customerEmail: data.customer_email,
            customerPhone: data.customer_phone,
            consultationType: data.consultation_type,
            appointmentDate: data.appointment_date,
            startTime: data.start_time,
            endTime: data.end_time,
            price: data.consultation_price,
            paymentStatus: 'paid',
            location: data.location,
            reservationId: data.reservation_id
          });

          console.log('Appointment saved:', data);
          setAppointmentSaved(true);

          // Trigger webhook for new appointment confirmation email
          await triggerMakeWebhook('created', {
            id: data.booking_id,
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone,
            consultation_type: data.consultation_type,
            appointment_date: data.appointment_date,
            start_time: data.start_time,
            end_time: data.end_time,
            price: data.consultation_price,
            location: data.location,
            appointment_status: 'scheduled'
          });

          // Clear the pending booking from localStorage
          localStorage.removeItem('pendingBooking');
        } catch (err) {
          console.error('Error saving appointment:', err);
          setError('There was an issue confirming your appointment. Please contact support.');
          appointmentSavedRef.current = false;
        }
      } else {
        // No pending booking - payment went through but data not in localStorage (e.g. mobile browser context switch)
        // Success header is still shown since PayFast redirected here after successful payment
      }
    };

    saveAppointment();
  }, []);

  // Get consultation type display info
  const getConsultationInfo = (type) => {
    const info = {
      'virtual': {
        name: 'Virtual Consultation',
        icon: <FaVideo className="text-2xl text-green-600" />,
        iconBg: 'bg-green-100',
        description: 'Video call consultation'
      },
      'telephonic': {
        name: 'Telephonic Consultation',
        icon: <FaPhone className="text-2xl text-blue-600" />,
        iconBg: 'bg-blue-100',
        description: 'Phone call consultation'
      },
      'face_to_face': {
        name: 'Face-to-Face Consultation',
        icon: <FaUserMd className="text-2xl text-purple-600" />,
        iconBg: 'bg-purple-100',
        description: 'In-person consultation'
      }
    };
    return info[type] || info['virtual'];
  };

  // Format date for display
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
        {/* Success Header */}
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
            Booking Confirmed!
          </h1>
          <p className="text-gray-600">
            Your appointment has been successfully booked and confirmed.
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center"
          >
            <p className="text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Appointment Details */}
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
              {/* Consultation Type */}
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
                <div className={`${getConsultationInfo(bookingData.consultation_type).iconBg} p-4 rounded-full`}>
                  {getConsultationInfo(bookingData.consultation_type).icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {getConsultationInfo(bookingData.consultation_type).name}
                  </h3>
                  <p className="text-gray-500 text-sm">30 minutes consultation</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
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
                    <p className="font-medium text-gray-800">{bookingData.start_time} - {bookingData.end_time}</p>
                  </div>
                </div>

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
                    <span className="text-2xl font-bold text-green-600">R{bookingData.consultation_price}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* What's Next Section */}
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
              {bookingData?.consultation_type === 'face_to_face' && (
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

        {/* Booking Reference */}
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

        {/* Back to Home Button */}
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
