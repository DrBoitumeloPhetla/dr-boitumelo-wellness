import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaHandshake,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaToggleOn,
  FaToggleOff,
  FaCopy,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { useAdmin } from '../../context/AdminContext';
import {
  getAllAffiliates,
  createAffiliate,
  updateAffiliate,
  deleteAffiliate,
  toggleAffiliateStatus
} from '../../lib/supabase';

const AdminAffiliatesContent = () => {
  const { log, canPerform } = useAdmin();
  const [affiliates, setAffiliates] = useState([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    loadAffiliates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [affiliates, searchTerm, statusFilter]);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      const data = await getAllAffiliates();
      setAffiliates(data);
    } catch (error) {
      console.error('Error loading affiliates:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...affiliates];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(affiliate =>
        affiliate.name?.toLowerCase().includes(term) ||
        affiliate.email?.toLowerCase().includes(term) ||
        affiliate.coupon_code?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(affiliate =>
        statusFilter === 'active' ? affiliate.is_active : !affiliate.is_active
      );
    }

    setFilteredAffiliates(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      notes: ''
    });
    setEditingAffiliate(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAffiliate) {
        await updateAffiliate(editingAffiliate.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          notes: formData.notes || null
        });

        await log({
          actionType: 'update',
          resourceType: 'affiliate',
          resourceId: editingAffiliate.id,
          resourceName: formData.name,
          details: { email: formData.email }
        });

        alert('Affiliate updated successfully!');
      } else {
        const newAffiliate = await createAffiliate(formData);

        await log({
          actionType: 'create',
          resourceType: 'affiliate',
          resourceId: newAffiliate.id,
          resourceName: formData.name,
          details: {
            email: formData.email,
            coupon_code: newAffiliate.coupon_code
          }
        });

        alert(`Affiliate created successfully!\n\nCoupon Code: ${newAffiliate.coupon_code}`);
      }

      setShowModal(false);
      resetForm();
      await loadAffiliates();
    } catch (error) {
      console.error('Error saving affiliate:', error);
      alert(`Failed to save affiliate: ${error.message}`);
    }
  };

  const handleEdit = (affiliate) => {
    setEditingAffiliate(affiliate);
    setFormData({
      name: affiliate.name,
      email: affiliate.email,
      phone: affiliate.phone || '',
      notes: affiliate.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (affiliateId) => {
    if (!canPerform('delete')) {
      alert('You do not have permission to delete affiliates. Only super admins can delete.');
      return;
    }

    if (!confirm('Are you sure you want to delete this affiliate? This cannot be undone.')) return;

    const affiliate = affiliates.find(a => a.id === affiliateId);

    try {
      await deleteAffiliate(affiliateId);

      await log({
        actionType: 'delete',
        resourceType: 'affiliate',
        resourceId: affiliateId,
        resourceName: affiliate?.name || 'Unknown',
        details: { coupon_code: affiliate?.coupon_code }
      });

      alert('Affiliate deleted successfully');
      await loadAffiliates();
    } catch (error) {
      console.error('Error deleting affiliate:', error);
      alert('Failed to delete affiliate');
    }
  };

  const handleToggleStatus = async (affiliate) => {
    try {
      await toggleAffiliateStatus(affiliate.id, !affiliate.is_active);

      await log({
        actionType: 'update',
        resourceType: 'affiliate',
        resourceId: affiliate.id,
        resourceName: affiliate.name,
        details: {
          status_change: affiliate.is_active ? 'deactivated' : 'activated'
        }
      });

      await loadAffiliates();
    } catch (error) {
      console.error('Error toggling affiliate status:', error);
      alert('Failed to update affiliate status');
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatCurrency = (amount) => {
    return `R${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Calculate totals
  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter(a => a.is_active).length;
  const totalSales = affiliates.reduce((sum, a) => sum + parseFloat(a.total_sales || 0), 0);
  const totalCommission = affiliates.reduce((sum, a) => sum + parseFloat(a.total_commission || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-montserrat font-bold text-dark-text mb-2">
          Affiliates Management
        </h1>
        <p className="text-gray-600">Manage affiliate partners and their coupon codes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Affiliates</p>
              <p className="text-2xl font-bold text-dark-text">{totalAffiliates}</p>
            </div>
            <FaHandshake className="text-3xl text-primary-green opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeAffiliates}</p>
            </div>
            <FaCheckCircle className="text-3xl text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-dark-text">{formatCurrency(totalSales)}</p>
            </div>
            <span className="text-3xl opacity-50">💰</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Commission</p>
              <p className="text-2xl font-bold text-gold">{formatCurrency(totalCommission)}</p>
            </div>
            <span className="text-3xl opacity-50">💵</span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Add Button */}
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full md:w-auto px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-opacity-90 flex items-center justify-center gap-2 font-medium"
          >
            <FaPlus /> Add Affiliate
          </button>
        </div>
      </div>

      {/* Affiliates Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-2"></div>
            Loading affiliates...
          </div>
        ) : filteredAffiliates.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <FaHandshake className="text-5xl mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">No affiliates found</p>
            <p className="text-sm">Create your first affiliate to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coupon Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-green rounded-full flex items-center justify-center text-white font-bold">
                          {affiliate.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                          <div className="text-sm text-gray-500">{affiliate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gold/10 text-gold font-mono font-bold rounded">
                          {affiliate.coupon_code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(affiliate.coupon_code)}
                          className="text-gray-400 hover:text-primary-green transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === affiliate.coupon_code ? (
                            <FaCheckCircle className="text-green-500" />
                          ) : (
                            <FaCopy />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(affiliate)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          affiliate.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {affiliate.is_active ? (
                          <>
                            <FaToggleOn className="text-green-600" /> Active
                          </>
                        ) : (
                          <>
                            <FaToggleOff /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {affiliate.total_orders || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(affiliate.total_sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gold">
                      {formatCurrency(affiliate.total_commission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(affiliate)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(affiliate.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingAffiliate ? 'Edit Affiliate' : 'Create New Affiliate'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                    placeholder="Affiliate name"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                    placeholder="+27 XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                    placeholder="Optional notes about this affiliate..."
                    rows={3}
                  />
                </div>

                {!editingAffiliate && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> A unique coupon code (DRBOIT###) will be automatically generated.
                      The discount and commission rates are fixed at 10%.
                    </p>
                  </div>
                )}

                {editingAffiliate && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded">
                    <p className="text-sm text-gray-600">
                      <strong>Coupon Code:</strong> {editingAffiliate.coupon_code}<br />
                      <strong>Discount Rate:</strong> {editingAffiliate.discount_percentage}%<br />
                      <strong>Commission Rate:</strong> {editingAffiliate.commission_percentage}%
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-opacity-90 font-medium"
                  >
                    {editingAffiliate ? 'Update Affiliate' : 'Create Affiliate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminAffiliates = () => {
  return (
    <AdminLayout>
      <AdminAffiliatesContent />
    </AdminLayout>
  );
};

export default AdminAffiliates;
