import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaStar, FaCheckCircle, FaImage, FaVideo } from 'react-icons/fa';
import { submitReview, uploadReviewMedia } from '../../lib/supabase';

const ReviewModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation
  const [reviewData, setReviewData] = useState({
    name: '',
    email: '',
    rating: 0,
    condition: '',
    testimonial: '',
    allowPublish: true,
  });

  const [hoveredRating, setHoveredRating] = useState(0);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReviewData({
      ...reviewData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleRatingClick = (rating) => {
    setReviewData({ ...reviewData, rating });
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please upload an image or video file');
      return;
    }

    // Check file size (max 50MB for videos, 5MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large. Max size: ${isVideo ? '50MB' : '5MB'}`);
      return;
    }

    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMediaUpload = async () => {
    if (!mediaFile) return null;

    try {
      const uploadedUrl = await uploadReviewMedia(mediaFile);
      console.log('Media uploaded successfully:', uploadedUrl);
      return uploadedUrl;
    } catch (error) {
      console.error('Failed to upload media:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setUploading(true);
    try {
      // Create a copy of reviewData to modify
      let dataToSubmit = {
        name: reviewData.name,
        email: reviewData.email,
        rating: reviewData.rating,
        condition: reviewData.condition || null,
        review_text: reviewData.testimonial || null,
        media_type: null,
        media_url: null
      };

      // Upload media first if there's a file
      if (mediaFile) {
        const uploadedUrl = await handleMediaUpload();
        if (!uploadedUrl) {
          alert('Failed to upload media. Please try again.');
          setUploading(false);
          return;
        }
        // Update the data to submit with the uploaded media URL
        dataToSubmit.media_type = mediaType;
        dataToSubmit.media_url = uploadedUrl;
      }

      // Submit the review
      await submitReview(dataToSubmit);
      console.log('Review submitted successfully');
      setStep(2);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setReviewData({
      name: '',
      email: '',
      rating: 0,
      condition: '',
      testimonial: '',
      allowPublish: true,
    });
    setMediaFile(null);
    setMediaPreview('');
    setMediaType(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-green to-green-dark text-white p-6 rounded-t-2xl flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-montserrat font-bold">Share Your Experience</h2>
              <p className="text-sm text-white/80 mt-1">We'd love to hear from you</p>
            </div>
            <button
              onClick={resetAndClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Review Form */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block font-medium text-dark-text mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={reviewData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-dark-text mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={reviewData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="john@example.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Your email will not be published
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block font-medium text-dark-text mb-3">
                      Your Rating *
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingClick(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <FaStar
                            className={`text-4xl ${
                              star <= (hoveredRating || reviewData.rating)
                                ? 'text-gold'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      {reviewData.rating > 0 && (
                        <span className="ml-3 text-gray-600">
                          {reviewData.rating} {reviewData.rating === 1 ? 'star' : 'stars'}
                        </span>
                      )}
                    </div>
                    {reviewData.rating === 0 && (
                      <p className="text-sm text-red-500 mt-2">Please select a rating</p>
                    )}
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block font-medium text-dark-text mb-2">
                      What brought you to Dr. Boitumelo? (Optional)
                    </label>
                    <input
                      type="text"
                      name="condition"
                      value={reviewData.condition}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                      placeholder="e.g., Chronic Fatigue, Gut Health, Wellness Coaching"
                    />
                  </div>

                  {/* Testimonial */}
                  <div>
                    <label className="block font-medium text-dark-text mb-2">
                      Your Review
                    </label>
                    <textarea
                      name="testimonial"
                      value={reviewData.testimonial}
                      onChange={handleInputChange}
                      rows="6"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none resize-none"
                      placeholder="Share your experience with Dr. Boitumelo's services, products, or wellness programs... (Optional)"
                    />
                  </div>

                  {/* Media Upload (Image or Video) */}
                  <div>
                    <label className="block font-medium text-dark-text mb-2">
                      Add Photo or Video (Optional)
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-green transition-colors bg-gray-50 hover:bg-sage/20">
                            <FaImage className="text-primary-green text-xl" />
                            <FaVideo className="text-primary-green text-xl" />
                            <span className="text-gray-600">
                              {mediaFile ? 'Change Media' : 'Choose Image or Video'}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleMediaChange}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {mediaPreview && (
                        <div className="relative">
                          {mediaType === 'image' ? (
                            <img
                              src={mediaPreview}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ) : (
                            <video
                              src={mediaPreview}
                              controls
                              className="w-full h-48 rounded-lg"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setMediaFile(null);
                              setMediaPreview('');
                              setMediaType(null);
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Upload a photo of your supplements or record a video testimonial.
                        <br />
                        Max size: 5MB for images, 50MB for videos
                      </p>
                    </div>
                  </div>

                  {/* Consent */}
                  <div className="bg-sage/30 p-4 rounded-xl">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="allowPublish"
                        checked={reviewData.allowPublish}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-primary-green focus:ring-primary-green rounded mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to allow Dr. Boitumelo Wellness to publish this review on their
                        website and marketing materials. I understand that my email address will
                        not be shared publicly.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end pt-4">
                    <button
                      type="button"
                      onClick={resetAndClose}
                      disabled={uploading}
                      className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mr-3 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reviewData.rating === 0 || uploading}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 2: Confirmation */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="mb-6">
                  <FaCheckCircle className="text-7xl text-green-500 mx-auto mb-4" />
                  <h3 className="text-3xl font-montserrat font-bold text-dark-text mb-2">
                    Thank You!
                  </h3>
                  <p className="text-gray-600">
                    Your review has been successfully submitted
                  </p>
                </div>

                <div className="bg-sage/30 p-6 rounded-xl max-w-md mx-auto text-left space-y-4 mb-6">
                  <h4 className="font-montserrat font-semibold text-lg mb-4">
                    What Happens Next?
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-primary-green mr-2">✓</span>
                      <span>Your review will be reviewed by our team</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-green mr-2">✓</span>
                      <span>You'll receive a confirmation email at <strong>{reviewData.email}</strong></span>
                    </li>
                    {reviewData.allowPublish && (
                      <li className="flex items-start">
                        <span className="text-primary-green mr-2">✓</span>
                        <span>Your review will be published on our website within 2-3 business days</span>
                      </li>
                    )}
                    <li className="flex items-start">
                      <span className="text-primary-green mr-2">✓</span>
                      <span>We truly appreciate your feedback!</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={resetAndClose}
                  className="btn-primary"
                >
                  Close
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;
