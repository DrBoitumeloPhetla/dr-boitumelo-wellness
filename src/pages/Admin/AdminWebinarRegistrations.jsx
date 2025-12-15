import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaUserMd, FaEnvelope, FaPhone, FaCalendar, FaCopy, FaTrash, FaEyeSlash, FaCreditCard, FaExternalLinkAlt } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { useAdmin } from '../../context/AdminContext';
import {
  getAllWebinarRegistrations,
  approveWebinarRegistration,
  rejectWebinarRegistration,
  deleteWebinarRegistration
} from '../../lib/supabase';

// Inner component that uses AdminContext
const AdminWebinarRegistrationsContent = () => {
  const { canPerform, isStaffUser, log } = useAdmin();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, paid, pending
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);

  // Track which registrations have already had webhooks sent
  const webhooksSentRef = useRef(new Set());

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getAllWebinarRegistrations();
      // Only show registrations that have been paid
      const paidRegistrations = (data || []).filter(reg => reg.payment_status === 'paid');
      setRegistrations(paidRegistrations);
    } catch (error) {
      console.error('Error loading webinar registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registration) => {
    if (!canPerform('approve_webinar')) {
      alert('You do not have permission to approve webinar registrations.');
      return;
    }

    // Check if payment is confirmed
    if (registration.payment_status !== 'paid') {
      alert('Cannot approve registration: Payment has not been confirmed yet.');
      return;
    }

    if (!confirm(`Approve webinar registration for ${registration.first_name} ${registration.last_name}?`)) return;

    const webhookKey = `approve-${registration.id}`;
    if (webhooksSentRef.current.has(webhookKey)) {
      console.log('Webhook already sent for this approval');
      return;
    }

    if (processingRequest === registration.id) return;

    try {
      setProcessingRequest(registration.id);

      const result = await approveWebinarRegistration(registration.id, 'Dr. Boitumelo Phetla');

      // Log activity
      await log({
        actionType: 'approve',
        resourceType: 'webinar_registration',
        resourceId: registration.id,
        resourceName: `${registration.first_name} ${registration.last_name} - ${registration.webinars?.title}`,
        details: {
          email: registration.email,
          hpcsaNumber: registration.hpcsa_number,
          webinarTitle: registration.webinars?.title
        }
      });

      // Send approval email via Make.com webhook
      const webhookUrl = import.meta.env.VITE_MAKE_WEBINAR_WEBHOOK;
      if (webhookUrl) {
        try {
          webhooksSentRef.current.add(webhookKey);

          const webinarDate = new Date(registration.webinars?.date);
          const formattedDate = webinarDate.toLocaleDateString('en-ZA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Get the Zoom meeting ID based on the month
          const monthIndex = webinarDate.getMonth(); // 0-indexed (0 = Jan, 1 = Feb, etc.)
          const zoomMeetingIds = {
            1: '875 1229 2271',  // February
            2: '874 6335 4981',  // March
            3: '851 4358 8043',  // April
            4: '852 5911 2001',  // May
            5: '834 6267 8868',  // June
            6: '891 5156 2265',  // July
            7: '828 3793 3483',  // August
            8: '885 1784 8895',  // September
            9: '821 2969 9822'   // October
          };
          const zoomMeetingId = zoomMeetingIds[monthIndex] || 'TBA';

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'webinar_approved',
              registrationId: registration.id,
              firstName: registration.first_name,
              lastName: registration.last_name,
              email: registration.email,
              phone: registration.phone,
              profession: registration.profession,
              hpcsaNumber: registration.hpcsa_number,
              webinarTitle: registration.webinars?.title,
              webinarDate: formattedDate,
              webinarTime: '6:00 PM - 6:30 PM SAST',
              zoomMeetingId: zoomMeetingId,
              zoomLink: `https://zoom.us/j/${zoomMeetingId.replace(/\s/g, '')}`,
              timestamp: new Date().toISOString()
            })
          });
          console.log('Webinar approval webhook triggered successfully');
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          webhooksSentRef.current.delete(webhookKey);
        }
      }

      alert('Registration approved! Attendee will receive an email with the Zoom link.');
      loadRegistrations();
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Failed to approve registration');
      webhooksSentRef.current.delete(webhookKey);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async () => {
    if (!canPerform('reject_webinar')) {
      alert('You do not have permission to reject webinar registrations.');
      setShowRejectionModal(false);
      return;
    }

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    const webhookKey = `reject-${selectedRegistration.id}`;
    if (webhooksSentRef.current.has(webhookKey)) return;
    if (processingRequest === selectedRegistration.id) return;

    try {
      setProcessingRequest(selectedRegistration.id);

      await rejectWebinarRegistration(selectedRegistration.id, rejectionReason);

      // Log activity
      await log({
        actionType: 'reject',
        resourceType: 'webinar_registration',
        resourceId: selectedRegistration.id,
        resourceName: `${selectedRegistration.first_name} ${selectedRegistration.last_name} - ${selectedRegistration.webinars?.title}`,
        details: {
          email: selectedRegistration.email,
          hpcsaNumber: selectedRegistration.hpcsa_number,
          rejectionReason: rejectionReason
        }
      });

      // Send rejection email via Make.com webhook
      const rejectionWebhookUrl = import.meta.env.VITE_MAKE_WEBINAR_REJECTION_WEBHOOK;
      try {
        webhooksSentRef.current.add(webhookKey);

        const webinarDate = new Date(selectedRegistration.webinars?.date);
        const formattedDate = webinarDate.toLocaleDateString('en-ZA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        await fetch(rejectionWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'webinar_rejected',
            registrationId: selectedRegistration.id,
            firstName: selectedRegistration.first_name,
            lastName: selectedRegistration.last_name,
            email: selectedRegistration.email,
            phone: selectedRegistration.phone,
            profession: selectedRegistration.profession,
            hpcsaNumber: selectedRegistration.hpcsa_number,
            webinarTitle: selectedRegistration.webinars?.title,
            webinarDate: formattedDate,
            webinarPrice: selectedRegistration.webinars?.price,
            rejectionReason: rejectionReason,
            timestamp: new Date().toISOString()
          })
        });
        console.log('Webinar rejection webhook triggered successfully');
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        webhooksSentRef.current.delete(webhookKey);
      }

      alert('Registration rejected. Attendee will be notified.');
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedRegistration(null);
      loadRegistrations();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Failed to reject registration');
      webhooksSentRef.current.delete(webhookKey);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDelete = async (registration) => {
    if (!canPerform('delete_webinar')) {
      alert('You do not have permission to delete webinar registrations.');
      return;
    }

    if (!confirm(`Delete registration for ${registration.first_name} ${registration.last_name}? This cannot be undone.`)) return;

    try {
      await deleteWebinarRegistration(registration.id);

      await log({
        actionType: 'delete',
        resourceType: 'webinar_registration',
        resourceId: registration.id,
        resourceName: `${registration.first_name} ${registration.last_name} - ${registration.webinars?.title}`,
        details: {
          email: registration.email,
          status: registration.status
        }
      });

      alert('Registration deleted successfully');
      loadRegistrations();
    } catch (error) {
      console.error('Error deleting registration:', error);
      alert('Failed to delete registration');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const filteredRegistrations = registrations.filter(reg => {
    const statusMatch = filter === 'all' || reg.status === filter;
    const paymentMatch = paymentFilter === 'all' || reg.payment_status === paymentFilter;
    return statusMatch && paymentMatch;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[status] || styles.pending;
  };

  const getPaymentBadge = (status) => {
    const styles = {
      pending: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || styles.pending;
  };

  // Stats
  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    paid: registrations.filter(r => r.payment_status === 'paid').length,
    revenue: registrations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + parseFloat(r.webinars?.price || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Webinar Registrations</h1>
          <p className="text-gray-600 mt-1">Manage Vitamin D Talks registrations</p>
        </div>
        {isStaffUser() && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg border border-blue-300">
            <FaEyeSlash />
            <span className="font-semibold text-sm">View Only Mode</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Registrations</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending Approval</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.paid}</div>
          <div className="text-sm text-gray-600">Paid</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-primary-green">R{stats.revenue.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex space-x-2 bg-white p-2 rounded-lg shadow">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex space-x-2 bg-white p-2 rounded-lg shadow">
          {['all', 'paid', 'pending'].map((f) => (
            <button
              key={f}
              onClick={() => setPaymentFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors flex items-center gap-2 ${
                paymentFilter === f
                  ? 'bg-gold text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCreditCard className="text-xs" />
              {f === 'all' ? 'All Payments' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
            <p className="mt-4 text-gray-600">Loading registrations...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FaUserMd className="text-5xl mx-auto mb-4 text-gray-300" />
            <p>No registrations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Webinar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HPCSA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{registration.webinars?.title || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">
                        {registration.webinars?.date && new Date(registration.webinars.date).toLocaleDateString('en-ZA')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {registration.first_name} {registration.last_name}
                        </div>
                        <div className="text-gray-500 flex items-center gap-1">
                          <FaEnvelope className="text-xs" />
                          {registration.email}
                        </div>
                        <div className="text-gray-500 flex items-center gap-1">
                          <FaPhone className="text-xs" />
                          {registration.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {registration.hpcsa_number}
                        </span>
                        <button
                          onClick={() => window.open(`https://www.hpcsa.co.za/verify?regno=${registration.hpcsa_number}`, '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                          title="Verify HPCSA"
                        >
                          <FaExternalLinkAlt className="text-xs" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPaymentBadge(registration.payment_status)}`}>
                        {registration.payment_status?.toUpperCase()}
                      </span>
                      {registration.payment_reference && (
                        <div className="text-xs text-gray-500 mt-1">{registration.payment_reference}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(registration.status)}`}>
                        {registration.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {new Date(registration.created_at).toLocaleDateString('en-ZA')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(registration.created_at).toLocaleTimeString('en-ZA')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {registration.status === 'pending' ? (
                        canPerform('approve_webinar') ? (
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(registration)}
                                disabled={processingRequest === registration.id || registration.payment_status !== 'paid'}
                                className={`px-3 py-1 rounded flex items-center space-x-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                  registration.payment_status === 'paid'
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-300 text-gray-500'
                                }`}
                                title={registration.payment_status !== 'paid' ? 'Payment required' : 'Approve'}
                              >
                                <FaCheck />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRegistration(registration);
                                  setShowRejectionModal(true);
                                }}
                                disabled={processingRequest === registration.id}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-1 text-sm disabled:opacity-50"
                              >
                                <FaTimes />
                                <span>Reject</span>
                              </button>
                            </div>
                            <button
                              onClick={() => handleDelete(registration)}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center space-x-1 text-xs"
                            >
                              <FaTrash />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">View Only</span>
                        )
                      ) : registration.status === 'approved' ? (
                        <div className="space-y-1">
                          <span className="text-sm text-green-600 font-semibold">Approved</span>
                          {canPerform('delete_webinar') && (
                            <button
                              onClick={() => handleDelete(registration)}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center space-x-1 text-xs"
                            >
                              <FaTrash />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500">
                            {registration.rejection_reason && (
                              <div className="max-w-xs">
                                <strong>Reason:</strong> {registration.rejection_reason}
                              </div>
                            )}
                          </div>
                          {canPerform('delete_webinar') && (
                            <button
                              onClick={() => handleDelete(registration)}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center space-x-1 text-xs"
                            >
                              <FaTrash />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reject Registration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting {selectedRegistration?.first_name} {selectedRegistration?.last_name}'s registration:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="E.g., Invalid HPCSA number, registration full, etc."
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setSelectedRegistration(null);
                }}
                disabled={processingRequest === selectedRegistration?.id}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingRequest === selectedRegistration?.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processingRequest === selectedRegistration?.id ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Wrapper component
const AdminWebinarRegistrations = () => {
  return (
    <AdminLayout>
      <AdminWebinarRegistrationsContent />
    </AdminLayout>
  );
};

export default AdminWebinarRegistrations;
