import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPrescriptionBottle, FaCheckCircle, FaUpload, FaFilePdf, FaFileImage } from 'react-icons/fa';
import { createPrescriptionRequest, supabase } from '../../lib/supabase';

const PrescriptionRequestModal = ({ isOpen, onClose, product }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    healthInfo: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'application/pdf'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('Some files were rejected. Please upload only images (JPG, PNG, HEIC) or PDFs under 10MB.');
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return [];

    setUploadingFiles(true);
    const urls = [];

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
          .from('prescription-documents')
          .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('prescription-documents')
          .getPublicUrl(filePath);

        urls.push(urlData.publicUrl);
      }

      setUploadedFileUrls(urls);
      return urls;
    } catch (err) {
      console.error('Error uploading files:', err);
      throw new Error('Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Upload files if any
      let fileUrls = [];
      if (selectedFiles.length > 0) {
        try {
          fileUrls = await uploadFiles();
        } catch (uploadError) {
          setError('Failed to upload files. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // Create prescription request with discount info
      const requestData = {
        productId: product.id,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        healthInfo: formData.healthInfo,
        bloodTestFileUrl: fileUrls.length > 0 ? JSON.stringify(fileUrls) : null,
        // Include discount info if available
        originalPrice: product.discountedPrice ? product.originalPrice : parseFloat(product.price),
        discountedPrice: product.discountedPrice || null,
        discountType: product.discount?.discount_type || null,
        discountValue: product.discount?.discount_value || null,
        discountName: product.discount?.name || null
      };

      const result = await createPrescriptionRequest(requestData);

      // Success - show success screen
      setUniqueCode(result.unique_code);
      setIsSuccess(true);

      // Send notification email to doctor (via Make.com webhook)
      const webhookUrl = import.meta.env.VITE_MAKE_PRESCRIPTION_WEBHOOK || 'https://hook.eu2.make.com/v2qde71mrmnfm17fgvkp5dwivlg5oyyy';
      if (webhookUrl) {
        try {
          // Determine price to show
          const displayPrice = product.discountedPrice || parseFloat(product.price);
          const hasDiscount = !!product.discountedPrice;

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'prescription_request',
              productName: product.name,
              productPrice: displayPrice,
              originalPrice: hasDiscount ? product.originalPrice : null,
              hasDiscount: hasDiscount,
              discountType: product.discount?.discount_type || null,
              discountValue: product.discount?.discount_value || null,
              discountName: product.discount?.name || null,
              customerName: formData.customerName,
              customerEmail: formData.customerEmail,
              customerPhone: formData.customerPhone,
              healthInfo: formData.healthInfo,
              documentUrls: fileUrls,
              hasDocuments: fileUrls.length > 0,
              requestId: result.id,
              uniqueCode: result.unique_code,
              timestamp: new Date().toISOString()
            })
          });
          console.log('✅ Prescription webhook triggered successfully');
        } catch (webhookError) {
          console.error('Warning: Failed to trigger prescription webhook:', webhookError);
          // Don't throw - prescription request was still created successfully
        }
      } else {
        console.warn('Warning: VITE_MAKE_PRESCRIPTION_WEBHOOK not configured');
      }

    } catch (err) {
      console.error('Error submitting prescription request:', err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      healthInfo: ''
    });
    setSelectedFiles([]);
    setUploadedFileUrls([]);
    setIsSuccess(false);
    setUniqueCode('');
    setError('');
    onClose();
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
                <FaPrescriptionBottle className="text-3xl" />
                <div>
                  <h2 className="text-2xl font-montserrat font-bold">
                    {isSuccess ? 'Request Submitted' : 'Prescription Required'}
                  </h2>
                  <p className="text-sm text-white/90 mt-1">
                    {isSuccess ? 'Awaiting doctor approval' : product.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {!isSuccess ? (
                <>
                  {/* Warning Notice */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <p className="text-sm text-gray-700">
                      <strong className="text-yellow-700">Medical Approval Required:</strong> This product contains high-dose Vitamin D3 (50,000 IU) and requires Dr. Boitumelo's approval before purchase. Please complete the form below.
                    </p>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-6">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      {product.discountedPrice ? (
                        <div className="flex items-center gap-2">
                          <p className="text-gray-400 text-sm line-through">R{product.originalPrice}</p>
                          <p className="text-red-600 font-bold text-sm">R{product.discountedPrice.toFixed(2)}</p>
                          {product.discount && (
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">
                              {product.discount.discount_type === 'percentage'
                                ? `${product.discount.discount_value}% OFF`
                                : `R${product.discount.discount_value} OFF`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm">Price: R{product.price}</p>
                      )}
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="customerEmail"
                        value={formData.customerEmail}
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
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Health Information
                      </label>
                      <textarea
                        name="healthInfo"
                        value={formData.healthInfo}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        placeholder="Please provide any relevant health information, recent blood test results, or reasons for requesting this product..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional: Any information that may help Dr. Boitumelo evaluate your request
                      </p>
                    </div>

                    {/* File Upload Section */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Upload Documents (Optional)
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        Upload blood test results, medical records, or prescription documents (JPG, PNG, HEIC, PDF - Max 10MB each)
                      </p>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-green transition-colors">
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,application/pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <FaUpload className="text-3xl text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 font-medium">Click to upload documents</span>
                          <span className="text-xs text-gray-500 mt-1">or drag and drop</span>
                        </label>
                      </div>

                      {/* Selected Files List */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                              <div className="flex items-center space-x-2">
                                {file.type === 'application/pdf' ? (
                                  <FaFilePdf className="text-red-500" />
                                ) : (
                                  <FaFileImage className="text-blue-500" />
                                )}
                                <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                                <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || uploadingFiles}
                        className="flex-1 px-6 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingFiles ? 'Uploading files...' : isSubmitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  {/* Success Screen */}
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                      <FaCheckCircle className="text-5xl text-green-600" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      Request Submitted Successfully!
                    </h3>

                    <p className="text-gray-600 mb-6">
                      Your prescription request has been sent to Dr. Boitumelo for review.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">What happens next?</h4>
                      <ul className="text-left space-y-2 text-sm text-gray-700">
                        <li className="flex items-start">
                          <span className="text-primary-green mr-2">✓</span>
                          <span>Dr. Boitumelo will review your request within 24-48 hours</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-green mr-2">✓</span>
                          <span>You'll receive an email with her decision</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-green mr-2">✓</span>
                          <span>If approved, you'll get a unique purchase link valid for 7 days</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-green mr-2">✓</span>
                          <span>The link can only be used once for your safety</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-xs text-gray-500 mb-1">Your Reference Code</p>
                      <p className="font-mono text-sm font-semibold text-gray-800">{uniqueCode}</p>
                    </div>

                    <button
                      onClick={handleClose}
                      className="px-8 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors"
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

export default PrescriptionRequestModal;
