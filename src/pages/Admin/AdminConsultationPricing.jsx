import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoneyBillWave, FaEdit, FaSave, FaTimes, FaVideo, FaPhone, FaUserMd, FaUsers, FaUser } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { useAdmin } from '../../context/AdminContext';
import { getAllConsultationPricing, updateConsultationPrice } from '../../lib/supabase';

// Inner component that uses AdminContext
const AdminConsultationPricingContent = () => {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', duration: '' });
  const [saving, setSaving] = useState(false);
  const { log } = useAdmin();

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const data = await getAllConsultationPricing();
      setPricing(data);
    } catch (error) {
      console.error('Error loading pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'virtual': 'Virtual Consultation',
      'telephonic_new': 'Telephonic (New Patient)',
      'telephonic_existing': 'Telephonic (Existing Patient)',
      'face_to_face': 'Face-to-Face Consultation'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    if (type === 'virtual') return <FaVideo className="text-green-600" />;
    if (type.startsWith('telephonic')) return <FaPhone className="text-blue-600" />;
    if (type === 'face_to_face') return <FaUserMd className="text-purple-600" />;
    return null;
  };

  const getSessionIcon = (sessionType) => {
    return sessionType === 'couples'
      ? <FaUsers className="text-pink-500" />
      : <FaUser className="text-gray-500" />;
  };

  const getTypeColor = (type) => {
    if (type === 'virtual') return 'bg-green-50 border-green-200';
    if (type.startsWith('telephonic')) return 'bg-blue-50 border-blue-200';
    if (type === 'face_to_face') return 'bg-purple-50 border-purple-200';
    return 'bg-gray-50 border-gray-200';
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ price: item.price, duration: item.duration });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ price: '', duration: '' });
  };

  const handleSave = async (item) => {
    setSaving(true);
    try {
      await updateConsultationPrice(item.id, {
        price: parseInt(editForm.price),
        duration: editForm.duration
      });

      await log({
        actionType: 'update',
        resourceType: 'consultation_pricing',
        resourceId: item.id,
        resourceName: `${getTypeLabel(item.consultation_type)} (${item.session_type})`,
        details: {
          old_price: item.price,
          new_price: parseInt(editForm.price),
          old_duration: item.duration,
          new_duration: editForm.duration
        }
      });

      setEditingId(null);
      await loadPricing();
    } catch (error) {
      console.error('Error saving price:', error);
      alert('Failed to update price. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Group pricing by consultation type
  const grouped = pricing.reduce((acc, item) => {
    const group = item.consultation_type.startsWith('telephonic') ? 'telephonic' : item.consultation_type;
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const groupOrder = ['virtual', 'telephonic', 'face_to_face'];
  const groupLabels = {
    'virtual': 'Virtual Consultation',
    'telephonic': 'Telephonic Consultation',
    'face_to_face': 'Face-to-Face Consultation'
  };

  return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <FaMoneyBillWave className="text-3xl text-primary-green" />
            <h1 className="text-3xl font-montserrat font-bold text-gray-800">Consultation Pricing</h1>
          </div>
          <p className="text-gray-600">Manage consultation prices and session durations. Changes take effect immediately on the booking page.</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-green"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupOrder.map((groupKey) => {
              const items = grouped[groupKey];
              if (!items || items.length === 0) return null;

              return (
                <motion.div
                  key={groupKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="bg-gradient-to-r from-primary-green to-green-dark px-6 py-4 flex items-center space-x-3">
                    <span className="text-white text-xl">
                      {groupKey === 'virtual' && <FaVideo />}
                      {groupKey === 'telephonic' && <FaPhone />}
                      {groupKey === 'face_to_face' && <FaUserMd />}
                    </span>
                    <h2 className="text-white font-bold text-lg">{groupLabels[groupKey]}</h2>
                  </div>

                  {/* Pricing Rows */}
                  <div className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <div key={item.id} className={`px-6 py-4 ${getTypeColor(item.consultation_type)}`}>
                        {editingId === item.id ? (
                          /* Edit Mode */
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-center space-x-3 flex-1">
                              {getSessionIcon(item.session_type)}
                              <span className="font-medium text-gray-700">
                                {item.session_type === 'couples' ? 'Per Couple' : 'One Person'}
                                {item.consultation_type.includes('telephonic') && (
                                  <span className="text-sm text-gray-500 ml-1">
                                    ({item.consultation_type === 'telephonic_new' ? 'New Patient' : 'Existing Patient'})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">R</span>
                                <input
                                  type="number"
                                  value={editForm.price}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none"
                                />
                              </div>
                              <input
                                type="text"
                                value={editForm.duration}
                                onChange={(e) => setEditForm(prev => ({ ...prev, duration: e.target.value }))}
                                className="w-36 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none"
                                placeholder="e.g. 60 minutes"
                              />
                              <button
                                onClick={() => handleSave(item)}
                                disabled={saving}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                <FaSave />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getSessionIcon(item.session_type)}
                              <div>
                                <span className="font-medium text-gray-700">
                                  {item.session_type === 'couples' ? 'Per Couple' : 'One Person'}
                                </span>
                                {item.consultation_type.includes('telephonic') && (
                                  <span className="text-sm text-gray-500 ml-2">
                                    ({item.consultation_type === 'telephonic_new' ? 'New Patient' : 'Existing Patient'})
                                  </span>
                                )}
                                <p className="text-sm text-gray-500">{item.duration}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-2xl font-bold text-primary-green">R{item.price.toLocaleString()}</span>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-gray-400 hover:text-primary-green hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit price"
                              >
                                <FaEdit />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Price changes take effect immediately. Existing bookings that have already been paid for will not be affected.
          </p>
        </div>
      </div>
  );
};

// Wrapper component that provides AdminContext via AdminLayout
const AdminConsultationPricing = () => {
  return (
    <AdminLayout>
      <AdminConsultationPricingContent />
    </AdminLayout>
  );
};

export default AdminConsultationPricing;
