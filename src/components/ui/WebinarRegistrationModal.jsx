import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCalendarAlt, FaClock, FaUserMd, FaCheckCircle } from 'react-icons/fa';
import { createWebinarRegistration, checkExistingWebinarRegistration } from '../../lib/supabase';

const WebinarRegistrationModal = ({ isOpen, onClose, webinar }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profession: '',
    hpcsaNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = form, 2 = confirm, 3 = success

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateHPCSA = (number) => {
    // Accept either just digits (5-7 digits) or letters followed by digits
    const cleaned = number.replace(/\s/g, '');
    // Allow: just numbers (e.g., 1234567) or letters + numbers (e.g., MP1234567)
    const hpcsaPattern = /^([A-Z]{2,4})?\d{5,7}$/i;
    return hpcsaPattern.test(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.profession || !formData.hpcsaNumber) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate HPCSA number format
    if (!validateHPCSA(formData.hpcsaNumber)) {
      setError('Please enter a valid HPCSA number (e.g., 1234567 or MP1234567)');
      return;
    }

    setStep(2); // Move to confirmation step
  };

  const handleConfirmRegistration = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Check if already registered
      const existingReg = await checkExistingWebinarRegistration(webinar.id, formData.email);
      if (existingReg) {
        setError('You are already registered for this webinar. Please check your email for details.');
        setIsSubmitting(false);
        return;
      }

      // Create registration in database (free registration - marked as paid/confirmed)
      const registration = await createWebinarRegistration({
        webinarId: webinar.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        profession: formData.profession,
        hpcsaNumber: formData.hpcsaNumber.toUpperCase().replace(/\s/g, ''),
        paymentStatus: 'paid'
      });

      // Trigger Make.com webhook for new registration notification
      const webhookUrl = import.meta.env.VITE_MAKE_WEBINAR_WEBHOOK;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'webinar_registration',
              registrationId: registration.id,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              profession: formData.profession,
              hpcsaNumber: formData.hpcsaNumber.toUpperCase(),
              webinarTitle: webinar.title,
              webinarDate: webinar.date,
              isFree: true,
              timestamp: new Date().toISOString()
            })
          });
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
        }
      }

      setStep(3); // Show success message

    } catch (err) {
      console.error('Error creating registration:', err);
      setError('Failed to process registration. Please try again.');
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      profession: '',
      hpcsaNumber: ''
    });
    setStep(1);
    setError('');
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!webinar) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-primary-green text-white p-6 rounded-t-2xl">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
              >
                <FaTimes />
              </button>
              <div className="flex items-center space-x-3">
                <FaUserMd className="text-3xl" />
                <div>
                  <h2 className="text-xl font-montserrat font-bold">
                    Webinar Registration
                  </h2>
                  <p className="text-sm text-white/90 mt-1">
                    {webinar.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Webinar Info */}
              <div className="bg-cream rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-primary-green" />
                    <span>{formatDate(webinar.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-primary-green" />
                    <span>6:00 PM - 6:30 PM</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-gray-600">Registration Fee:</span>
                  <span className="text-2xl font-bold text-primary-green">FREE</span>
                </div>
              </div>

              {step === 1 && (
                <>
                  {/* Info Notice */}
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                    <p className="text-sm text-gray-700">
                      <strong className="text-blue-700">Healthcare Practitioners Only:</strong> Your HPCSA number will be verified before access to the webinar is granted.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Profession <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="profession"
                        value={formData.profession}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent bg-white"
                      >
                        <option value="">Select your profession</option>
                        <option value="Medical Doctor">Medical Doctor</option>
                        <option value="Specialist">Specialist</option>
                        <option value="Nurse">Nurse</option>
                        <option value="Pharmacist">Pharmacist</option>
                        <option value="Physiotherapist">Physiotherapist</option>
                        <option value="Dietitian">Dietitian</option>
                        <option value="Psychologist">Psychologist</option>
                        <option value="Dentist">Dentist</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        HPCSA Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="hpcsaNumber"
                        value={formData.hpcsaNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent uppercase"
                        placeholder="1234567"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your Health Professions Council of South Africa registration number
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full px-6 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors"
                    >
                      Continue
                    </button>
                  </form>
                </>
              )}

              {step === 2 && (
                <>
                  {/* Confirmation */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-800">Confirm Your Details</h3>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-semibold">{formData.firstName} {formData.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold">{formData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold">{formData.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profession:</span>
                        <span className="font-semibold">{formData.profession}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">HPCSA Number:</span>
                        <span className="font-semibold uppercase">{formData.hpcsaNumber}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 border-l-4 border-green-400 p-4">
                      <p className="text-sm text-gray-700">
                        <strong>Important:</strong> Your HPCSA number will be verified.
                        Once approved, you'll receive an email with the Zoom meeting link.
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleConfirmRegistration}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <FaCheckCircle />
                        {isSubmitting ? 'Processing...' : 'Complete Registration'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  {/* Success */}
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <FaCheckCircle className="text-4xl text-primary-green" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 mb-2">Registration Successful!</h3>
                    <p className="text-gray-600 mb-4">
                      Thank you for registering for this free webinar. Your HPCSA number will be verified and you'll receive an email with the Zoom meeting link once approved.
                    </p>
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WebinarRegistrationModal;
