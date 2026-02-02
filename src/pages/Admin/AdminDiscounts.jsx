import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaTag, FaPercent, FaDollarSign, FaGift } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { useAdmin } from '../../context/AdminContext';
import {
  getAllDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscountStatus,
  getAllProducts
} from '../../lib/supabase';

// Inner component that uses AdminContext
const AdminDiscountsContent = () => {
  const { log, canPerform } = useAdmin();
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    buy_quantity: '',
    get_quantity: '',
    min_purchase_amount: '',
    min_quantity: '',
    apply_to: 'all',
    product_ids: [],
    start_date: '',
    end_date: '',
    is_active: true,
    max_uses: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [discountsData, productsData] = await Promise.all([
        getAllDiscounts(),
        getAllProducts()
      ]);
      setDiscounts(discountsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      buy_quantity: '',
      get_quantity: '',
      min_purchase_amount: '',
      min_quantity: '',
      apply_to: 'all',
      product_ids: [],
      start_date: '',
      end_date: '',
      is_active: true,
      max_uses: ''
    });
    setEditingDiscount(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Convert local datetime to ISO string for storage
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      const discountData = {
        name: formData.name,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        buy_quantity: formData.buy_quantity ? parseInt(formData.buy_quantity) : null,
        get_quantity: formData.get_quantity ? parseInt(formData.get_quantity) : null,
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
        min_quantity: formData.min_quantity ? parseInt(formData.min_quantity) : null,
        apply_to: formData.apply_to,
        product_ids: formData.product_ids,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: formData.is_active,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null
      };

      if (editingDiscount) {
        await updateDiscount(editingDiscount.id, discountData);

        // Log the update activity
        await log({
          actionType: 'update',
          resourceType: 'discount',
          resourceId: editingDiscount.id,
          resourceName: discountData.name,
          details: {
            discountType: discountData.discount_type,
            discountValue: discountData.discount_value,
            applyTo: discountData.apply_to,
            changes: 'Discount details updated'
          }
        });

        alert('Discount updated successfully!');
      } else {
        const newDiscount = await createDiscount(discountData);

        // Log the create activity
        await log({
          actionType: 'create',
          resourceType: 'discount',
          resourceId: newDiscount.id,
          resourceName: discountData.name,
          details: {
            discountType: discountData.discount_type,
            discountValue: discountData.discount_value,
            applyTo: discountData.apply_to
          }
        });

        alert('Discount created successfully!');
      }

      setShowModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving discount:', error);
      alert('Failed to save discount');
    }
  };

  const handleEdit = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name || '',
      description: discount.description || '',
      discount_type: discount.discount_type,
      discount_value: discount.discount_value || '',
      buy_quantity: discount.buy_quantity || '',
      get_quantity: discount.get_quantity || '',
      min_purchase_amount: discount.min_purchase_amount || '',
      min_quantity: discount.min_quantity || '',
      apply_to: discount.apply_to,
      product_ids: discount.product_ids || [],
      start_date: discount.start_date ? discount.start_date.substring(0, 16) : '',
      end_date: discount.end_date ? discount.end_date.substring(0, 16) : '',
      is_active: discount.is_active,
      max_uses: discount.max_uses || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (discountId) => {
    // Check permissions
    if (!canPerform('delete')) {
      alert('You do not have permission to delete discounts. Only super admins can delete discounts.');
      return;
    }

    if (!confirm('Are you sure you want to delete this discount?')) return;

    // Find discount to get its name for logging
    const discount = discounts.find(d => d.id === discountId);

    try {
      await deleteDiscount(discountId);

      // Log the delete activity
      await log({
        actionType: 'delete',
        resourceType: 'discount',
        resourceId: discountId,
        resourceName: discount?.name || 'Unknown Discount',
        details: {
          discountType: discount?.discount_type,
          discountValue: discount?.discount_value,
          deletedAt: new Date().toISOString()
        }
      });

      alert('Discount deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Failed to delete discount');
    }
  };

  const handleToggleStatus = async (discountId, currentStatus) => {
    try {
      await toggleDiscountStatus(discountId, !currentStatus);
      await loadData();
    } catch (error) {
      console.error('Error toggling discount status:', error);
      alert('Failed to update discount status');
    }
  };

  const getDiscountIcon = (type) => {
    switch (type) {
      case 'percentage': return <FaPercent className="text-blue-600" />;
      case 'fixed_amount': return <FaDollarSign className="text-green-600" />;
      case 'buy_x_get_y': return <FaGift className="text-purple-600" />;
      default: return <FaTag className="text-gray-600" />;
    }
  };

  const getDiscountBadge = (discount) => {
    switch (discount.discount_type) {
      case 'percentage':
        return `${discount.discount_value}% OFF`;
      case 'fixed_amount':
        return `R${discount.discount_value} OFF`;
      case 'buy_x_get_y':
        return `Buy ${discount.buy_quantity} Get ${discount.get_quantity} Free`;
      case 'free_shipping':
        return 'FREE SHIPPING';
      default:
        return 'DISCOUNT';
    }
  };

  const isDiscountActive = (discount) => {
    if (!discount.is_active) return false;
    const now = new Date();
    const start = new Date(discount.start_date);
    const end = new Date(discount.end_date);
    return now >= start && now <= end;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Discount Management</h1>
          <p className="text-gray-600 mt-1">Create and manage sales, discounts, and promotions</p>
        </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <FaPlus />
            <span>New Discount</span>
          </button>
        </div>

        {/* Discounts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
            <p className="mt-4 text-gray-600">Loading discounts...</p>
          </div>
        ) : discounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FaTag className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No discounts created yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first discount to start promoting products</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {discounts.map((discount) => (
              <motion.div
                key={discount.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getDiscountIcon(discount.discount_type)}
                      <h3 className="text-xl font-bold text-gray-800">{discount.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isDiscountActive(discount)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isDiscountActive(discount) ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {getDiscountBadge(discount)}
                      </span>
                    </div>

                    {discount.description && (
                      <p className="text-gray-600 mb-3">{discount.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Start Date:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(discount.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">End Date:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(discount.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Applies To:</span>
                        <p className="font-medium text-gray-900">
                          {discount.apply_to === 'all' ? 'All Products' : `${discount.product_ids?.length || 0} Products`}
                        </p>
                      </div>
                      {discount.usage_count !== undefined && (
                        <div>
                          <span className="text-gray-500">Usage:</span>
                          <p className="font-medium text-gray-900">
                            {discount.usage_count} {discount.max_uses ? `/ ${discount.max_uses}` : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleStatus(discount.id, discount.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        discount.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={discount.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {discount.is_active ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                    </button>
                    <button
                      onClick={() => handleEdit(discount)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Discount Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                      placeholder="e.g., Black Friday Sale"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none resize-none"
                      placeholder="Brief description of the discount"
                      rows="2"
                    />
                  </div>

                  {/* Discount Type */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                      required
                    >
                      <option value="percentage">Percentage Off (%)</option>
                      <option value="fixed_amount">Fixed Amount Off (R)</option>
                      <option value="buy_x_get_y">Buy X Get Y Free</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>

                  {/* Conditional Fields Based on Type */}
                  {formData.discount_type === 'percentage' && (
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">
                        Percentage *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="e.g., 50 for 50% off"
                        required
                      />
                    </div>
                  )}

                  {formData.discount_type === 'fixed_amount' && (
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">
                        Amount (R) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="e.g., 50 for R50 off"
                        required
                      />
                    </div>
                  )}

                  {formData.discount_type === 'buy_x_get_y' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium text-gray-700 mb-2">
                          Buy Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.buy_quantity}
                          onChange={(e) => setFormData({ ...formData, buy_quantity: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                          placeholder="e.g., 1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-2">
                          Get Quantity Free *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.get_quantity}
                          onChange={(e) => setFormData({ ...formData, get_quantity: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                          placeholder="e.g., 1"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Apply To */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Apply To *
                    </label>
                    <select
                      value={formData.apply_to}
                      onChange={(e) => setFormData({ ...formData, apply_to: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                      required
                    >
                      <option value="all">All Products</option>
                      <option value="specific">Specific Products</option>
                    </select>
                  </div>

                  {/* Product Selection (if specific) */}
                  {formData.apply_to === 'specific' && (
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">
                        Select Products *
                      </label>
                      <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                        {products.map((product) => (
                          <label key={product.id} className="flex items-center space-x-2 mb-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.product_ids.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    product_ids: [...formData.product_ids, product.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    product_ids: formData.product_ids.filter(id => id !== product.id)
                                  });
                                }
                              }}
                              className="rounded text-primary-green focus:ring-primary-green"
                            />
                            <span className="text-sm">{product.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">
                        Minimum Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.min_quantity}
                        onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">
                        Min Purchase Amount (R)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.min_purchase_amount}
                        onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">
                        Maximum Uses
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_uses}
                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none"
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded text-primary-green focus:ring-primary-green"
                    />
                    <label htmlFor="is_active" className="font-medium text-gray-700">
                      Activate discount immediately
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-green text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                      {editingDiscount ? 'Update Discount' : 'Create Discount'}
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

// Wrapper component
const AdminDiscounts = () => {
  return (
    <AdminLayout>
      <AdminDiscountsContent />
    </AdminLayout>
  );
};

export default AdminDiscounts;
