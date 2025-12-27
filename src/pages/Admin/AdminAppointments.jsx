import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaEnvelope, FaUser, FaPhone, FaVideo, FaExternalLinkAlt, FaClock, FaTrash } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { useAdmin } from '../../context/AdminContext';
import { getAllConsultationAppointments, deleteConsultationAppointment } from '../../lib/supabase';

const CALENDLY_LINK = 'https://calendly.com/app/scheduled_events/user/me';

// Inner component that uses AdminContext
const AdminAppointmentsContent = () => {
  const { isSuperAdmin } = useAdmin();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAllConsultationAppointments();
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (appointment) => {
    if (!confirm(`Delete appointment for ${appointment.customer_name}? This cannot be undone.`)) return;

    try {
      await deleteConsultationAppointment(appointment.id);
      loadAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
    }
  };

  // Stats
  const stats = {
    total: appointments.length,
    revenue: appointments.reduce((sum, a) => sum + parseFloat(a.consultation_price || 0), 0)
  };

  // Only super admin can see this page
  if (!isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FaCalendarAlt className="text-5xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Access Restricted</h2>
          <p className="text-gray-500 mt-2">Only super administrators can view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Calendly Link */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Consultation Appointments</h1>
          <p className="text-gray-600 mt-1">Paid consultations pending scheduling</p>
        </div>
        <a
          href={CALENDLY_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors shadow-lg"
        >
          <FaCalendarAlt />
          <span>View Calendly Bookings</span>
          <FaExternalLinkAlt className="text-sm" />
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Appointments</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-primary-green">R{stats.revenue.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
      </div>

      {/* Calendly Reminder Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="bg-blue-500 p-3 rounded-full">
            <FaCalendarAlt className="text-2xl text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 text-lg">Don't forget to check Calendly!</h3>
          </div>
        </div>
      </motion.div>


      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
            <p className="mt-4 text-gray-600">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FaCalendarAlt className="text-5xl mx-auto mb-4 text-gray-300" />
            <p>No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <FaUser className="text-gray-400" />
                          {appointment.customer_name}
                        </div>
                        <div className="text-gray-500 flex items-center gap-2 mt-1">
                          <FaEnvelope className="text-xs" />
                          {appointment.customer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {appointment.consultation_type === 'virtual' ? (
                          <FaVideo className="text-green-600" />
                        ) : (
                          <FaPhone className="text-blue-600" />
                        )}
                        <span className="capitalize font-medium">
                          {appointment.consultation_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-primary-green">
                        R{appointment.consultation_price}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 flex items-center gap-1">
                        <FaClock className="text-gray-400" />
                        {new Date(appointment.created_at).toLocaleDateString('en-ZA')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(appointment.created_at).toLocaleTimeString('en-ZA')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(appointment)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete appointment"
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
    </div>
  );
};

// Wrapper component
const AdminAppointments = () => {
  return (
    <AdminLayout>
      <AdminAppointmentsContent />
    </AdminLayout>
  );
};

export default AdminAppointments;
