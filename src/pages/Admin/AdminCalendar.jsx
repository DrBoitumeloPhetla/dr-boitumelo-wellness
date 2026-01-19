import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import {
  FaCalendarAlt,
  FaClock,
  FaBan,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { getCalendarSettings, updateCalendarSettings } from '../../lib/supabase';
import 'react-datepicker/dist/react-datepicker.css';

const AdminCalendar = () => {
  const [workingHours, setWorkingHours] = useState({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '13:00' },
  });

  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [blockedReason, setBlockedReason] = useState('');
  const [timeSlotDuration, setTimeSlotDuration] = useState(30);
  const [breakTimes, setBreakTimes] = useState([
    { start: '13:00', end: '14:00', label: 'Lunch Break' }
  ]);
  const [blockedTimeSlots, setBlockedTimeSlots] = useState([]);
  const [selectedBlockDate, setSelectedBlockDate] = useState(null);
  const [selectedBlockTime, setSelectedBlockTime] = useState({ start: '09:00', end: '10:00' });
  const [blockTimeReason, setBlockTimeReason] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Collapsible sections state
  const [showBlockedDates, setShowBlockedDates] = useState(false);
  const [showBlockedTimeSlots, setShowBlockedTimeSlots] = useState(false);

  // Refs to track current values for auto-save
  const settingsRef = useRef({});

  // Load settings from Supabase on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Update ref when state changes
  useEffect(() => {
    settingsRef.current = {
      workingHours,
      blockedDates,
      timeSlotDuration,
      breakTimes,
      blockedTimeSlots,
    };
  }, [workingHours, blockedDates, timeSlotDuration, breakTimes, blockedTimeSlots]);

  const loadSettings = async () => {
    try {
      const settings = await getCalendarSettings();
      setWorkingHours(settings.workingHours);
      setBlockedDates(settings.blockedDates || []);
      setTimeSlotDuration(settings.timeSlotDuration);
      setBreakTimes(settings.breakTimes || []);
      setBlockedTimeSlots(settings.blockedTimeSlots || []);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading calendar settings:', error);
      setIsLoaded(true);
    }
  };

  // Auto-save helper
  const autoSave = async (newSettings, message) => {
    try {
      await updateCalendarSettings(newSettings);
      setSaveMessage(message);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error auto-saving:', error);
      setSaveMessage('Error saving changes');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Helper to format date as YYYY-MM-DD in local timezone (avoids UTC shift)
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // South African Public Holidays 2025
  const saPublicHolidays2025 = [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-03-21', name: 'Human Rights Day' },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-04-21', name: 'Family Day' },
    { date: '2025-04-27', name: 'Freedom Day' },
    { date: '2025-05-01', name: "Workers' Day" },
    { date: '2025-06-16', name: 'Youth Day' },
    { date: '2025-08-09', name: "National Women's Day" },
    { date: '2025-09-24', name: 'Heritage Day' },
    { date: '2025-12-16', name: 'Day of Reconciliation' },
    { date: '2025-12-25', name: 'Christmas Day' },
    { date: '2025-12-26', name: 'Day of Goodwill' },
  ];

  const addSAPublicHolidays = async () => {
    const currentYear = new Date().getFullYear();
    const holidays = saPublicHolidays2025.map(holiday => ({
      id: `holiday-${holiday.date.replace('2025', String(currentYear))}`,
      date: holiday.date.replace('2025', String(currentYear)) + 'T00:00:00.000Z',
      reason: `SA Public Holiday: ${holiday.name}`,
      createdAt: new Date().toISOString(),
      isHoliday: true,
    }));

    const existingDates = blockedDates.map(d => d.date.split('T')[0]);
    const newHolidays = holidays.filter(h => !existingDates.includes(h.date.split('T')[0]));

    if (newHolidays.length === 0) {
      setSaveMessage('All public holidays are already blocked!');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    const updatedBlockedDates = [...blockedDates, ...newHolidays];
    setBlockedDates(updatedBlockedDates);

    await autoSave({
      ...settingsRef.current,
      blockedDates: updatedBlockedDates,
    }, `${newHolidays.length} public holidays added!`);
  };

  // Working hours change with auto-save
  const handleWorkingHoursChange = async (day, field, value) => {
    const newWorkingHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day],
        [field]: value,
      },
    };
    setWorkingHours(newWorkingHours);

    if (isLoaded) {
      await autoSave({
        ...settingsRef.current,
        workingHours: newWorkingHours,
      }, 'Working hours updated!');
    }
  };

  // Time slot duration change with auto-save
  const handleDurationChange = async (value) => {
    const newDuration = parseInt(value);
    setTimeSlotDuration(newDuration);

    if (isLoaded) {
      await autoSave({
        ...settingsRef.current,
        timeSlotDuration: newDuration,
      }, 'Appointment duration updated!');
    }
  };

  // Break times with auto-save
  const addBreakTime = async () => {
    const newBreakTimes = [
      ...breakTimes,
      { start: '12:00', end: '13:00', label: 'Break' }
    ];
    setBreakTimes(newBreakTimes);

    await autoSave({
      ...settingsRef.current,
      breakTimes: newBreakTimes,
    }, 'Break time added!');
  };

  const removeBreakTime = async (index) => {
    const newBreakTimes = breakTimes.filter((_, i) => i !== index);
    setBreakTimes(newBreakTimes);

    await autoSave({
      ...settingsRef.current,
      breakTimes: newBreakTimes,
    }, 'Break time removed!');
  };

  const updateBreakTime = async (index, field, value) => {
    const updated = [...breakTimes];
    updated[index][field] = value;
    setBreakTimes(updated);

    await autoSave({
      ...settingsRef.current,
      breakTimes: updated,
    }, 'Break time updated!');
  };

  // Blocked dates with auto-save
  const addBlockedDate = async () => {
    if (!selectedDate) return;

    const newBlockedDate = {
      id: Date.now().toString(),
      date: formatDateLocal(selectedDate) + 'T00:00:00.000Z',
      reason: blockedReason || 'Unavailable',
      createdAt: new Date().toISOString(),
    };

    const updatedBlockedDates = [...blockedDates, newBlockedDate];
    setBlockedDates(updatedBlockedDates);
    setSelectedDate(null);
    setBlockedReason('');

    await autoSave({
      ...settingsRef.current,
      blockedDates: updatedBlockedDates,
    }, 'Date blocked!');
  };

  const removeBlockedDate = async (id) => {
    const updatedBlockedDates = blockedDates.filter(d => d.id !== id);
    setBlockedDates(updatedBlockedDates);

    await autoSave({
      ...settingsRef.current,
      blockedDates: updatedBlockedDates,
    }, 'Date unblocked!');
  };

  // Blocked time slots with auto-save
  const addBlockedTimeSlot = async () => {
    if (!selectedBlockDate) return;

    const newBlockedSlot = {
      id: Date.now().toString(),
      date: formatDateLocal(selectedBlockDate) + 'T00:00:00.000Z',
      startTime: selectedBlockTime.start,
      endTime: selectedBlockTime.end,
      reason: blockTimeReason || 'Unavailable',
      createdAt: new Date().toISOString(),
    };

    const updatedBlockedTimeSlots = [...blockedTimeSlots, newBlockedSlot];
    setBlockedTimeSlots(updatedBlockedTimeSlots);
    setSelectedBlockDate(null);
    setSelectedBlockTime({ start: '09:00', end: '10:00' });
    setBlockTimeReason('');

    await autoSave({
      ...settingsRef.current,
      blockedTimeSlots: updatedBlockedTimeSlots,
    }, 'Time slot blocked!');
  };

  const removeBlockedTimeSlot = async (id) => {
    const updatedBlockedTimeSlots = blockedTimeSlots.filter(s => s.id !== id);
    setBlockedTimeSlots(updatedBlockedTimeSlots);

    await autoSave({
      ...settingsRef.current,
      blockedTimeSlots: updatedBlockedTimeSlots,
    }, 'Time slot unblocked!');
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-montserrat font-bold text-dark-text mb-2">
            Calendar Settings
          </h1>
          <p className="text-gray-600">Manage appointment availability and time slots. All changes are saved automatically.</p>
        </div>

        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2"
          >
            <FaCheckCircle />
            <span>{saveMessage}</span>
          </motion.div>
        )}

        {/* Time Slot Duration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-montserrat font-bold text-dark-text mb-4 flex items-center space-x-2">
            <FaClock className="text-primary-green" />
            <span>Appointment Duration</span>
          </h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time slot duration (minutes)
            </label>
            <select
              value={timeSlotDuration}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-montserrat font-bold text-dark-text mb-4 flex items-center space-x-2">
            <FaCalendarAlt className="text-primary-green" />
            <span>Working Hours</span>
          </h2>
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day} className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 md:w-40">
                  <input
                    type="checkbox"
                    checked={workingHours[day].enabled}
                    onChange={(e) => handleWorkingHoursChange(day, 'enabled', e.target.checked)}
                    className="w-5 h-5 text-primary-green focus:ring-primary-green rounded"
                  />
                  <span className="font-medium capitalize text-dark-text">{day}</span>
                </div>

                {workingHours[day].enabled ? (
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">From:</label>
                      <input
                        type="time"
                        value={workingHours[day].start}
                        onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                    <span className="text-gray-500">to</span>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">To:</label>
                      <input
                        type="time"
                        value={workingHours[day].end}
                        onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 italic">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Break Times */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-montserrat font-bold text-dark-text flex items-center space-x-2">
              <FaClock className="text-primary-gold" />
              <span>Break Times</span>
            </h2>
            <button
              onClick={addBreakTime}
              className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
            >
              <FaPlus />
              <span>Add Break</span>
            </button>
          </div>
          <div className="space-y-3">
            {breakTimes.map((breakTime, index) => (
              <div key={index} className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={breakTime.label}
                  onChange={(e) => updateBreakTime(index, 'label', e.target.value)}
                  placeholder="Break label"
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-green focus:border-transparent md:w-40"
                />
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">From:</label>
                  <input
                    type="time"
                    value={breakTime.start}
                    onChange={(e) => updateBreakTime(index, 'start', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                </div>
                <span className="text-gray-500">to</span>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">To:</label>
                  <input
                    type="time"
                    value={breakTime.end}
                    onChange={(e) => updateBreakTime(index, 'end', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => removeBreakTime(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center space-x-2"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            {breakTimes.length === 0 && (
              <p className="text-gray-500 text-center py-4">No break times set</p>
            )}
          </div>
        </div>

        {/* Blocked Dates - Collapsible */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <button
            onClick={() => setShowBlockedDates(!showBlockedDates)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-montserrat font-bold text-dark-text flex items-center space-x-2">
              <FaBan className="text-red-500" />
              <span>Blocked Dates (Full Day)</span>
              {blockedDates.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-sm px-2 py-1 rounded-full">
                  {blockedDates.length}
                </span>
              )}
            </h2>
            {showBlockedDates ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
          </button>

          {showBlockedDates && (
            <div className="p-6 pt-0 border-t">
              <div className="flex justify-end mb-4">
                <button
                  onClick={addSAPublicHolidays}
                  className="px-4 py-2 bg-primary-gold text-white rounded-lg hover:bg-opacity-90 flex items-center space-x-2 text-sm"
                >
                  <FaPlus />
                  <span>Add SA Public Holidays</span>
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-dark-text mb-4">Block a Full Day</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      minDate={new Date()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      placeholderText="Pick a date"
                      dateFormat="MMMM d, yyyy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (optional)
                    </label>
                    <input
                      type="text"
                      value={blockedReason}
                      onChange={(e) => setBlockedReason(e.target.value)}
                      placeholder="e.g., Personal day, Conference"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addBlockedDate}
                      disabled={!selectedDate}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <FaPlus />
                      <span>Block Date</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-dark-text mb-3">Currently Blocked Dates</h3>
                {blockedDates.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No blocked dates</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {blockedDates.sort((a, b) => new Date(a.date) - new Date(b.date)).map((blocked) => (
                      <div
                        key={blocked.id}
                        className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-dark-text">
                            {new Date(blocked.date).toLocaleDateString('en-ZA', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-600">{blocked.reason}</p>
                        </div>
                        <button
                          onClick={() => removeBlockedDate(blocked.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center space-x-2"
                        >
                          <FaTrash />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Blocked Time Slots - Collapsible */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <button
            onClick={() => setShowBlockedTimeSlots(!showBlockedTimeSlots)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-montserrat font-bold text-dark-text flex items-center space-x-2">
              <FaClock className="text-orange-500" />
              <span>Blocked Time Slots (Specific Times)</span>
              {blockedTimeSlots.length > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-600 text-sm px-2 py-1 rounded-full">
                  {blockedTimeSlots.length}
                </span>
              )}
            </h2>
            {showBlockedTimeSlots ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
          </button>

          {showBlockedTimeSlots && (
            <div className="p-6 pt-0 border-t">
              <p className="text-sm text-gray-600 mb-4">
                Block specific time slots on a particular date (e.g., doctor has a meeting from 10:00-11:00 on March 15th)
              </p>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-dark-text mb-4">Block Specific Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <DatePicker
                      selected={selectedBlockDate}
                      onChange={(date) => setSelectedBlockDate(date)}
                      minDate={new Date()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      placeholderText="Pick a date"
                      dateFormat="MMMM d, yyyy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={selectedBlockTime.start}
                      onChange={(e) => setSelectedBlockTime({ ...selectedBlockTime, start: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={selectedBlockTime.end}
                      onChange={(e) => setSelectedBlockTime({ ...selectedBlockTime, end: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (optional)
                    </label>
                    <input
                      type="text"
                      value={blockTimeReason}
                      onChange={(e) => setBlockTimeReason(e.target.value)}
                      placeholder="e.g., Meeting, Emergency"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addBlockedTimeSlot}
                      disabled={!selectedBlockDate}
                      className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <FaPlus />
                      <span>Block Time</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-dark-text mb-3">Currently Blocked Time Slots</h3>
                {blockedTimeSlots.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No blocked time slots</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {blockedTimeSlots.sort((a, b) => new Date(a.date) - new Date(b.date)).map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-dark-text">
                            {new Date(slot.date).toLocaleDateString('en-ZA', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {slot.startTime} - {slot.endTime} - {slot.reason}
                          </p>
                        </div>
                        <button
                          onClick={() => removeBlockedTimeSlot(slot.id)}
                          className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center space-x-2"
                        >
                          <FaTrash />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCalendar;
