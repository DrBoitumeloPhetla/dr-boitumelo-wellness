import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaArrowLeft, FaArrowRight, FaVideo, FaPhone, FaUserMd, FaCreditCard, FaCheckCircle, FaMapMarkerAlt, FaCalendarCheck, FaUserPlus, FaUser, FaUsers } from 'react-icons/fa';
import { redirectToPayFast } from '../../lib/payfast';
import TimeSlotPicker from './TimeSlotPicker';

import { getConsultationPricing } from '../../lib/supabase';

const BookingModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Choose type, 1.5: Telephonic patient type, 1.75: Session type (single/couples), 2: Select time, 3: Enter details, 4: Payment
  const [consultationType, setConsultationType] = useState(''); // 'virtual', 'telephonic', or 'face_to_face'
  const [consultationPrice, setConsultationPrice] = useState(0);
  const [patientType, setPatientType] = useState(''); // 'new' or 'existing' (for telephonic)
  const [sessionType, setSessionType] = useState(''); // 'single' or 'couples'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [sessionId] = useState(() => 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));
  const [pricingData, setPricingData] = useState([]);

  // Practice address
  const practiceAddress = "Pretoria";

  // Fetch pricing data when modal opens
  useEffect(() => {
    if (isOpen) {
      getConsultationPricing().then(data => setPricingData(data)).catch(console.error);
    }
  }, [isOpen]);

  // Helper to get price from DB data
  const getPrice = (type, session = 'single') => {
    const found = pricingData.find(p => p.consultation_type === type && p.session_type === session);
    return found?.price || 0;
  };

  const getDuration = (type, session = 'single') => {
    const found = pricingData.find(p => p.consultation_type === type && p.session_type === session);
    return found?.duration || '60 minutes';
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setConsultationType('');
      setConsultationPrice(0);
      setPatientType('');
      setSessionType('');
      setSelectedSlot(null);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setProcessing(false);
    }
  }, [isOpen]);

  const handleConsultationTypeSelect = (type) => {
    setConsultationType(type);
    if (type === 'virtual') {
      setStep(1.75); // Go to session type selection (single/couples)
    } else if (type === 'telephonic') {
      setStep(1.5); // Go to patient type selection
    } else if (type === 'face_to_face') {
      setStep(1.75); // Go to session type selection (single/couples)
    }
  };

  const handleSessionTypeSelect = (type) => {
    setSessionType(type);
    const dbType = consultationType; // 'virtual' or 'face_to_face'
    const price = getPrice(dbType, type);
    setConsultationPrice(price);

    if (consultationType === 'virtual') {
      setStep(2); // Go to time selection
    } else if (consultationType === 'face_to_face') {
      setStep(3); // Skip time slot selection - go straight to details (TEMPORARY)
    }
  };

  const handlePatientTypeSelect = (type) => {
    setPatientType(type);
    const dbType = type === 'new' ? 'telephonic_new' : 'telephonic_existing';
    setConsultationPrice(getPrice(dbType, 'single') || (type === 'new' ? 1000 : 500));
    setStep(2); // Go to time selection
  };

  const handleSlotSelected = (slot) => {
    setSelectedSlot(slot);
  };

  const handleProceedToDetails = () => {
    if (!selectedSlot) {
      alert('Please select an appointment time.');
      return;
    }
    setStep(3); // Go to details form
  };

  const handleProceedToPayment = () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      alert('Please enter your name and email address.');
      return;
    }
    if (consultationType === 'face_to_face' && !customerPhone.trim()) {
      alert('Please enter your phone number for face-to-face consultations.');
      return;
    }
    setStep(4); // Go to payment
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Generate booking ID
      const booking_id = 'BOOK-' + Date.now();

      // Determine location for face-to-face
      const location = consultationType === 'face_to_face' ? practiceAddress : null;

      // Store booking data in localStorage for retrieval after payment
      localStorage.setItem('pendingBooking', JSON.stringify({
        booking_id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        consultation_type: consultationType,
        consultation_price: consultationPrice,
        patient_type: patientType || null,
        session_type: sessionType || null,
        appointment_date: selectedSlot ? selectedSlot.dateStr : null,
        start_time: selectedSlot ? selectedSlot.startTime : null,
        end_time: selectedSlot ? selectedSlot.endTime : null,
        reservation_id: selectedSlot ? selectedSlot.reservationId : null,
        location: location,
        created_at: new Date().toISOString()
      }));

      // Get consultation type display name
      const typeNames = {
        'virtual': 'Virtual Consultation',
        'telephonic': 'Telephonic Consultation',
        'face_to_face': 'Face-to-Face Consultation'
      };

      // Redirect to PayFast for payment
      redirectToPayFast({
        order_id: booking_id,
        customer_name: customerName,
        customer_email: customerEmail,
        total: consultationPrice,
        items: [{
          name: typeNames[consultationType],
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

  const handleClose = () => {
    onClose();
  };

  const handleBack = () => {
    if (step === 1.5) {
      setStep(1);
      setConsultationType('');
    } else if (step === 1.75) {
      setStep(1);
      setConsultationType('');
      setSessionType('');
    } else if (step === 2 && consultationType === 'telephonic') {
      setStep(1.5);
    } else if (step === 2 && (consultationType === 'virtual')) {
      setStep(1.75); // Go back to session type
    } else if (step === 3 && consultationType === 'face_to_face') {
      setStep(1.75); // Go back to session type selection
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  // Format selected date for display
  const formatSelectedDate = () => {
    if (!selectedSlot) return '';
    return selectedSlot.date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get consultation type display info
  const getConsultationInfo = () => {
    const info = {
      'virtual': {
        name: 'Virtual Consultation',
        icon: <FaVideo className="text-3xl text-green-600" />,
        iconBg: 'bg-green-100',
        description: 'Video call consultation with Dr. Boitumelo'
      },
      'telephonic': {
        name: 'Telephonic Consultation',
        icon: <FaPhone className="text-3xl text-blue-600" />,
        iconBg: 'bg-blue-100',
        description: 'Phone call consultation with Dr. Boitumelo'
      },
      'face_to_face': {
        name: 'Face-to-Face Consultation',
        icon: <FaUserMd className="text-3xl text-purple-600" />,
        iconBg: 'bg-purple-100',
        description: `In-person consultation at ${practiceAddress}`
      }
    };
    return info[consultationType] || info['virtual'];
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
            {(step > 1 || step === 1.5) && (
              <button
                onClick={handleBack}
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
              {step === 1.5 && 'Patient Type'}
              {step === 1.75 && 'Session Type'}
              {step === 2 && 'Select Appointment Time'}
              {step === 3 && 'Your Details'}
              {step === 4 && 'Complete Payment'}
            </h2>
            <p className="text-white mt-1 text-center text-xs">
              {step === 1 && 'Select the type of consultation you prefer'}
              {step === 1.5 && 'Are you a new or existing patient?'}
              {step === 1.75 && 'Is this for one person or a couple?'}
              {step === 2 && 'Choose your preferred date and time'}
              {step === 3 && 'Enter your contact information'}
              {step === 4 && `Complete payment for your ${getConsultationInfo().name}`}
            </p>
            {/* Step indicator */}
            <div className="flex justify-center mt-2 space-x-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full ${s === step ? 'bg-yellow-400' : s < step ? 'bg-green-400' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className={step === 1 || step === 1.5 || step === 1.75 ? "p-5 overflow-y-auto bg-[#2d5f3f]" : "p-5 overflow-y-auto"} style={{ maxHeight: 'calc(90vh - 100px)' }}>

            {/* STEP 1: Choose Consultation Type */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Virtual Consultation */}
                <div
                  onClick={() => handleConsultationTypeSelect('virtual')}
                  className="bg-white/95 p-6 rounded-xl border-2 border-white/30 hover:border-yellow-500 cursor-pointer transition-all transform hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-4 rounded-full">
                      <FaVideo className="text-3xl text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">Virtual Consultation</h3>
                      <p className="text-gray-600 text-sm mt-1">Video call consultation with Dr. Boitumelo. This option includes 2 separate 30 minute sessions. (Assessment Consultation & Treatment Plan Consultation.)</p>
                      <p className="text-yellow-600 font-bold text-lg mt-2">
                        From R{(getPrice('virtual', 'single') || 1500).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Telephonic Consultation */}
                <div
                  onClick={() => handleConsultationTypeSelect('telephonic')}
                  className="bg-white/95 p-6 rounded-xl border-2 border-white/30 hover:border-yellow-500 cursor-pointer transition-all transform hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <FaPhone className="text-3xl text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">Telephonic Consultation</h3>
                      <p className="text-gray-600 text-sm mt-1">Phone call consultation with Dr. Boitumelo. This option includes 2 separate 30 minute sessions. (Assessment Consultation & Treatment Plan Consultation.)</p>
                      <p className="text-yellow-600 font-bold text-lg mt-2">
                        R{(getPrice('telephonic_existing', 'single') || 500).toLocaleString()} / R{(getPrice('telephonic_new', 'single') || 1000).toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Existing patients: R{(getPrice('telephonic_existing', 'single') || 500).toLocaleString()} | New patients: R{(getPrice('telephonic_new', 'single') || 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Face-to-Face Consultation */}
                <div
                  onClick={() => handleConsultationTypeSelect('face_to_face')}
                  className="bg-white/95 p-6 rounded-xl border-2 border-white/30 hover:border-yellow-500 cursor-pointer transition-all transform hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 p-4 rounded-full">
                      <FaUserMd className="text-3xl text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">Face-to-Face Consultation</h3>
                      <p className="text-gray-600 text-sm mt-1">In-person consultation with Dr. Boitumelo. Includes a 30 minute complimentary virtual feedback session for results and way forward.</p>
                      <div className="flex items-center text-gray-500 text-xs mt-1">
                        <FaMapMarkerAlt className="mr-1" />
                        <span>{practiceAddress}</span>
                      </div>
                      <p className="text-yellow-600 font-bold text-lg mt-2">
                        From R{(getPrice('face_to_face', 'single') || 2000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-white/70 text-center text-xs mt-4">
                  Virtual & Telephonic include 2 separate 30 minute sessions (Assessment & Treatment Plan)
                </p>
              </div>
            )}

            {/* STEP 1.5: Telephonic Patient Type */}
            {step === 1.5 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="bg-blue-100 p-4 rounded-full inline-block mb-2">
                    <FaPhone className="text-3xl text-blue-600" />
                  </div>
                  <h3 className="text-white text-lg font-bold">Telephonic Consultation</h3>
                  <p className="text-white/70 text-sm">Please select your patient type</p>
                </div>

                {/* Existing Patient */}
                <div
                  onClick={() => handlePatientTypeSelect('existing')}
                  className="bg-white/95 p-6 rounded-xl border-2 border-white/30 hover:border-yellow-500 cursor-pointer transition-all transform hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-4 rounded-full">
                      <FaUser className="text-3xl text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">Existing Patient</h3>
                      <p className="text-gray-600 text-sm mt-1">I have consulted with Dr. Boitumelo before</p>
                      <p className="text-yellow-600 font-bold text-lg mt-2">R{(getPrice('telephonic_existing', 'single') || 500).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* New Patient */}
                <div
                  onClick={() => handlePatientTypeSelect('new')}
                  className="bg-white/95 p-6 rounded-xl border-2 border-white/30 hover:border-yellow-500 cursor-pointer transition-all transform hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <FaUserPlus className="text-3xl text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">New Patient</h3>
                      <p className="text-gray-600 text-sm mt-1">This is my first consultation with Dr. Boitumelo</p>
                      <p className="text-yellow-600 font-bold text-lg mt-2">R{(getPrice('telephonic_new', 'single') || 1000).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1.75: Session Type (Single/Couples) */}
            {step === 1.75 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className={`${consultationType === 'virtual' ? 'bg-green-100' : 'bg-purple-100'} p-4 rounded-full inline-block mb-2`}>
                    {consultationType === 'virtual'
                      ? <FaVideo className="text-3xl text-green-600" />
                      : <FaUserMd className="text-3xl text-purple-600" />
                    }
                  </div>
                  <h3 className="text-white text-lg font-bold">{getConsultationInfo().name}</h3>
                  <p className="text-white/70 text-sm">Is this for one person or a couple?</p>
                </div>

                {/* One Person */}
                <div
                  onClick={() => handleSessionTypeSelect('single')}
                  className="bg-white/95 p-6 rounded-xl border-2 border-white/30 hover:border-yellow-500 cursor-pointer transition-all transform hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <FaUser className="text-3xl text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">One Person</h3>
                      <p className="text-gray-600 text-sm mt-1">Individual consultation session</p>
                      <p className="text-gray-500 text-xs mt-1">{getDuration(consultationType, 'single')}</p>
                      <p className="text-yellow-600 font-bold text-lg mt-2">
                        R{(getPrice(consultationType, 'single') || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Per Couple */}
                <div
                  onClick={() => handleSessionTypeSelect('couples')}
                  className="bg-white/95 p-6 rounded-xl border-2 border-white/30 hover:border-yellow-500 cursor-pointer transition-all transform hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-pink-100 p-4 rounded-full">
                      <FaUsers className="text-3xl text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">Per Couple</h3>
                      <p className="text-gray-600 text-sm mt-1">Consultation session for couples</p>
                      <p className="text-gray-500 text-xs mt-1">{getDuration(consultationType, 'couples')}</p>
                      <p className="text-yellow-600 font-bold text-lg mt-2">
                        R{(getPrice(consultationType, 'couples') || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Select Time Slot */}
            {step === 2 && (
              <div>
                {/* Selected consultation summary */}
                <div className="bg-gray-50 p-4 rounded-xl mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${getConsultationInfo().iconBg} p-2 rounded-full`}>
                      {getConsultationInfo().icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{getConsultationInfo().name}</p>
                      <p className="text-sm text-gray-500">30 minutes</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-600">R{consultationPrice}</p>
                </div>

                {/* Time Slot Picker */}
                <TimeSlotPicker
                  onSlotSelected={handleSlotSelected}
                  sessionId={sessionId}
                />

                {/* Continue Button */}
                <button
                  onClick={handleProceedToDetails}
                  disabled={!selectedSlot}
                  className="w-full mt-4 px-6 py-3 bg-[#2d5f3f] text-white rounded-xl font-semibold hover:bg-[#234a31] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Continue</span>
                  <FaArrowRight />
                </button>
              </div>
            )}

            {/* STEP 3: Customer Details */}
            {step === 3 && (
              <div>
                {/* Appointment Summary */}
                <div className="bg-green-50 p-4 rounded-xl mb-6 border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaCalendarCheck className="text-green-600" />
                    <span className="font-semibold text-green-800">Booking Summary</span>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Type:</strong> {getConsultationInfo().name}</p>
                    {sessionType && (
                      <p><strong>Session:</strong> {sessionType === 'couples' ? 'Per Couple' : 'One Person'}</p>
                    )}
                    {consultationType === 'face_to_face' ? (
                      <p className="text-purple-700 italic">A suitable date and time will be confirmed within 24 hours.</p>
                    ) : (
                      <>
                        <p><strong>Date:</strong> {formatSelectedDate()}</p>
                        <p><strong>Time:</strong> {selectedSlot?.startTime} - {selectedSlot?.endTime}</p>
                      </>
                    )}
                    <p><strong>Price:</strong> R{consultationPrice.toLocaleString()}</p>
                  </div>
                </div>

                {/* Customer Info Form */}
                <div className="space-y-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number {consultationType === 'face_to_face' ? '*' : '(optional)'}
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                      required={consultationType === 'face_to_face'}
                    />
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleProceedToPayment}
                  disabled={!customerName.trim() || !customerEmail.trim() || (consultationType === 'face_to_face' && !customerPhone.trim()) || processing}
                  className="w-full mt-6 px-6 py-3 bg-[#2d5f3f] text-white rounded-xl font-semibold hover:bg-[#234a31] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Payment</span>
                      <FaArrowRight />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STEP 4: Payment */}
            {step === 4 && (
              <div>
                {/* Final Summary */}
                <div className="bg-green-50 p-4 rounded-xl mb-6 border border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <FaCheckCircle className="text-green-600" />
                    <span className="font-semibold text-green-800">Booking Summary</span>
                  </div>
                  <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex justify-between">
                      <span>Consultation Type:</span>
                      <span className="font-medium">{getConsultationInfo().name}</span>
                    </div>
                    {sessionType && (
                      <div className="flex justify-between">
                        <span>Session:</span>
                        <span className="font-medium">{sessionType === 'couples' ? 'Per Couple' : 'One Person'}</span>
                      </div>
                    )}
                    {consultationType === 'face_to_face' ? (
                      <p className="text-purple-700 italic text-xs">Date and time will be confirmed within 24 hours.</p>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-medium">{formatSelectedDate()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span className="font-medium">{selectedSlot?.startTime} - {selectedSlot?.endTime}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-medium">{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{customerEmail}</span>
                    </div>
                    {customerPhone && (
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span className="font-medium">{customerPhone}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-bold text-green-700">
                      <span>Total:</span>
                      <span>R{consultationPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-center">
                  <FaCreditCard className="text-5xl text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Secure Payment</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    {consultationType === 'face_to_face'
                      ? 'Complete payment to secure your consultation. We will contact you within 24 hours to finalize a suitable date and time.'
                      : 'Your time slot is reserved for 10 minutes. Complete payment to confirm your booking.'}
                  </p>

                  <div className="space-y-3">
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
                          <span>Pay R{consultationPrice}</span>
                          <FaArrowRight />
                        </>
                      )}
                    </button>


                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    You will receive a confirmation email after payment.
                  </p>
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
