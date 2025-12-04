import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { getActivityLogs } from '../../lib/supabase';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/Admin/AdminLayout';
import {
  FaHistory,
  FaSearch,
  FaFilter,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaCalendar,
  FaTag,
  FaExclamationTriangle
} from 'react-icons/fa';

// Inner component that uses AdminContext
const AdminActivityLogsContent = () => {
  const { isSuperAdmin, loading: adminLoading, currentAdmin } = useAdmin();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    adminUsername: '',
    actionType: '',
    resourceType: '',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 25;

  // Redirect if not super admin - WAIT for admin context to load first
  useEffect(() => {
    // Don't check permissions until admin context has loaded from localStorage
    if (adminLoading) {
      return;
    }

    if (!isSuperAdmin()) {
      navigate('/admin/orders');
    }
  }, [isSuperAdmin, navigate, adminLoading, currentAdmin]);

  // Fetch logs
  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * logsPerPage;
      const result = await getActivityLogs({
        ...filters,
        limit: logsPerPage,
        offset
      });

      setLogs(result.logs);
      setTotalCount(result.total);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Failed to load activity logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      adminUsername: '',
      actionType: '',
      resourceType: '',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Date/Time', 'Admin User', 'Action', 'Resource Type', 'Resource Name', 'Details'];
    const csvData = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.admin_username,
      log.action_type,
      log.resource_type,
      log.resource_name || '-',
      JSON.stringify(log.details || {})
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalCount / logsPerPage);

  const getActionBadgeColor = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-800 border-green-300',
      update: 'bg-blue-100 text-blue-800 border-blue-300',
      delete: 'bg-red-100 text-red-800 border-red-300',
      approve: 'bg-purple-100 text-purple-800 border-purple-300',
      reject: 'bg-orange-100 text-orange-800 border-orange-300',
      login: 'bg-teal-100 text-teal-800 border-teal-300',
      logout: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[action] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Show loading while admin context is loading
  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-montserrat font-bold text-dark-text flex items-center">
                <FaHistory className="mr-3 text-primary-green" />
                Activity Logs
              </h1>
              <p className="text-gray-600 mt-2">
                Track all admin actions and changes to the system
              </p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={logs.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaDownload />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-text flex items-center">
              <FaFilter className="mr-2 text-primary-green" />
              Filters
            </h2>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-green hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Username Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaUser className="inline mr-1" /> Admin User
              </label>
              <input
                type="text"
                value={filters.adminUsername}
                onChange={(e) => handleFilterChange('adminUsername', e.target.value)}
                placeholder="Filter by username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>

            {/* Action Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaTag className="inline mr-1" /> Action Type
              </label>
              <select
                value={filters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>

            {/* Resource Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaTag className="inline mr-1" /> Resource Type
              </label>
              <select
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                <option value="">All Resources</option>
                <option value="product">Product</option>
                <option value="discount">Discount</option>
                <option value="order">Order</option>
                <option value="prescription">Prescription</option>
                <option value="appointment">Appointment</option>
                <option value="blog">Blog</option>
                <option value="testimonial">Testimonial</option>
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCalendar className="inline mr-1" /> Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCalendar className="inline mr-1" /> End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>

            {/* Search Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaSearch className="inline mr-1" /> Search
              </label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="Search resource name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{logs.length}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> total logs
          </p>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
              <p className="mt-4 text-gray-600">Loading activity logs...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchLogs}
                className="mt-4 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-opacity-90"
              >
                Try Again
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <FaHistory className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-600">No activity logs found</p>
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary-green text-white flex items-center justify-center mr-2">
                              {log.admin_username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {log.admin_username}
                              </p>
                              {log.admin_role && (
                                <p className="text-xs text-gray-500">{log.admin_role}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getActionBadgeColor(
                              log.action_type
                            )}`}
                          >
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {log.resource_type}
                          </p>
                          {log.resource_name && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {log.resource_name}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <details className="cursor-pointer">
                              <summary className="text-primary-green hover:underline">
                                View Details
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded max-w-md overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaChevronLeft />
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaChevronRight />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
};

// Wrapper component
const AdminActivityLogs = () => {
  return (
    <AdminLayout>
      <AdminActivityLogsContent />
    </AdminLayout>
  );
};

export default AdminActivityLogs;
