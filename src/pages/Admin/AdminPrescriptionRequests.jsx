import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaPrescriptionBottle, FaEnvelope, FaPhone, FaCalendar, FaCopy, FaFilePdf, FaFileImage, FaExternalLinkAlt, FaTrash, FaEyeSlash } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { useAdmin } from '../../context/AdminContext';
import {
  getAllPrescriptionRequests,
  approvePrescriptionRequest,
  denyPrescriptionRequest,
  deletePrescriptionRequest
} from '../../lib/supabase';

// Inner component that uses AdminContext
const AdminPrescriptionRequestsContent = () => {
  const { canPerform, isStaffUser, log } = useAdmin();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, denied
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [denialReason, setDenialReason] = useState('');
  const [showDenialModal, setShowDenialModal] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);

  // Track which requests have already had webhooks sent to prevent duplicates
  const webhooksSentRef = useRef(new Set());

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllPrescriptionRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading prescription requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    // Check permission
    if (!canPerform('approve_prescription')) {
      alert('You do not have permission to approve prescriptions. Only super admins can approve prescription requests.');
      return;
    }

    if (!confirm(`Approve prescription request for ${request.customer_name}?`)) return;

    // Prevent duplicate webhook triggers
    const webhookKey = `approve-${request.id}`;
    if (webhooksSentRef.current.has(webhookKey)) {
      console.log('⚠️ Webhook already sent for this approval, skipping duplicate');
      return;
    }

    // Mark as processing
    if (processingRequest === request.id) {
      console.log('⚠️ Already processing this request, skipping duplicate');
      return;
    }

    try {
      setProcessingRequest(request.id);

      await approvePrescriptionRequest(request.id, 'Dr. Boitumelo Phetla');

      // Log activity
      await log({
        actionType: 'approve',
        resourceType: 'prescription',
        resourceId: request.id,
        resourceName: `${request.customer_name} - ${request.products?.name}`,
        details: {
          customerEmail: request.customer_email,
          productName: request.products?.name,
          uniqueCode: request.unique_code
        }
      });

      // Send approval email with purchase link via Make.com
      const webhookUrl = import.meta.env.VITE_MAKE_PRESCRIPTION_WEBHOOK || 'https://hook.eu2.make.com/v2qde71mrmnfm17fgvkp5dwivlg5oyyy';
      const purchaseLink = `${window.location.origin}/prescription-purchase/${request.unique_code}`;
      const expiryDate = new Date(request.expires_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (webhookUrl) {
        try {
          // Mark webhook as sent BEFORE making the request
          webhooksSentRef.current.add(webhookKey);

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'prescription_approved',
              customerName: request.customer_name,
              customerEmail: request.customer_email,
              productName: request.products?.name,
              productPrice: request.products?.price,
              uniqueCode: request.unique_code,
              purchaseLink: purchaseLink,
              expiryDate: expiryDate,
              dosageInstructions: 'Take as directed by Dr. Boitumelo. Do not exceed recommended dosage.',
              timestamp: new Date().toISOString()
            })
          });
          console.log('✅ Prescription approval webhook triggered successfully');
        } catch (webhookError) {
          console.error('Warning: Failed to trigger approval webhook:', webhookError);
          // Remove from sent set if webhook failed, so it can be retried
          webhooksSentRef.current.delete(webhookKey);
        }
      }

      alert('Prescription request approved! Customer will receive an email with purchase link.');
      loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
      // Remove from sent set if approval failed
      webhooksSentRef.current.delete(webhookKey);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeny = async () => {
    // Check permission
    if (!canPerform('reject_prescription')) {
      alert('You do not have permission to reject prescriptions. Only super admins can reject prescription requests.');
      setShowDenialModal(false);
      return;
    }

    if (!denialReason.trim()) {
      alert('Please provide a reason for denial');
      return;
    }

    // Prevent duplicate webhook triggers
    const webhookKey = `deny-${selectedRequest.id}`;
    if (webhooksSentRef.current.has(webhookKey)) {
      console.log('⚠️ Webhook already sent for this denial, skipping duplicate');
      return;
    }

    // Mark as processing
    if (processingRequest === selectedRequest.id) {
      console.log('⚠️ Already processing this request, skipping duplicate');
      return;
    }

    try {
      setProcessingRequest(selectedRequest.id);

      await denyPrescriptionRequest(selectedRequest.id, denialReason);

      // Log activity
      await log({
        actionType: 'reject',
        resourceType: 'prescription',
        resourceId: selectedRequest.id,
        resourceName: `${selectedRequest.customer_name} - ${selectedRequest.products?.name}`,
        details: {
          customerEmail: selectedRequest.customer_email,
          productName: selectedRequest.products?.name,
          denialReason: denialReason
        }
      });

      // Send denial email via Make.com
      const webhookUrl = import.meta.env.VITE_MAKE_PRESCRIPTION_WEBHOOK || 'https://hook.eu2.make.com/v2qde71mrmnfm17fgvkp5dwivlg5oyyy';
      if (webhookUrl) {
        try {
          // Mark webhook as sent BEFORE making the request
          webhooksSentRef.current.add(webhookKey);

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'prescription_denied',
              customerName: selectedRequest.customer_name,
              customerEmail: selectedRequest.customer_email,
              productName: selectedRequest.products?.name,
              doctorNotes: denialReason,
              denialReason: denialReason, // Keeping both for backward compatibility
              timestamp: new Date().toISOString()
            })
          });
          console.log('✅ Prescription denial webhook triggered successfully');
        } catch (webhookError) {
          console.error('Warning: Failed to trigger denial webhook:', webhookError);
          // Remove from sent set if webhook failed, so it can be retried
          webhooksSentRef.current.delete(webhookKey);
        }
      }

      alert('Prescription request denied. Customer will receive an email.');
      setShowDenialModal(false);
      setDenialReason('');
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error('Error denying request:', error);
      alert('Failed to deny request');
      // Remove from sent set if denial failed
      webhooksSentRef.current.delete(webhookKey);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDelete = async (request) => {
    // Check permission
    if (!canPerform('delete_prescription')) {
      alert('You do not have permission to delete prescriptions. Only super admins can delete prescription requests.');
      return;
    }

    if (!confirm(`Are you sure you want to delete the prescription request from ${request.customer_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePrescriptionRequest(request.id);

      // Log activity
      await log({
        actionType: 'delete',
        resourceType: 'prescription',
        resourceId: request.id,
        resourceName: `${request.customer_name} - ${request.products?.name}`,
        details: {
          customerEmail: request.customer_email,
          productName: request.products?.name,
          status: request.status
        }
      });

      alert('Prescription request deleted successfully');
      loadRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      denied: 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Prescription Requests</h1>
          <p className="text-gray-600 mt-1">Manage customer requests for prescription-required products</p>
        </div>
          {isStaffUser() && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg border border-blue-300">
              <FaEyeSlash />
              <span className="font-semibold text-sm">View Only Mode</span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 bg-white p-2 rounded-lg shadow">
          {['all', 'pending', 'approved', 'denied'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f} ({requests.filter(r => f === 'all' || r.status === f).length})
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
              <p className="mt-4 text-gray-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FaPrescriptionBottle className="text-5xl mx-auto mb-4 text-gray-300" />
              <p>No {filter !== 'all' && filter} prescription requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {request.products?.image_url && (
                            <img
                              src={request.products.image_url}
                              alt={request.products?.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{request.products?.name || 'Unknown Product'}</div>
                            <div className="text-sm text-gray-500">R{request.products?.price}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{request.customer_name}</div>
                          <div className="text-gray-500 flex items-center gap-1">
                            <FaEnvelope className="text-xs" />
                            {request.customer_email}
                          </div>
                          {request.customer_phone && (
                            <div className="text-gray-500 flex items-center gap-1">
                              <FaPhone className="text-xs" />
                              {request.customer_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-xs">
                          {request.health_info || <span className="text-gray-400 italic">No information provided</span>}
                        </div>
                        {request.blood_test_file_url && (() => {
                          try {
                            const fileUrls = JSON.parse(request.blood_test_file_url);
                            if (fileUrls && fileUrls.length > 0) {
                              return (
                                <div className="mt-2 space-y-1">
                                  <div className="text-xs font-semibold text-gray-600">Uploaded Documents:</div>
                                  {fileUrls.map((url, idx) => {
                                    const isPdf = url.toLowerCase().endsWith('.pdf');
                                    return (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                                      >
                                        {isPdf ? <FaFilePdf /> : <FaFileImage />}
                                        <span>Document {idx + 1}</span>
                                        <FaExternalLinkAlt className="text-xs" />
                                      </a>
                                    );
                                  })}
                                </div>
                              );
                            }
                          } catch (e) {
                            // If JSON parsing fails or it's a single URL string
                            return (
                              <div className="mt-2">
                                <a
                                  href={request.blood_test_file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  <FaFileImage />
                                  <span>View Document</span>
                                  <FaExternalLinkAlt className="text-xs" />
                                </a>
                              </div>
                            );
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                        {request.status === 'approved' && request.used_at && (
                          <div className="text-xs text-gray-500 mt-1">Used</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(request.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {request.status === 'pending' ? (
                          canPerform('approve_prescription') ? (
                            <div className="flex flex-col space-y-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApprove(request)}
                                  disabled={processingRequest === request.id}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FaCheck />
                                  <span>{processingRequest === request.id ? 'Processing...' : 'Approve'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowDenialModal(true);
                                  }}
                                  disabled={processingRequest === request.id}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FaTimes />
                                  <span>Deny</span>
                                </button>
                              </div>
                              <button
                                onClick={() => handleDelete(request)}
                                disabled={processingRequest === request.id}
                                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center space-x-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FaTrash />
                                <span>Delete</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic flex items-center space-x-1">
                              <FaEyeSlash className="text-xs" />
                              <span>View Only</span>
                            </div>
                          )
                        ) : request.status === 'approved' ? (
                          <div className="space-y-1">
                            <button
                              onClick={() => copyToClipboard(`${window.location.origin}/prescription-purchase/${request.unique_code}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1 text-xs"
                            >
                              <FaCopy />
                              <span>Copy Link</span>
                            </button>
                            {request.expires_at && (
                              <div className="text-xs text-gray-500">
                                Expires: {new Date(request.expires_at).toLocaleDateString()}
                              </div>
                            )}
                            {canPerform('delete_prescription') && (
                              <button
                                onClick={() => handleDelete(request)}
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
                              {request.denial_reason && (
                                <div className="max-w-xs">
                                  <strong>Reason:</strong> {request.denial_reason}
                                </div>
                              )}
                            </div>
                            {canPerform('delete_prescription') && (
                              <button
                                onClick={() => handleDelete(request)}
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

        {/* Denial Modal */}
        {showDenialModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Deny Prescription Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for denying {selectedRequest?.customer_name}'s request:
            </p>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="E.g., Blood work results needed, consultation required, contraindications found..."
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowDenialModal(false);
                  setDenialReason('');
                  setSelectedRequest(null);
                }}
                disabled={processingRequest === selectedRequest?.id}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeny}
                disabled={processingRequest === selectedRequest?.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingRequest === selectedRequest?.id ? 'Processing...' : 'Deny Request'}
              </button>
            </div>
          </motion.div>
        </div>
        )}
      </div>
    );
  };

// Wrapper component
const AdminPrescriptionRequests = () => {
  return (
    <AdminLayout>
      <AdminPrescriptionRequestsContent />
    </AdminLayout>
  );
};

export default AdminPrescriptionRequests;
