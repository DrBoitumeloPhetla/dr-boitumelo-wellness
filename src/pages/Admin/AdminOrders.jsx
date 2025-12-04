import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaEye, FaCheckCircle, FaTruck, FaClock, FaTrash, FaEnvelope } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { useAdmin } from '../../context/AdminContext';
import { getAllOrders, updateOrderStatus as updateOrderStatusDB, deleteOrder } from '../../lib/supabase';
import { sendOrderConfirmationEmail } from '../../lib/emailService';

// Inner component that uses AdminContext
const AdminOrdersContent = () => {
  const { log, canPerform } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);

    try {
      await updateOrderStatusDB(orderId, newStatus);

      // Log the update activity
      await log({
        actionType: 'update',
        resourceType: 'order',
        resourceId: orderId,
        resourceName: `Order #${orderId.slice(0, 8)}`,
        details: {
          customerName: order?.customer?.name,
          previousStatus: order?.status,
          newStatus: newStatus,
          totalAmount: order?.total
        }
      });

      // Update local state
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const confirmPaymentAndSendEmails = async (order) => {
    if (!confirm(`Confirm payment received for Order #${order.id}?\n\nThis will:\n1. Mark order as Processing\n2. Send confirmation emails to customer and admin`)) {
      return;
    }

    try {
      // Mark order as processing
      await updateOrderStatusDB(order.id, 'processing');

      // Send emails
      await sendOrderConfirmationEmail({
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping || 0,
        total: order.total,
        order_id: order.id
      });

      // Update local state
      const updatedOrders = orders.map(o =>
        o.id === order.id ? { ...o, status: 'processing' } : o
      );
      setOrders(updatedOrders);

      alert('Payment confirmed! Emails sent successfully to customer and admin.');
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to send emails. Please try again.');
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    // Check permissions
    if (!canPerform('delete')) {
      alert('You do not have permission to delete orders. Only super admins can delete orders.');
      return;
    }

    if (!confirm(`Are you sure you want to delete Order #${orderNumber}? This action cannot be undone.`)) {
      return;
    }

    const order = orders.find(o => o.id === orderId);

    try {
      await deleteOrder(orderId);

      // Log the delete activity
      await log({
        actionType: 'delete',
        resourceType: 'order',
        resourceId: orderId,
        resourceName: `Order #${orderNumber}`,
        details: {
          customerName: order?.customer?.name,
          customerEmail: order?.customer?.email,
          totalAmount: order?.total,
          deletedAt: new Date().toISOString()
        }
      });

      alert(`Order #${orderNumber} has been deleted successfully`);
      await loadOrders();
    } catch (error) {
      console.error('Delete order error:', error);
      alert('Failed to delete order. Check console for details.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'processing': return <FaTruck className="text-blue-500" />;
      case 'completed': return <FaCheckCircle className="text-green-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
        <div className="mb-8">
          <h1 className="text-3xl font-montserrat font-bold text-dark-text mb-2">
            Orders Management
          </h1>
          <p className="text-gray-600">View and manage all customer orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400 mt-2">Orders will appear here when customers make purchases</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-dark-text">
                          Order #{order.id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {new Date(order.orderDate).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="mt-4 lg:mt-0">
                      <p className="text-2xl font-bold text-primary-green">
                        R{order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Customer</p>
                        <p className="font-medium">{order.customer.name}</p>
                        <p className="text-sm text-gray-600">{order.customer.email}</p>
                        <p className="text-sm text-gray-600">{order.customer.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Shipping Address</p>
                        <p className="text-sm text-gray-600">{order.customer.address}</p>
                        <p className="text-sm text-gray-600">
                          {order.customer.city}, {order.customer.postalCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <p className="text-sm text-gray-500 mb-3">Order Items</p>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">R{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.customer.notes && (
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <p className="text-sm text-gray-500 mb-1">Order Notes</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{order.customer.notes}</p>
                    </div>
                  )}

                  {/* Show Confirm Payment button prominently for pending orders */}
                  {order.status === 'pending' && (
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <button
                        onClick={() => confirmPaymentAndSendEmails(order)}
                        className="w-full px-4 py-3 bg-primary-green text-white rounded-lg hover:bg-opacity-90 text-sm font-semibold flex items-center justify-center space-x-2 shadow-md"
                      >
                        <FaEnvelope />
                        <span>Confirm Payment & Send Emails</span>
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Click after customer has paid to send order confirmation emails
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'pending')}
                      disabled={order.status === 'pending'}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Mark Pending
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                      disabled={order.status === 'processing'}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Mark Processing
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      disabled={order.status === 'completed'}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Mark Completed
                    </button>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <button
                      onClick={() => handleDeleteOrder(order.id, order.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center justify-center space-x-2 w-full"
                    >
                      <FaTrash />
                      <span>Delete Order</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
  );
};

// Wrapper component
const AdminOrders = () => {
  return (
    <AdminLayout>
      <AdminOrdersContent />
    </AdminLayout>
  );
};

export default AdminOrders;
