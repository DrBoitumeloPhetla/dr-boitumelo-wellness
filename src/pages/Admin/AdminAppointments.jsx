import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaEnvelope, FaUser, FaPhone, FaVideo, FaUserMd, FaClock, FaMapMarkerAlt, FaCheck, FaTimes, FaFilter, FaEdit, FaSpinner, FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { getAllConsultationBookings, updateConsultationBookingStatus, cancelConsultationBooking, rescheduleConsultationBooking, getAvailableSlots, getCalendarSettings, triggerMakeWebhook, createManualAppointment } from '../../lib/supabase';

// Create Appointment Modal Component
const CreateAppointmentModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    consultationType: 'virtual',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    price: '',
    paymentStatus: 'pending',
    location: '',
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const consultationTypes = [
    { value: 'virtual', label: 'Virtual Consultation', price: 1500 },
    { value: 'telephonic', label: 'Telephonic Consultation', price: 1000 },
    { value: 'face_to_face', label: 'Face-to-Face Consultation', price: 1500 }
  ];

  // Auto-set price and location when consultation type changes
  const handleTypeChange = (type) => {
    const typeInfo = consultationTypes.find(t => t.value === type);
    setFormData(prev => ({
      ...prev,
      consultationType: type,
      price: typeInfo?.price || '',
      location: type === 'face_to_face' ? 'Pretoria East, Garsfontein' : ''
    }));
  };

  // Fetch available slots when date changes
  const handleDateChange = async (date) => {
    setFormData(prev => ({ ...prev, appointmentDate: date, startTime: '', endTime: '' }));
    if (!date) return;

    setLoading(true);
    try {
      const slots = await getAvailableSlots(date);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Failed to load available times');
    } finally {
      setLoading(false);
    }
  };

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setFormData(prev => ({
      ...prev,
      startTime: slot.start,
      endTime: slot.end
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerEmail || !formData.appointmentDate || !formData.startTime) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onCreate(formData);
      onClose();
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Failed to create appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary-green text-white p-4 rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaPlus /> Create New Appointment
          </h2>
          <p className="text-sm text-green-100 mt-1">
            Manually schedule an appointment for a patient
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                placeholder="e.g., 0812345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consultation Type *
              </label>
              <select
                value={formData.consultationType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                {consultationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - R{type.price}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Date *
            </label>
            <input
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              required
            />
          </div>

          {/* Time Slots */}
          {formData.appointmentDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Time Slots *
              </label>
              {loading ? (
                <div className="text-center py-4">
                  <FaSpinner className="animate-spin text-2xl text-primary-green mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Loading times...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                  No available times for this date
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`py-2 px-3 text-sm rounded-lg border transition-colors
                        ${formData.startTime === slot.start
                          ? 'bg-primary-green text-white border-primary-green'
                          : 'border-gray-200 hover:border-primary-green hover:bg-green-50'
                        }
                      `}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (R)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              rows="2"
              placeholder="Any additional notes about this appointment..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.startTime}
              className="flex-1 py-2 px-4 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FaPlus />
                  Create Appointment
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Reschedule Modal Component
const RescheduleModal = ({ appointment, onClose, onReschedule }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState([]);
  const [error, setError] = useState('');

  // Fetch calendar settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getCalendarSettings();
        if (settings?.blockedDates) {
          setBlockedDates(settings.blockedDates);
        }
      } catch (err) {
        console.error('Error fetching calendar settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isPastDate = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isBlockedDate = (date) => {
    if (!date || blockedDates.length === 0) return false;
    const dateStr = formatDateForAPI(date);
    return blockedDates.some(blocked => {
      if (typeof blocked === 'string') return blocked === dateStr;
      const blockedDateStr = blocked.date ? blocked.date.split('T')[0] : null;
      return blockedDateStr === dateStr;
    });
  };

  const isUnavailable = (date) => isPastDate(date) || isBlockedDate(date);

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDateSelect = async (date) => {
    if (isUnavailable(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setError('');
    setLoading(true);

    try {
      const dateStr = formatDateForAPI(date);
      const slots = await getAvailableSlots(dateStr);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Failed to load available times');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot) return;
    setSaving(true);
    setError('');

    try {
      const dateStr = formatDateForAPI(selectedDate);
      await onReschedule(appointment, dateStr, selectedSlot.start, selectedSlot.end);
      onClose();
    } catch (err) {
      console.error('Error rescheduling:', err);
      setError('Failed to reschedule appointment');
    } finally {
      setSaving(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isPrevMonthDisabled = () => {
    const today = new Date();
    return currentMonth.getFullYear() === today.getFullYear() &&
           currentMonth.getMonth() <= today.getMonth();
  };

  const calendarDays = generateCalendarDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary-green text-white p-4 rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaEdit /> Reschedule Appointment
          </h2>
          <p className="text-sm text-green-100 mt-1">
            {appointment.customer_name} - Current: {new Date(appointment.appointment_date).toLocaleDateString('en-ZA')} at {appointment.start_time.substring(0, 5)}
          </p>
        </div>

        <div className="p-4">
          {/* Calendar */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                onClick={goToPreviousMonth}
                disabled={isPrevMonthDisabled()}
              >
                <FaChevronLeft />
              </button>
              <h3 className="font-semibold">{monthName}</h3>
              <button
                type="button"
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                onClick={goToNextMonth}
              >
                <FaChevronRight />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((date, index) => (
                <button
                  key={index}
                  type="button"
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                    ${!date ? 'invisible' : ''}
                    ${isPastDate(date) ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${isBlockedDate(date) ? 'bg-red-100 text-red-400 cursor-not-allowed line-through' : ''}
                    ${isToday(date) && !isSelected(date) ? 'border-2 border-primary-green' : ''}
                    ${isSelected(date) ? 'bg-primary-green text-white' : ''}
                    ${!isUnavailable(date) && !isSelected(date) ? 'hover:bg-green-100 cursor-pointer' : ''}
                  `}
                  onClick={() => date && handleDateSelect(date)}
                  disabled={!date || isUnavailable(date)}
                >
                  {date?.getDate()}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaClock className="text-primary-green" />
                Available times for {selectedDate.toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h4>

              {loading ? (
                <div className="text-center py-4">
                  <FaSpinner className="animate-spin text-2xl text-primary-green mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Loading times...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No available times for this date
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`py-2 px-3 text-sm rounded-lg border transition-colors
                        ${selectedSlot?.start === slot.start
                          ? 'bg-primary-green text-white border-primary-green'
                          : 'border-gray-200 hover:border-primary-green hover:bg-green-50'
                        }
                      `}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Selected Summary */}
          {selectedDate && selectedSlot && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800">
                <strong>New appointment:</strong> {selectedDate.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedSlot.start}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedSlot || saving}
              className="flex-1 py-2 px-4 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FaCheck />
                  Confirm Reschedule
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Inner component that uses AdminContext
const AdminAppointmentsContent = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'cancelled'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'virtual', 'telephonic', 'face_to_face'
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAllConsultationBookings();
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointment, newStatus) => {
    try {
      await updateConsultationBookingStatus(appointment.id, newStatus);

      // Trigger webhook for no_show or completed
      if (newStatus === 'no_show') {
        await triggerMakeWebhook('no_show', { ...appointment, appointment_status: newStatus });
      } else if (newStatus === 'completed') {
        await triggerMakeWebhook('completed', { ...appointment, appointment_status: newStatus });
      }

      loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment status');
    }
  };

  const handleCancel = async (appointment) => {
    if (!confirm(`Cancel appointment for ${appointment.customer_name}? The customer will need to rebook.`)) return;

    try {
      await cancelConsultationBooking(appointment.id);
      loadAppointments();
    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert('Failed to cancel appointment');
    }
  };

  const handleReschedule = async (appointment, newDate, newStartTime, newEndTime) => {
    try {
      // Store previous date/time for the webhook
      const previousDate = appointment.appointment_date;
      const previousStartTime = appointment.start_time;
      const previousEndTime = appointment.end_time;

      await rescheduleConsultationBooking(appointment.id, newDate, newStartTime, newEndTime);

      // Trigger webhook for rescheduled
      await triggerMakeWebhook('rescheduled', {
        ...appointment,
        appointment_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        previous_date: previousDate,
        previous_start_time: previousStartTime,
        previous_end_time: previousEndTime
      });

      loadAppointments();
      alert('Appointment rescheduled successfully! The patient will receive an email notification.');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  };

  const handleCreateAppointment = async (formData) => {
    try {
      const newAppointment = await createManualAppointment(formData);

      // Trigger webhook for created appointment
      if (newAppointment) {
        await triggerMakeWebhook('created', newAppointment);
      }

      loadAppointments();
      alert('Appointment created successfully!');
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = new Date(apt.appointment_date);
    aptDate.setHours(0, 0, 0, 0);

    // Status filter
    if (filter === 'upcoming' && (aptDate < today || apt.appointment_status === 'cancelled')) return false;
    if (filter === 'past' && (aptDate >= today || apt.appointment_status === 'cancelled')) return false;
    if (filter === 'cancelled' && apt.appointment_status !== 'cancelled') return false;

    // Type filter
    if (typeFilter !== 'all' && apt.consultation_type !== typeFilter) return false;

    return true;
  });

  // Stats
  const stats = {
    total: appointments.filter(a => a.appointment_status !== 'cancelled').length,
    upcoming: appointments.filter(a => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aptDate = new Date(a.appointment_date);
      return aptDate >= today && a.appointment_status !== 'cancelled';
    }).length,
    revenue: appointments.filter(a => a.appointment_status !== 'cancelled').reduce((sum, a) => sum + parseFloat(a.price || 0), 0),
    virtual: appointments.filter(a => a.consultation_type === 'virtual' && a.appointment_status !== 'cancelled').length,
    telephonic: appointments.filter(a => a.consultation_type === 'telephonic' && a.appointment_status !== 'cancelled').length,
    faceToFace: appointments.filter(a => a.consultation_type === 'face_to_face' && a.appointment_status !== 'cancelled').length
  };

  // Get consultation type info
  const getTypeInfo = (type) => {
    const info = {
      'virtual': { icon: <FaVideo />, color: 'text-green-600', bg: 'bg-green-100', label: 'Virtual' },
      'telephonic': { icon: <FaPhone />, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Telephonic' },
      'face_to_face': { icon: <FaUserMd />, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Face-to-Face' }
    };
    return info[type] || info['virtual'];
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const styles = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no_show': 'bg-yellow-100 text-yellow-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if appointment is today
  const isToday = (dateStr) => {
    const today = new Date();
    const aptDate = new Date(dateStr);
    return today.toDateString() === aptDate.toDateString();
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      <AnimatePresence>
        {rescheduleAppointment && (
          <RescheduleModal
            appointment={rescheduleAppointment}
            onClose={() => setRescheduleAppointment(null)}
            onReschedule={handleReschedule}
          />
        )}
        {showCreateModal && (
          <CreateAppointmentModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateAppointment}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage all consultation appointments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaPlus />
          New Appointment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-primary-green">R{stats.revenue.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Revenue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{stats.virtual}</div>
          <div className="text-sm text-gray-600">Virtual</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{stats.telephonic}</div>
          <div className="text-sm text-gray-600">Telephonic</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">{stats.faceToFace}</div>
          <div className="text-sm text-gray-600">Face-to-Face</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'upcoming', 'past', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="border-l pl-4 flex flex-wrap gap-2">
          {['all', 'virtual', 'telephonic', 'face_to_face'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                typeFilter === t
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t !== 'all' && <span className={typeFilter === t ? 'text-white' : getTypeInfo(t).color}>{getTypeInfo(t).icon}</span>}
              {t === 'all' ? 'All Types' : getTypeInfo(t).label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
            <p className="mt-4 text-gray-600">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className={`hover:bg-gray-50 ${isToday(appointment.appointment_date) ? 'bg-yellow-50' : ''}`}
                  >
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
                        {appointment.customer_phone && (
                          <div className="text-gray-500 flex items-center gap-2 mt-1">
                            <FaPhone className="text-xs" />
                            {appointment.customer_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${getTypeInfo(appointment.consultation_type).bg}`}>
                          <span className={getTypeInfo(appointment.consultation_type).color}>
                            {getTypeInfo(appointment.consultation_type).icon}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {getTypeInfo(appointment.consultation_type).label}
                          </div>
                          {appointment.location && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <FaMapMarkerAlt />
                              {appointment.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className={`font-medium ${isToday(appointment.appointment_date) ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {isToday(appointment.appointment_date) && (
                            <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded mr-2">TODAY</span>
                          )}
                          {formatDate(appointment.appointment_date)}
                        </div>
                        <div className="text-gray-500 flex items-center gap-1 mt-1">
                          <FaClock className="text-xs" />
                          {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-primary-green">
                        R{appointment.price}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(appointment.appointment_status)}`}>
                        {appointment.appointment_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {appointment.appointment_status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => setRescheduleAppointment(appointment)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Reschedule appointment"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(appointment, 'completed')}
                              className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark as completed"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(appointment, 'no_show')}
                              className="p-2 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Mark as no show"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                      </div>
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
