import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaUser,
  FaSearch,
  FaFilter,
  FaFileExport,
  FaShoppingCart,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSync,
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheckCircle
} from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import {
  getAllClients,
  searchClients,
  filterClientsByType,
  getClientWithHistory,
  syncExistingDataToClients,
  updateClient,
  deleteClient,
  getAllAppointments,
  getAllOrders
} from '../../lib/supabase';

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, customer, patient, both, lead
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [allAppointments, setAllAppointments] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm, filterType, filterStatus]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const [clientsData, appointmentsData, ordersData] = await Promise.all([
        getAllClients(),
        getAllAppointments(),
        getAllOrders()
      ]);
      setClients(clientsData);
      setAllAppointments(appointmentsData);
      setAllOrders(ordersData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.name?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.phone?.toLowerCase().includes(term)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(client => client.client_type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => client.status === filterStatus);
    }

    setFilteredClients(filtered);
  };

  const handleSyncData = async () => {
    if (!confirm('This will import all existing orders and appointments as clients. Continue?')) {
      return;
    }

    try {
      setSyncing(true);
      const result = await syncExistingDataToClients();
      setSyncMessage(`✅ Successfully synced ${result.count} clients!`);
      setTimeout(() => setSyncMessage(''), 5000);
      await loadClients();
    } catch (error) {
      setSyncMessage('❌ Error syncing data. Check console for details.');
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleViewClient = async (clientId) => {
    try {
      const clientData = await getClientWithHistory(clientId);
      setSelectedClient(clientData);
      setShowClientModal(true);
    } catch (error) {
      console.error('Error loading client details:', error);
    }
  };

  const handleDeleteClient = async (clientId, clientName) => {
    if (!confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteClient(clientId);
      setSyncMessage(`✅ Successfully deleted ${clientName}`);
      setTimeout(() => setSyncMessage(''), 5000);
      await loadClients();
    } catch (error) {
      setSyncMessage(`❌ Error deleting client. Check console for details.`);
      console.error('Delete error:', error);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'City',
      'Type',
      'Status',
      'Total Orders',
      'Total Spent (R)',
      'Total Appointments',
      'First Contact',
      'Last Contact'
    ];

    const rows = filteredClients.map(client => [
      client.name || '',
      client.email || '',
      client.phone || '',
      client.city || '',
      client.client_type || '',
      client.status || '',
      client.total_orders || 0,
      client.total_spent || 0,
      client.total_appointments || 0,
      new Date(client.first_contact_date).toLocaleDateString('en-ZA'),
      new Date(client.last_contact_date).toLocaleDateString('en-ZA')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getClientTypeBadge = (type) => {
    const badges = {
      customer: 'bg-blue-100 text-blue-800',
      patient: 'bg-green-100 text-green-800',
      both: 'bg-purple-100 text-purple-800',
      lead: 'bg-gray-100 text-gray-800'
    };
    return badges[type] || badges.lead;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.active;
  };

  const stats = {
    total: clients.length,
    customers: clients.filter(c => c.client_type === 'customer' || c.client_type === 'both').length,
    patients: clients.filter(c => c.client_type === 'patient' || c.client_type === 'both').length,
    leads: clients.filter(c => c.client_type === 'lead').length
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-montserrat font-bold text-dark-text mb-2">
            Clients
          </h1>
          <p className="text-gray-600">Manage your customer and patient database</p>
        </div>

        {/* Sync Message */}
        {syncMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
          >
            {syncMessage}
          </motion.div>
        )}

        {/* Stats Card */}
        <div className="mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Clients</p>
                <p className="text-3xl font-bold text-dark-text">{stats.total}</p>
              </div>
              <FaUser className="text-4xl text-primary-green" />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="customer">Customers</option>
                <option value="patient">Patients</option>
                <option value="both">Both</option>
                <option value="lead">Leads</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
              >
                <FaFileExport />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleSyncData}
                disabled={syncing}
                className="px-4 py-2 bg-primary-gold text-white rounded-lg hover:bg-opacity-90 flex items-center space-x-2 disabled:opacity-50"
              >
                <FaSync className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">
              <FaSync className="animate-spin text-3xl mx-auto mb-2" />
              Loading clients...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <FaUser className="text-5xl mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No clients found</p>
              <p className="text-sm">
                {clients.length === 0
                  ? 'Click "Sync Data" to import existing orders and appointments'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Contact
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-green rounded-full flex items-center justify-center text-white font-bold">
                            {client.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            {client.city && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <FaMapMarkerAlt className="mr-1" />
                                {client.city}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FaPhone className="mr-2 text-gray-400" />
                          {client.phone}
                        </div>
                        {client.email && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <FaEnvelope className="mr-2 text-gray-400" />
                            {client.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(client.last_contact_date).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewClient(client.id)}
                          className="text-primary-green hover:text-primary-green/80 mr-3"
                          title="View Details"
                        >
                          <FaEye className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Client"
                        >
                          <FaTrash className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Client Detail Modal */}
        {showClientModal && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-montserrat font-bold text-dark-text">
                    Client Details
                  </h2>
                  <button
                    onClick={() => setShowClientModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="text-2xl" />
                  </button>
                </div>

                {/* Client Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {selectedClient.name}</p>
                    <p><strong>Email:</strong> {selectedClient.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedClient.phone}</p>
                    <p><strong>Address:</strong> {selectedClient.address || 'N/A'}</p>
                    <p><strong>City:</strong> {selectedClient.city || 'N/A'}</p>
                    <p><strong>Postal Code:</strong> {selectedClient.postal_code || 'N/A'}</p>
                  </div>
                </div>

                {/* Order History */}
                {selectedClient.orders && selectedClient.orders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <FaShoppingCart className="mr-2 text-blue-600" />
                      Order History ({selectedClient.orders.length})
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      {selectedClient.orders.map((order) => (
                        <div key={order.id} className="mb-3 p-3 bg-white rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Order #{order.order_id}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.order_date).toLocaleDateString('en-ZA')}
                              </p>
                              <p className="text-sm text-gray-600">
                                Items: {order.items?.length || 0}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary-gold">R{parseFloat(order.total).toFixed(2)}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Appointment History */}
                {selectedClient.appointments && selectedClient.appointments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <FaCalendarAlt className="mr-2 text-green-600" />
                      Appointment History ({selectedClient.appointments.length})
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      {selectedClient.appointments.map((appointment) => (
                        <div key={appointment.id} className="mb-3 p-3 bg-white rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{appointment.type === 'virtual' ? 'Virtual' : 'Telephonic'} Consultation</p>
                              <p className="text-sm text-gray-600">
                                {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('en-ZA') : 'N/A'} at {appointment.appointment_time || 'N/A'}
                              </p>
                              {appointment.symptoms && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Symptoms: {appointment.symptoms}
                                </p>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedClient.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Notes</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedClient.notes}</p>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowClientModal(false)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminClients;
