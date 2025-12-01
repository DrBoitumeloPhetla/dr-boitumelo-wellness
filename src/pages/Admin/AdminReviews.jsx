import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaCheck, FaTimes, FaEye, FaTrash, FaClock, FaPlus, FaUpload, FaImage, FaVideo } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { getAllReviews, getPendingReviews, updateReviewStatus, deleteReview, uploadReviewMedia, createReviewWithMedia } from '../../lib/supabase';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedReview, setSelectedReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Review Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    email: '',
    rating: 5,
    review_text: '',
    title: '',
    product_name: '',
    role: ''
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      let data;

      if (filter === 'pending') {
        data = await getPendingReviews();
      } else if (filter === 'all') {
        data = await getAllReviews();
      } else {
        // Filter by status
        const allData = await getAllReviews();
        data = allData.filter(r => r.status === filter);
      }

      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      setActionLoading(true);
      await updateReviewStatus(reviewId, 'approved', '', 'Admin');
      await loadReviews();
      setSelectedReview(null);
      alert('Review approved successfully!');
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Failed to approve review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reviewId) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      setActionLoading(true);
      await updateReviewStatus(reviewId, 'rejected', reason || 'Did not meet guidelines', 'Admin');
      await loadReviews();
      setSelectedReview(null);
      alert('Review rejected');
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Failed to reject review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review permanently?')) return;

    try {
      setActionLoading(true);
      await deleteReview(reviewId);
      await loadReviews();
      setSelectedReview(null);
      alert('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setMediaFile(file);
    setMediaType(isImage ? 'image' : 'video');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!newReview.name) {
      alert('Please provide at least a customer name');
      return;
    }

    try {
      setUploading(true);

      let mediaUrl = null;
      let reviewMediaType = null;

      // Upload media if provided
      if (mediaFile) {
        mediaUrl = await uploadReviewMedia(mediaFile);
        reviewMediaType = mediaType;
      }

      // Create review
      await createReviewWithMedia({
        ...newReview,
        email: newReview.email || 'noreply@drboitumelowellness.co.za',
        media_url: mediaUrl,
        media_type: reviewMediaType
      });

      alert('Review added successfully!');
      setShowAddModal(false);
      resetForm();
      await loadReviews();
    } catch (error) {
      console.error('Error creating review:', error);
      alert('Failed to create review. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setNewReview({
      name: '',
      email: '',
      rating: 5,
      review_text: '',
      title: '',
      product_name: '',
      role: ''
    });
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const filteredReviews = reviews;
  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Review Management</h1>
            <p className="text-gray-600 mt-1">
              Approve or reject customer reviews
              {pendingCount > 0 && (
                <span className="ml-2 text-yellow-600 font-semibold">
                  ({pendingCount} pending)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-dark transition-colors shadow-md hover:shadow-lg"
          >
            <FaPlus />
            <span className="font-semibold">Add Review</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {['all', 'pending', 'approved', 'rejected'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === filterOption
                    ? 'bg-primary-green text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                {filterOption === 'pending' && pendingCount > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FaClock className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No reviews found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{review.name}</h3>
                      {getStatusBadge(review.status)}
                    </div>
                    <p className="text-sm text-gray-500">{review.email}</p>
                    {review.role && (
                      <p className="text-sm text-gray-600 mt-1">{review.role}</p>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-lg ${
                          i < review.rating ? 'text-gold' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                {review.title && (
                  <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                )}

                {/* Review Text */}
                <p className="text-gray-700 mb-4">{review.review_text}</p>

                {/* Media Display */}
                {review.media_url && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Attached Media:</p>
                    {review.media_type === 'image' ? (
                      <img
                        src={review.media_url}
                        alt="Review media"
                        className="w-full max-w-md h-auto rounded-lg shadow-md"
                      />
                    ) : review.media_type === 'video' ? (
                      <video
                        src={review.media_url}
                        controls
                        className="w-full max-w-md h-auto rounded-lg shadow-md"
                      />
                    ) : null}
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  {review.product_name && (
                    <div>
                      <span className="text-gray-500">Product:</span>
                      <p className="font-medium text-gray-900">{review.product_name}</p>
                    </div>
                  )}
                  {review.condition && (
                    <div>
                      <span className="text-gray-500">Condition:</span>
                      <p className="font-medium text-gray-900">{review.condition}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Submitted:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {review.reviewed_at && (
                    <div>
                      <span className="text-gray-500">Reviewed:</span>
                      <p className="font-medium text-gray-900">
                        {new Date(review.reviewed_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Admin Notes */}
                {review.admin_notes && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Admin Notes:</p>
                    <p className="text-sm text-gray-700">{review.admin_notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                  {review.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(review.id)}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <FaCheck />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <FaTimes />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {review.status === 'rejected' && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <FaCheck />
                      <span>Approve</span>
                    </button>
                  )}

                  {review.status === 'approved' && (
                    <button
                      onClick={() => handleReject(review.id)}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                      <FaTimes />
                      <span>Un-approve</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={actionLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 ml-auto"
                  >
                    <FaTrash />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Review Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="bg-primary-green text-white p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Add New Review</h2>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="text-white hover:text-gray-200 text-2xl"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <p className="text-white/90 text-sm mt-2">
                    Upload a video or image testimonial with optional text review
                  </p>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmitReview} className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={newReview.name}
                        onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        placeholder="Anonymous Customer"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={newReview.email}
                        onChange={(e) => setNewReview({ ...newReview, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        placeholder="customer@email.com"
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="text-3xl focus:outline-none"
                        >
                          <FaStar
                            className={star <= newReview.rating ? 'text-gold' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                      <span className="ml-4 text-gray-600 font-medium">
                        {newReview.rating} {newReview.rating === 1 ? 'star' : 'stars'}
                      </span>
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Product/Service (Optional)
                      </label>
                      <input
                        type="text"
                        value={newReview.product_name}
                        onChange={(e) => setNewReview({ ...newReview, product_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        placeholder="Product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Role/Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={newReview.role}
                        onChange={(e) => setNewReview({ ...newReview, role: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        placeholder="Customer, Verified Buyer, etc."
                      />
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Review Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={newReview.title}
                      onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      placeholder="Great product!"
                    />
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Review Text (Optional)
                    </label>
                    <textarea
                      value={newReview.review_text}
                      onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      rows="4"
                      placeholder="Share the customer's experience..."
                    />
                  </div>

                  {/* Media Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Media (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-green transition-colors">
                      <input
                        type="file"
                        id="media-upload"
                        accept="image/*,video/*"
                        onChange={handleMediaSelect}
                        className="hidden"
                      />
                      <label htmlFor="media-upload" className="cursor-pointer">
                        <FaUpload className="text-4xl text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium mb-1">
                          Click to upload image or video
                        </p>
                        <p className="text-sm text-gray-500">
                          Max file size: 50MB
                        </p>
                      </label>
                    </div>

                    {/* Media Preview */}
                    {mediaPreview && (
                      <div className="mt-4 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setMediaFile(null);
                            setMediaPreview(null);
                            setMediaType(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 z-10"
                        >
                          <FaTimes />
                        </button>
                        {mediaType === 'image' ? (
                          <img
                            src={mediaPreview}
                            alt="Preview"
                            className="w-full max-w-md mx-auto h-auto rounded-lg shadow-md"
                          />
                        ) : (
                          <video
                            src={mediaPreview}
                            controls
                            className="w-full max-w-md mx-auto h-auto rounded-lg shadow-md"
                          />
                        )}
                        <p className="text-center text-sm text-gray-600 mt-2">
                          {mediaType === 'image' ? <FaImage className="inline mr-1" /> : <FaVideo className="inline mr-1" />}
                          {mediaFile?.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-6 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <FaCheck />
                          <span>Add Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
