import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaEnvelope, FaPhone, FaUser, FaCheckCircle, FaClock, FaTrash } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { getAllContacts, updateContactStatus as updateContactStatusDB, deleteContact } from '../../lib/supabase';

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await getAllContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (contactId, newStatus) => {
    try {
      await updateContactStatusDB(contactId, newStatus);
      const updatedContacts = contacts.map(contact =>
        contact.id === contactId ? { ...contact, status: newStatus } : contact
      );
      setContacts(updatedContacts);
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Failed to update contact status');
    }
  };

  const handleDeleteContact = async (contact) => {
    if (!confirm(`Are you sure you want to delete the contact submission from ${contact.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteContact(contact.id);
      setContacts(contacts.filter(c => c.id !== contact.id));
      alert('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone && contact.phone.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-gray-100 text-gray-800';
      case 'responded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-montserrat font-bold text-dark-text mb-2">
            Contact Submissions
          </h1>
          <p className="text-gray-600">View and manage contact form submissions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
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
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="responded">Responded</option>
            </select>
          </div>
        </div>

        {/* Contacts List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaEnvelope className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No contact submissions found</p>
            <p className="text-gray-400 mt-2">Messages will appear here when visitors submit the contact form</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <FaUser className="text-primary-green" />
                        <h3 className="text-lg font-semibold text-dark-text">
                          {contact.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contact.status)}`}>
                          {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Submitted on {new Date(contact.submittedAt).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <FaEnvelope className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a href={`mailto:${contact.email}`} className="text-primary-green hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    </div>

                    {contact.phone && (
                      <div className="flex items-center space-x-2">
                        <FaPhone className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <a href={`tel:${contact.phone}`} className="text-primary-green hover:underline">
                            {contact.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {contact.serviceType && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Service Interest</p>
                      <span className="inline-block bg-primary-gold bg-opacity-10 text-primary-gold px-3 py-1 rounded-full text-sm font-medium capitalize">
                        {contact.serviceType}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <p className="text-sm text-gray-500 mb-2">Message</p>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded whitespace-pre-wrap">
                      {contact.message}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => updateContactStatus(contact.id, 'responded')}
                      disabled={contact.status === 'responded'}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-2"
                    >
                      <FaCheckCircle />
                      <span>Mark as Responded</span>
                    </button>
                    <a
                      href={`mailto:${contact.email}?subject=Re: Your inquiry&body=Hi ${contact.name},%0D%0A%0D%0AThank you for contacting Dr. Boitumelo Wellness.%0D%0A%0D%0A`}
                      className="px-4 py-2 bg-primary-green text-white rounded hover:bg-opacity-90 text-sm flex items-center space-x-2"
                    >
                      <FaEnvelope />
                      <span>Reply via Email</span>
                    </a>
                    <button
                      onClick={() => handleDeleteContact(contact)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center space-x-2"
                    >
                      <FaTrash />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContacts;
