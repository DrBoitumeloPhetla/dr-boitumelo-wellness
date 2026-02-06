import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCalendar, FaFileUpload, FaUser, FaIdCard, FaEnvelope, FaPhone } from 'react-icons/fa';
import { sendBNPLApplication } from '../../lib/makeWebhooks';

const BuyNowPayLaterModal = ({ isOpen, onClose, totalAmount, itemDescription }) => {
  const [step, setStep] = useState(1); // 1: Configure Advance, 2: Your Details
  const [advanceAmount, setAdvanceAmount] = useState(totalAmount);
  const [repaymentTerm, setRepaymentTerm] = useState(2); // months
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    email: '',
    mobile: '',
    idDocument: null,
    bankStatement: null
  });

  const INTEREST_RATE = 0.30; // 30%
  const MIN_ADVANCE = 400;
  const MAX_ADVANCE = 5000;

  const calculateRepayment = () => {
    const totalRepayable = advanceAmount + (advanceAmount * INTEREST_RATE);
    const monthlyInstallment = totalRepayable / repaymentTerm;
    return {
      advanceAmount,
      repaymentPeriod: repaymentTerm,
      totalRepayable,
      monthlyInstallment
    };
  };

  const payment = calculateRepayment();

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    setFormData({ ...formData, [field]: file });
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.fullName || !formData.idNumber || !formData.mobile || !formData.idDocument || !formData.bankStatement) {
        alert('Please fill in all required fields and upload both documents.');
        return;
      }

      // Convert files to base64
      const idDocumentBase64 = await fileToBase64(formData.idDocument);
      const bankStatementBase64 = await fileToBase64(formData.bankStatement);

      // Prepare application data
      const applicationData = {
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        email: formData.email,
        mobile: formData.mobile,
        advanceAmount: payment.advanceAmount,
        repaymentPeriod: payment.repaymentPeriod,
        totalRepayable: payment.totalRepayable,
        monthlyInstallment: payment.monthlyInstallment,
        itemDescription: itemDescription,
        idDocument: {
          filename: formData.idDocument.name,
          contentType: formData.idDocument.type,
          base64: idDocumentBase64
        },
        bankStatement: {
          filename: formData.bankStatement.name,
          contentType: formData.bankStatement.type,
          base64: bankStatementBase64
        }
      };

      // Send to Make.com
      const result = await sendBNPLApplication(applicationData);

      if (result.success) {
        alert('Application submitted successfully! We will contact you shortly.');
        onClose();
      } else {
        alert('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting BNPL application:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-green to-green-dark text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {step === 1 ? 'Configure Your Advance' : 'Your Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Advance Amount Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600">Medical Advance Amount</label>
                    <span className="text-3xl font-bold text-gray-800">R {advanceAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={MIN_ADVANCE}
                    max={MAX_ADVANCE}
                    step="100"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-green"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>R {MIN_ADVANCE}</span>
                    <span>R {MAX_ADVANCE.toLocaleString()}</span>
                  </div>
                </div>

                {/* Repayment Term */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">Repayment Term</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((months) => (
                      <button
                        key={months}
                        onClick={() => setRepaymentTerm(months)}
                        className={`py-3 rounded-lg font-semibold transition-all ${
                          repaymentTerm === months
                            ? 'bg-primary-green text-white'
                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-green'
                        }`}
                      >
                        {months} Month{months > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Overview */}
                <div className="bg-gradient-to-br from-primary-green to-green-dark text-white rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <FaCalendar />
                    <span>Payment Overview</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/80">Advance Amount</span>
                      <span className="font-semibold">R {payment.advanceAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Repayment Period</span>
                      <span className="font-semibold">{payment.repaymentPeriod} Month{payment.repaymentPeriod > 1 ? 's' : ''}</span>
                    </div>
                    <div className="border-t border-white/30 pt-3">
                      <div className="flex justify-between text-lg">
                        <span className="text-white/80">Total Repayable</span>
                        <span className="font-bold">R {payment.totalRepayable.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="bg-primary-gold rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Monthly Installment</span>
                        <span className="text-2xl font-bold text-white">R {payment.monthlyInstallment.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <p className="text-gray-600 text-sm">Complete your application</p>

                {/* Service and Total */}
                <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Services</p>
                    <p className="font-semibold text-gray-800">{itemDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Repayable</p>
                    <p className="text-xl font-bold text-gray-800">R {payment.totalRepayable.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* ID Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
                    <div className="relative">
                      <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Enter your ID number"
                        value={formData.idNumber}
                        onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="+27 XX XXX XXXX"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* ID Document Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attach ID Document *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-gold transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="idDocument"
                        onChange={(e) => handleFileChange(e, 'idDocument')}
                        className="hidden"
                        accept="image/*,.pdf"
                      />
                      <label htmlFor="idDocument" className="cursor-pointer">
                        <FaFileUpload className="mx-auto text-3xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.idDocument ? formData.idDocument.name : 'Upload ID Document'}
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Bank Statement Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attach Bank Statement *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-gold transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="bankStatement"
                        onChange={(e) => handleFileChange(e, 'bankStatement')}
                        className="hidden"
                        accept="image/*,.pdf"
                      />
                      <label htmlFor="bankStatement" className="cursor-pointer">
                        <FaFileUpload className="mx-auto text-3xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.bankStatement ? formData.bankStatement.name : 'Upload Bank Statement'}
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-lg border-2 border-primary-green text-primary-green font-semibold hover:bg-primary-green hover:text-white transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => step === 1 ? setStep(2) : handleSubmit()}
            className="flex-1 py-3 rounded-lg bg-primary-green text-white font-semibold hover:bg-green-dark transition-colors"
          >
            {step === 1 ? 'Continue' : 'Submit Application'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BuyNowPayLaterModal;
