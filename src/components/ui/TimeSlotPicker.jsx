import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaClock, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getAvailableSlots, reserveTimeSlot, cancelReservation, getCalendarSettings } from '../../lib/supabase';

const TimeSlotPicker = ({ onSlotSelected, sessionId }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservationId, setReservationId] = useState(null);
  const [error, setError] = useState('');
  const [blockedDates, setBlockedDates] = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Fetch calendar settings (blocked dates) on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getCalendarSettings();
        console.log('Full calendar settings:', JSON.stringify(settings, null, 2));
        if (settings && settings.blockedDates && settings.blockedDates.length > 0) {
          console.log('Blocked dates found:', settings.blockedDates);
          setBlockedDates(settings.blockedDates);
        } else {
          console.log('No blocked dates in settings');
        }
      } catch (err) {
        console.error('Error fetching calendar settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  // Generate calendar days for current month view
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0 = Sunday

    const days = [];

    // Add padding for days before the 1st
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Format date for API (YYYY-MM-DD) - defined early as it's used by other functions
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a date is in the past
  const isPastDate = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if a date is blocked
  const isBlockedDate = (date) => {
    if (!date || blockedDates.length === 0) return false;
    const dateStr = formatDateForAPI(date);

    // blockedDates is an array of objects with { id, date, reason }
    // where date is an ISO string like "2026-01-23T00:00:00.000Z"
    return blockedDates.some(blocked => {
      // Handle both string format and object format
      if (typeof blocked === 'string') {
        return blocked === dateStr;
      }
      // Extract date portion from ISO string
      const blockedDateStr = blocked.date ? blocked.date.split('T')[0] : null;
      return blockedDateStr === dateStr;
    });
  };

  // Check if date is unavailable (past or blocked)
  const isUnavailable = (date) => {
    return isPastDate(date) || isBlockedDate(date);
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fetch available slots when date is selected
  const fetchAvailableSlots = useCallback(async (date) => {
    if (!date) return;

    setLoading(true);
    setError('');
    setAvailableSlots([]);

    try {
      const dateStr = formatDateForAPI(date);
      const slots = await getAvailableSlots(dateStr);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Failed to load available times. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle date selection
  const handleDateSelect = async (date) => {
    if (isUnavailable(date)) return;

    // Cancel existing reservation if any
    if (reservationId) {
      try {
        await cancelReservation(reservationId);
      } catch (err) {
        console.error('Error canceling reservation:', err);
      }
      setReservationId(null);
    }

    setSelectedDate(date);
    setSelectedSlot(null);
    onSlotSelected(null); // Clear parent selection
    fetchAvailableSlots(date);
  };

  // Handle time slot selection - reserve immediately
  const handleSlotSelect = async (slot) => {
    if (reserving) return;

    setReserving(true);
    setError('');

    try {
      // Cancel existing reservation if any
      if (reservationId) {
        await cancelReservation(reservationId);
      }

      // Reserve the new slot
      const dateStr = formatDateForAPI(selectedDate);
      const reservation = await reserveTimeSlot(dateStr, slot.start, slot.end, sessionId);

      if (reservation) {
        setReservationId(reservation.id);
        setSelectedSlot(slot);
        onSlotSelected({
          date: selectedDate,
          dateStr: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          reservationId: reservation.id
        });
      } else {
        setError('This slot was just taken. Please select another time.');
        fetchAvailableSlots(selectedDate); // Refresh slots
      }
    } catch (err) {
      console.error('Error reserving slot:', err);
      setError('Failed to reserve time slot. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Check if previous month button should be disabled
  const isPrevMonthDisabled = () => {
    const today = new Date();
    return currentMonth.getFullYear() === today.getFullYear() &&
           currentMonth.getMonth() <= today.getMonth();
  };

  const calendarDays = generateCalendarDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  return (
    <div className="time-slot-picker">
      {/* Calendar Section */}
      <div className="calendar-section">
        <div className="calendar-header">
          <button
            type="button"
            className="month-nav-btn"
            onClick={goToPreviousMonth}
            disabled={isPrevMonthDisabled()}
          >
            <FaChevronLeft />
          </button>
          <h3>{monthName}</h3>
          <button
            type="button"
            className="month-nav-btn"
            onClick={goToNextMonth}
          >
            <FaChevronRight />
          </button>
        </div>

        <div className="calendar-grid">
          {/* Day names header */}
          {dayNames.map(day => (
            <div key={day} className="day-name">{day}</div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => (
            <button
              key={index}
              type="button"
              className={`calendar-day ${!date ? 'empty' : ''} ${isPastDate(date) ? 'past' : ''} ${isBlockedDate(date) ? 'blocked' : ''} ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''}`}
              onClick={() => date && handleDateSelect(date)}
              disabled={!date || isUnavailable(date)}
            >
              {date ? date.getDate() : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots Section */}
      {selectedDate && (
        <div className="time-slots-section">
          <h4>
            <FaClock /> Available times for {formatDate(selectedDate)}
          </h4>

          {loading ? (
            <div className="loading-slots">
              <FaSpinner className="spin" /> Loading available times...
            </div>
          ) : error ? (
            <div className="slots-error">{error}</div>
          ) : availableSlots.length === 0 ? (
            <div className="no-slots">
              No available times for this date. Please select another date.
            </div>
          ) : (
            <div className="slots-grid">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  className={`time-slot ${selectedSlot?.start === slot.start ? 'selected' : ''}`}
                  onClick={() => handleSlotSelect(slot)}
                  disabled={reserving}
                >
                  {slot.start}
                </button>
              ))}
            </div>
          )}

          {reserving && (
            <div className="reserving-message">
              <FaSpinner className="spin" /> Reserving your time slot...
            </div>
          )}
        </div>
      )}

      {/* Selected slot confirmation */}
      {selectedSlot && (
        <div className="selected-slot-info">
          <FaCalendarAlt />
          <span>
            <strong>{formatDate(selectedDate)}</strong> at <strong>{selectedSlot.start}</strong>
          </span>
          <span className="slot-reserved-badge">Reserved for 10 minutes</span>
        </div>
      )}

      <style>{`
        .time-slot-picker {
          width: 100%;
        }

        .calendar-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .calendar-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #333;
        }

        .month-nav-btn {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .month-nav-btn:hover:not(:disabled) {
          background: #8B7355;
          color: white;
          border-color: #8B7355;
        }

        .month-nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
        }

        .day-name {
          text-align: center;
          font-weight: 600;
          font-size: 0.75rem;
          color: #666;
          padding: 8px 0;
        }

        .calendar-day {
          aspect-ratio: 1;
          border: none;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-day:hover:not(:disabled):not(.empty) {
          background: #8B7355;
          color: white;
        }

        .calendar-day.empty {
          background: transparent;
          cursor: default;
        }

        .calendar-day.past {
          color: #ccc;
          cursor: not-allowed;
        }

        .calendar-day.blocked {
          background: #f0f0f0;
          color: #999;
          cursor: not-allowed;
          text-decoration: line-through;
          position: relative;
        }

        .calendar-day.blocked::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 2px;
          background: #dc3545;
          transform: rotate(-45deg);
        }

        .calendar-day.today {
          border: 2px solid #8B7355;
          font-weight: 600;
        }

        .calendar-day.selected {
          background: #8B7355;
          color: white;
          font-weight: 600;
        }

        .time-slots-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .time-slots-section h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 15px 0;
          font-size: 1rem;
          color: #333;
        }

        .loading-slots, .no-slots, .slots-error {
          text-align: center;
          padding: 20px;
          color: #666;
        }

        .slots-error {
          color: #dc3545;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        @media (max-width: 480px) {
          .slots-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .time-slot {
          padding: 12px 8px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .time-slot:hover:not(:disabled) {
          border-color: #8B7355;
          background: #faf8f5;
        }

        .time-slot.selected {
          background: #8B7355;
          color: white;
          border-color: #8B7355;
          font-weight: 600;
        }

        .time-slot:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reserving-message {
          text-align: center;
          padding: 10px;
          color: #8B7355;
          font-size: 0.9rem;
        }

        .selected-slot-info {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #e8f5e9;
          border: 1px solid #4caf50;
          border-radius: 8px;
          padding: 15px;
          color: #2e7d32;
          flex-wrap: wrap;
        }

        .slot-reserved-badge {
          background: #4caf50;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          margin-left: auto;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TimeSlotPicker;
