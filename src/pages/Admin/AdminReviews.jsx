import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaCheck, FaTimes, FaEye, FaTrash, FaClock } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { getAllReviews, getPendingReviews, updateReviewStatus, deleteReview } from '../../lib/supabase';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedReview, setSelectedReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
