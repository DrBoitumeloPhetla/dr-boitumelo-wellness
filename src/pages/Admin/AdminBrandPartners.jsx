import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaHandshake, FaToggleOn, FaToggleOff, FaCopy, FaCheck } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import {
  getAllBrandPartners,
  createBrandPartner,
  updateBrandPartner,
  deleteBrandPartner,
} from '../../lib/supabase';

const AdminBrandPartnersContent = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    partnerCode: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAllBrandPartners();
      setPartners(data);
    } catch (err) {
      console.error('Error loading brand partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', contactEmail: '', partnerCode: '', notes: '' });
    setEditing(null);
    setError('');
  };

  const openAdd = () => {
    resetForm();
    // Suggest the next available DRBBP code per Dr. Boitumelo's convention.
    const used = new Set(partners.map((p) => (p.partner_code || '').toUpperCase()));
    for (let i = 1; i <= 99; i++) {
      const candidate = `DRBBP${String(i).padStart(2, '0')}`;
      if (!used.has(candidate)) {
        setFormData((prev) => ({ ...prev, partnerCode: candidate }));
        break;
      }
    }
    setShowModal(true);
  };

  const openEdit = (partner) => {
    setEditing(partner);
    setFormData({
      name: partner.name || '',
      contactEmail: partner.contact_email || '',
      partnerCode: partner.partner_code || '',
      notes: partner.notes || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.partnerCode.trim()) {
      setError('Name and Partner Code are required.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateBrandPartner(editing.id, formData);
      } else {
        await createBrandPartner(formData);
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      console.error('Error saving partner:', err);
      if (err.code === '23505' || /unique/i.test(err.message || '')) {
        setError('That partner code is already in use.');
      } else {
        setError('Failed to save. Check the values and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (partner) => {
    try {
      await updateBrandPartner(partner.id, { isActive: !partner.is_active });
      load();
    } catch (err) {
      console.error('Error toggling partner status:', err);
      alert('Failed to update partner status.');
    }
  };

  const handleDelete = async (partner) => {
    if (!confirm(`Delete brand partner "${partner.name}"? This cannot be undone.`)) return;
    try {
      await deleteBrandPartner(partner.id);
      load();
    } catch (err) {
      console.error('Error deleting partner:', err);
      alert('Failed to delete partner. They may have existing registrations or orders linked.');
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaHandshake className="text-purple-600" /> Brand Partners
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            Doctors with free Vitamin D Talks access and 30% off orders.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-green-dark transition-colors"
        >
          <FaPlus /> New Partner
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-green"></div>
            <p className="mt-3 text-gray-600">Loading partners…</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FaHandshake className="text-5xl mx-auto mb-3 text-gray-300" />
            <p>No brand partners yet.</p>
            <p className="text-sm mt-1">Click "New Partner" to add the first one.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {partners.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                      {p.contact_email && (
                        <p className="text-xs text-gray-500 truncate">{p.contact_email}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                        p.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <code className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm font-mono font-bold">
                      {p.partner_code}
                    </code>
                    <button
                      onClick={() => handleCopy(p.partner_code)}
                      className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                    >
                      {copiedCode === p.partner_code ? (
                        <>
                          <FaCheck /> Copied
                        </>
                      ) : (
                        <>
                          <FaCopy /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  {p.notes && (
                    <p className="text-xs text-gray-500 mb-3 italic">{p.notes}</p>
                  )}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                      {p.is_active ? <FaToggleOn className="text-green-600 text-lg" /> : <FaToggleOff className="text-gray-400 text-lg" />}
                      {p.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 ml-auto"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {partners.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        {p.notes && (
                          <div className="text-xs text-gray-500 mt-0.5 italic max-w-xs truncate">{p.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm font-mono font-bold">
                            {p.partner_code}
                          </code>
                          <button
                            onClick={() => handleCopy(p.partner_code)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                            title="Copy code"
                          >
                            {copiedCode === p.partner_code ? <FaCheck /> : <FaCopy />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {p.contact_email || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            p.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {editing ? 'Edit Brand Partner' : 'New Brand Partner'}
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {editing
                  ? 'Update the partner record.'
                  : 'Add a doctor who gets free webinar access + 30% off orders.'}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Nontobeko Mbatha"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Partner Code *
                  </label>
                  <input
                    type="text"
                    value={formData.partnerCode}
                    onChange={(e) =>
                      setFormData({ ...formData, partnerCode: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. DRBBP01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent uppercase font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    They'll enter this at webinar signup (free access) or at checkout (30% off).
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="contact@example.co.za"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    placeholder="Optional internal notes…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-green-dark disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Partner'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

const AdminBrandPartners = () => (
  <AdminLayout>
    <AdminBrandPartnersContent />
  </AdminLayout>
);

export default AdminBrandPartners;
