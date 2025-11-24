// Google Calendar API Client
// This file makes API calls to the backend server which handles Google Calendar operations

const API_BASE_URL = 'http://localhost:3001/api/calendar';

/**
 * Initialize Google Calendar API authentication
 * No longer needed since the backend handles authentication
 */
export const initializeCalendarAuth = (credentials) => {
  console.log('✅ Google Calendar authentication handled by backend server');
  return true;
};

/**
 * Check if a time slot is available on Google Calendar
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format
 * @param {number} duration - Duration in minutes (default: 30)
 * @returns {Promise<boolean>} - True if available, false if booked
 */
export const isTimeSlotAvailable = async (date, time, duration = 30) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/check-availability?date=${date}&time=${time}&duration=${duration}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`🔍 Time slot ${date} ${time}: ${data.available ? 'AVAILABLE' : 'BOOKED'}`);

    return data.available;
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    throw error;
  }
};

/**
 * Get all booked time slots for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of booked time slots
 */
export const getBookedTimeSlotsForDate = async (date) => {
  try {
    const response = await fetch(`${API_BASE_URL}/booked-slots?date=${date}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📅 Found ${data.bookedSlots.length} booked slots for ${date}:`, data.bookedSlots);

    return data.bookedSlots;
  } catch (error) {
    console.error('Error fetching booked time slots:', error);
    throw error;
  }
};

/**
 * Create a new appointment in Google Calendar
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise<Object>} - Created event data
 */
export const createCalendarEvent = async (appointmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Calendar event created:', data.eventId);

    return data.event;
  } catch (error) {
    console.error('❌ Error creating calendar event:', error);
    throw error;
  }
};

/**
 * Update an existing calendar event
 * @param {string} eventId - Google Calendar event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated event data
 */
export const updateCalendarEvent = async (eventId, updates) => {
  console.warn('updateCalendarEvent not yet implemented in backend API');
  return null;
};

/**
 * Cancel/Delete a calendar event
 * @param {string} eventId - Google Calendar event ID
 * @returns {Promise<boolean>} - Success status
 */
export const cancelCalendarEvent = async (eventId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cancel-event/${eventId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Calendar event cancelled:', eventId);

    return data.success;
  } catch (error) {
    console.error('❌ Error cancelling calendar event:', error);
    throw error;
  }
};
