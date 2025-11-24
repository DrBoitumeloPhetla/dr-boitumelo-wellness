import { createClient } from '@supabase/supabase-js';
import { getBookedTimeSlotsForDate, createCalendarEvent, cancelCalendarEvent } from './googleCalendar';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Google Calendar integration is now handled by backend server (localhost:3001)
console.log('✅ Google Calendar integration via backend API')

// Helper functions for database operations

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Add or update client when they make a purchase or book appointment
 */
const addOrUpdateClientFromOrder = async (customerData, source = 'order') => {
  try {
    // Check if client already exists by email
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', customerData.email)
      .maybeSingle(); // Use maybeSingle() instead of single() - returns null if not found

    if (existingClient) {
      // Update existing client - upgrade from lead to customer if they made a purchase
      const updates = {
        name: customerData.name,
        phone: customerData.phone || existingClient.phone,
        address: customerData.address || existingClient.address,
        city: customerData.city || existingClient.city,
        postal_code: customerData.postalCode || existingClient.postal_code
      };

      // If source is order, upgrade to customer
      if (source === 'order' && existingClient.client_type === 'lead') {
        updates.client_type = 'customer';
      }

      const { error: updateError } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', existingClient.id);

      if (updateError) {
        console.error('Error updating client:', updateError);
      } else {
        console.log(`✅ Client updated: ${customerData.email}`);
      }
    } else {
      // Create new client
      const { error: insertError } = await supabase
        .from('clients')
        .insert([{
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          city: customerData.city,
          postal_code: customerData.postalCode,
          client_type: source === 'order' ? 'customer' : 'lead',
          status: 'active',
          source: source,
          notes: customerData.notes
        }]);

      if (insertError) {
        console.error('Error creating client:', insertError);
      } else {
        console.log(`✅ New client created: ${customerData.email} (${source === 'order' ? 'customer' : 'lead'})`);
      }
    }
  } catch (error) {
    console.error('Error adding/updating client:', error);
    // Don't throw - we don't want to block order/appointment creation if client sync fails
  }
};

/**
 * Save abandoned cart/booking lead to clients table
 * Only creates if email doesn't exist - won't update existing clients
 */
export const saveAbandonedLead = async (leadData, type = 'abandoned_cart') => {
  try {
    // Check if client already exists by email
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', leadData.email)
      .maybeSingle(); // Use maybeSingle() instead of single() - returns null if not found

    // Only create if they don't exist yet
    if (!existingClient) {
      const { error: insertError } = await supabase
        .from('clients')
        .insert([{
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          address: leadData.address || null,
          city: leadData.city || null,
          postal_code: leadData.postalCode || null,
          client_type: 'lead',
          status: 'active',
          source: type,
          notes: `Abandoned ${type === 'abandoned_cart' ? 'cart' : 'booking'} - captured via webhook`
        }]);

      if (insertError) {
        console.error('Error creating abandoned lead:', insertError);
      } else {
        console.log(`✅ Abandoned lead saved to clients table: ${leadData.email}`);
      }
    } else {
      console.log(`ℹ️ Lead already exists in database: ${leadData.email}`);
    }
  } catch (error) {
    console.error('Error saving abandoned lead:', error);
    // Don't throw - we don't want to block webhook sending if this fails
  }
};

// ============================================
// ORDERS
// ============================================
export const createOrder = async (orderData) => {
  // First, add or update the client
  await addOrUpdateClientFromOrder({
    name: orderData.customer.name,
    email: orderData.customer.email,
    phone: orderData.customer.phone,
    address: orderData.customer.address,
    city: orderData.customer.city,
    postalCode: orderData.customer.postalCode,
    notes: orderData.customer.notes
  }, 'order');

  // Then create the order
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      order_id: orderData.id,
      customer_name: orderData.customer.name,
      customer_email: orderData.customer.email,
      customer_phone: orderData.customer.phone,
      customer_address: orderData.customer.address,
      customer_city: orderData.customer.city,
      customer_postal_code: orderData.customer.postalCode,
      customer_notes: orderData.customer.notes,
      items: orderData.items,
      total: orderData.total,
      status: orderData.status,
      order_date: orderData.orderDate
    }])
    .select();

  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }
  return data[0];
};

export const getAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('order_date', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  // Transform data to match frontend format
  return data.map(order => ({
    id: order.order_id,
    customer: {
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
      address: order.customer_address,
      city: order.customer_city,
      postalCode: order.customer_postal_code,
      notes: order.customer_notes
    },
    items: order.items,
    total: parseFloat(order.total),
    status: order.status,
    orderDate: order.order_date
  }));
};

export const updateOrderStatus = async (orderId, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('order_id', orderId)
    .select();

  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
  return data[0];
};

// ============================================
// APPOINTMENTS
// ============================================
export const createAppointment = async (appointmentData) => {
  // First, add or update the client as a lead
  await addOrUpdateClientFromOrder({
    name: appointmentData.name,
    email: appointmentData.email,
    phone: appointmentData.phone,
    notes: appointmentData.additionalNotes
  }, 'appointment');

  // Create event in Google Calendar via backend API
  let googleEventId = null;
  try {
    const calendarEvent = await createCalendarEvent({
      date: appointmentData.date,
      time: appointmentData.time,
      duration: 30, // Default 30 minutes
      clientName: appointmentData.name,
      clientEmail: appointmentData.email,
      serviceType: appointmentData.type || 'Consultation',
      notes: appointmentData.additionalNotes
    });
    googleEventId = calendarEvent.id;
    console.log('✅ Created Google Calendar event:', googleEventId);
  } catch (calError) {
    console.error('⚠️ Failed to create Google Calendar event:', calError);
    // Continue with appointment creation even if calendar fails
  }

  // Then create the appointment in Supabase
  const { data, error } = await supabase
    .from('appointments')
    .insert([{
      appointment_id: appointmentData.id,
      type: appointmentData.type,
      appointment_date: appointmentData.date,
      appointment_time: appointmentData.time,
      name: appointmentData.name,
      email: appointmentData.email,
      phone: appointmentData.phone,
      symptoms: appointmentData.symptoms,
      symptoms_start_date: appointmentData.symptomsStartDate,
      vitamin_d_test: appointmentData.vitaminDTest,
      additional_notes: appointmentData.additionalNotes,
      status: appointmentData.status,
      booked_at: appointmentData.bookedAt,
      google_event_id: googleEventId // Store Google Calendar event ID
    }])
    .select();

  if (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
  return data[0];
};

export const getAllAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('appointment_date', { ascending: true });

  if (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }

  // Transform data to match frontend format
  return data.map(apt => ({
    id: apt.appointment_id,
    type: apt.type,
    date: apt.appointment_date,
    time: apt.appointment_time,
    name: apt.name,
    email: apt.email,
    phone: apt.phone,
    symptoms: apt.symptoms,
    symptomsStartDate: apt.symptoms_start_date,
    vitaminDTest: apt.vitamin_d_test,
    additionalNotes: apt.additional_notes,
    status: apt.status,
    bookedAt: apt.booked_at
  }));
};

/**
 * Get booked time slots from Google Calendar for a specific date
 * This is the SOURCE OF TRUTH for time slot availability
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of booked time slots
 */
export const getBookedSlotsFromGoogleCalendar = async (date) => {
  try {
    const bookedSlots = await getBookedTimeSlotsForDate(date);
    console.log(`📅 Retrieved ${bookedSlots.length} booked slots from Google Calendar for ${date}`);
    return bookedSlots;
  } catch (error) {
    console.error('Error fetching from Google Calendar, falling back to Supabase:', error);
    // Fallback to Supabase on error
    const appointments = await getAllAppointments();
    return appointments
      .filter(apt => apt.date === date && (apt.status === 'pending' || apt.status === 'confirmed'))
      .map(apt => ({
        startTime: apt.time.substring(0, 5),
        endTime: apt.time,
        summary: apt.type
      }));
  }
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const { data, error} = await supabase
    .from('appointments')
    .update({ status })
    .eq('appointment_id', appointmentId)
    .select();

  if (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
  return data[0];
};

// ============================================
// CONTACTS
// ============================================
export const createContact = async (contactData) => {
  // First, add or update the client as a lead
  await addOrUpdateClientFromOrder({
    name: contactData.name,
    email: contactData.email,
    phone: contactData.phone,
    notes: `Service Interest: ${contactData.serviceType} - ${contactData.message}`
  }, 'contact');

  // Then create the contact
  const { data, error } = await supabase
    .from('contacts')
    .insert([{
      contact_id: contactData.id,
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      service_type: contactData.serviceType,
      message: contactData.message,
      status: contactData.status,
      submitted_at: contactData.submittedAt
    }])
    .select();

  if (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
  return data[0];
};

export const getAllContacts = async () => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }

  // Transform data to match frontend format
  return data.map(contact => ({
    id: contact.contact_id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    serviceType: contact.service_type,
    message: contact.message,
    status: contact.status,
    submittedAt: contact.submitted_at
  }));
};

export const updateContactStatus = async (contactId, status) => {
  const { data, error } = await supabase
    .from('contacts')
    .update({ status })
    .eq('contact_id', contactId)
    .select();

  if (error) {
    console.error('Error updating contact status:', error);
    throw error;
  }
  return data[0];
};

// ============================================
// CALENDAR SETTINGS
// ============================================
export const getCalendarSettings = async () => {
  const { data, error } = await supabase
    .from('calendar_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching calendar settings:', error);
    throw error;
  }

  return {
    workingHours: data.working_hours,
    blockedDates: data.blocked_dates,
    timeSlotDuration: data.time_slot_duration,
    breakTimes: data.break_times
  };
};

export const updateCalendarSettings = async (settings) => {
  const { data, error } = await supabase
    .from('calendar_settings')
    .update({
      working_hours: settings.workingHours,
      blocked_dates: settings.blockedDates,
      time_slot_duration: settings.timeSlotDuration,
      break_times: settings.breakTimes
    })
    .eq('id', (await supabase.from('calendar_settings').select('id').single()).data.id)
    .select();

  if (error) {
    console.error('Error updating calendar settings:', error);
    throw error;
  }
  return data[0];
};

// ============================================
// CLIENTS
// ============================================
export const getAllClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('last_contact_date', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
  return data;
};

export const getClientById = async (clientId) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
  return data;
};

export const searchClients = async (searchTerm) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    .order('last_contact_date', { ascending: false });

  if (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
  return data;
};

export const filterClientsByType = async (clientType) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('client_type', clientType)
    .order('last_contact_date', { ascending: false });

  if (error) {
    console.error('Error filtering clients:', error);
    throw error;
  }
  return data;
};

export const addClient = async (clientData) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([{
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      city: clientData.city,
      postal_code: clientData.postalCode,
      client_type: clientData.clientType || 'lead',
      status: clientData.status || 'active',
      notes: clientData.notes,
      tags: clientData.tags || [],
      source: clientData.source || 'manual'
    }])
    .select();

  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }
  return data[0];
};

export const updateClient = async (clientId, updates) => {
  const updateData = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.email) updateData.email = updates.email;
  if (updates.phone) updateData.phone = updates.phone;
  if (updates.address) updateData.address = updates.address;
  if (updates.city) updateData.city = updates.city;
  if (updates.postalCode) updateData.postal_code = updates.postalCode;
  if (updates.clientType) updateData.client_type = updates.clientType;
  if (updates.status) updateData.status = updates.status;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.tags) updateData.tags = updates.tags;

  const { data, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', clientId)
    .select();

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }
  return data[0];
};

export const deleteClient = async (clientId) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
  return true;
};

export const deleteOrder = async (orderId) => {
  // orderId here is the order_id value, not the database primary key
  // We need to delete by order_id column, not id column
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('order_id', orderId);

  if (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
  return true;
};

export const deleteAppointment = async (appointmentId) => {
  // appointmentId here is the appointment_id value, not the database primary key
  // We need to delete by appointment_id column, not id column
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('appointment_id', appointmentId);

  if (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
  return true;
};

// Get client with full history (orders and appointments)
export const getClientWithHistory = async (clientId) => {
  const client = await getClientById(clientId);

  // Get all orders for this client - must match BOTH email AND phone
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_email', client.email)
    .eq('customer_phone', client.phone)
    .order('order_date', { ascending: false });

  // Get all appointments for this client - must match BOTH email AND phone
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('email', client.email)
    .eq('phone', client.phone)
    .order('appointment_date', { ascending: false });

  return {
    ...client,
    orders: orders || [],
    appointments: appointments || []
  };
};

// Sync existing orders and appointments to create client records
export const syncExistingDataToClients = async () => {
  try {
    // Get all orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*');

    // Get all appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*');

    const clientsMap = new Map();

    // Process orders
    if (orders) {
      for (const order of orders) {
        const key = order.customer_phone || order.customer_email;
        if (!key) continue;

        if (!clientsMap.has(key)) {
          clientsMap.set(key, {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
            address: order.customer_address,
            city: order.customer_city,
            postal_code: order.customer_postal_code,
            client_type: 'customer',
            total_orders: 0,
            total_spent: 0,
            total_appointments: 0,
            first_contact_date: order.created_at,
            last_contact_date: order.created_at,
            source: 'website'
          });
        }

        const client = clientsMap.get(key);
        client.total_orders += 1;
        client.total_spent += parseFloat(order.total);
        if (new Date(order.created_at) > new Date(client.last_contact_date)) {
          client.last_contact_date = order.created_at;
        }
        if (new Date(order.created_at) < new Date(client.first_contact_date)) {
          client.first_contact_date = order.created_at;
        }
      }
    }

    // Process appointments
    if (appointments) {
      for (const appointment of appointments) {
        const key = appointment.phone || appointment.email;
        if (!key) continue;

        if (!clientsMap.has(key)) {
          clientsMap.set(key, {
            name: appointment.name,
            email: appointment.email,
            phone: appointment.phone,
            client_type: 'patient',
            total_orders: 0,
            total_spent: 0,
            total_appointments: 0,
            first_contact_date: appointment.created_at,
            last_contact_date: appointment.created_at,
            source: 'website'
          });
        }

        const client = clientsMap.get(key);
        client.total_appointments += 1;
        if (client.client_type === 'customer') {
          client.client_type = 'both';
        }
        if (new Date(appointment.created_at) > new Date(client.last_contact_date)) {
          client.last_contact_date = appointment.created_at;
        }
        if (new Date(appointment.created_at) < new Date(client.first_contact_date)) {
          client.first_contact_date = appointment.created_at;
        }
      }
    }

    // Get existing clients to avoid duplicates
    const { data: existingClients } = await supabase
      .from('clients')
      .select('email, phone');

    const existingEmails = new Set(existingClients?.map(c => c.email?.toLowerCase()) || []);
    const existingPhones = new Set(existingClients?.map(c => c.phone) || []);

    // Filter out clients that already exist
    const clientsArray = Array.from(clientsMap.values()).filter(client => {
      const emailExists = client.email && existingEmails.has(client.email.toLowerCase());
      const phoneExists = client.phone && existingPhones.has(client.phone);
      return !emailExists && !phoneExists;
    });

    if (clientsArray.length > 0) {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientsArray)
        .select();

      if (error) {
        console.error('Error syncing clients:', error);
        throw error;
      }

      console.log(`✅ Synced ${clientsArray.length} new clients (skipped ${Array.from(clientsMap.values()).length - clientsArray.length} existing)`);

      return {
        success: true,
        count: clientsArray.length,
        clients: data
      };
    }

    console.log('ℹ️ No new clients to sync - all clients already exist');
    return {
      success: true,
      count: 0,
      clients: []
    };
  } catch (error) {
    console.error('Error in syncExistingDataToClients:', error);
    throw error;
  }
};

// ============================================
// ADMIN AUTHENTICATION
// ============================================
// Admin authentication functions are defined later in this file (line 1088+)

/**
 * Initiate password reset
 */
export const initiatePasswordReset = async (email) => {
  try {
    const { data, error } = await supabase
      .rpc('initiate_password_reset', {
        p_email: email
      });

    if (error) {
      console.error('Error initiating password reset:', error);
      return { success: false, error: 'Failed to initiate password reset' };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        resetToken: result.reset_token,
        error: result.error_message
      };
    }

    return { success: false, error: 'Failed to initiate password reset' };
  } catch (error) {
    console.error('Error in initiatePasswordReset:', error);
    return { success: false, error: 'Password reset system error' };
  }
};

/**
 * Reset password with token
 */
export const resetPasswordWithToken = async (resetToken, newPassword) => {
  try {
    const { data, error } = await supabase
      .rpc('reset_password_with_token', {
        p_reset_token: resetToken,
        p_new_password: newPassword
      });

    if (error) {
      console.error('Error resetting password:', error);
      return { success: false, error: 'Failed to reset password' };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        error: result.error_message
      };
    }

    return { success: false, error: 'Failed to reset password' };
  } catch (error) {
    console.error('Error in resetPasswordWithToken:', error);
    return { success: false, error: 'Password reset system error' };
  }
};

/**
 * Get admin profile by ID
 */
export const getAdminProfile = async (adminId) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, email, full_name, role, last_login_at, created_at')
      .eq('id', adminId)
      .single();

    if (error) {
      console.error('Error fetching admin profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getAdminProfile:', error);
    throw error;
  }
};

/**
 * Update admin profile
 */
export const updateAdminProfile = async (adminId, updates) => {
  try {
    const { data, error} = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', adminId)
      .select()
      .single();

    if (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateAdminProfile:', error);
    throw error;
  }
};

// ============================================
// PRODUCTS
// ============================================

/**
 * Get all products
 */
export const getAllProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw error;
  }
};

/**
 * Get active products only (for shop page)
 */
export const getActiveProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('featured', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActiveProducts:', error);
    throw error;
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .order('name', { ascending: true});

    if (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProductsByCategory:', error);
    throw error;
  }
};

/**
 * Get single product by ID
 */
export const getProductById = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getProductById:', error);
    throw error;
  }
};

/**
 * Create a new product
 */
export const createProduct = async (productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createProduct:', error);
    throw error;
  }
};

/**
 * Update a product
 */
export const updateProduct = async (productId, updates) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateProduct:', error);
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    throw error;
  }
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_low_stock_products');

    if (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getLowStockProducts:', error);
    throw error;
  }
};

/**
 * Update product stock manually
 */
export const updateProductStock = async (productId, newStock) => {
  try {
    const updates = { stock_quantity: newStock };

    // If stock is 0 or below, mark as out of stock
    if (newStock <= 0) {
      updates.status = 'out_of_stock';
    } else if (newStock > 0) {
      // Reactivate if was out of stock
      updates.status = 'active';
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateProductStock:', error);
    throw error;
  }
};

// ============================================
// ANALYTICS & STATISTICS
// ============================================

/**
 * Get order statistics by time period
 */
export const getOrderStatistics = async (timePeriod = 'today') => {
  try {
    const { data, error } = await supabase
      .rpc('get_order_statistics', {
        time_period: timePeriod
      });

    if (error) {
      console.error('Error fetching order statistics:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : {
      period_label: timePeriod,
      total_orders: 0,
      total_revenue: 0,
      average_order_value: 0
    };
  } catch (error) {
    console.error('Error in getOrderStatistics:', error);
    // Return empty data on error
    return {
      period_label: timePeriod,
      total_orders: 0,
      total_revenue: 0,
      average_order_value: 0
    };
  }
};

/**
 * Get booking statistics by time period
 */
export const getBookingStatistics = async (timePeriod = 'today') => {
  try {
    const { data, error } = await supabase
      .rpc('get_booking_statistics', {
        time_period: timePeriod
      });

    if (error) {
      console.error('Error fetching booking statistics:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : {
      period_label: timePeriod,
      total_bookings: 0,
      confirmed_bookings: 0,
      pending_bookings: 0,
      cancelled_bookings: 0
    };
  } catch (error) {
    console.error('Error in getBookingStatistics:', error);
    // Return empty data on error
    return {
      period_label: timePeriod,
      total_bookings: 0,
      confirmed_bookings: 0,
      pending_bookings: 0,
      cancelled_bookings: 0
    };
  }
};

/**
 * Get daily statistics for charts (last N days)
 */
export const getDailyStatistics = async (daysBack = 7) => {
  try {
    const { data, error } = await supabase
      .rpc('get_daily_statistics', {
        days_back: daysBack
      });

    if (error) {
      console.error('Error fetching daily statistics:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDailyStatistics:', error);
    return [];
  }
};

/**
 * Get top selling products
 */
export const getTopProducts = async (limitCount = 5) => {
  try {
    const { data, error } = await supabase
      .rpc('get_top_products', {
        limit_count: limitCount
      });

    if (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    return [];
  }
};

/**
 * Get dashboard overview statistics
 */
export const getDashboardOverview = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_dashboard_overview');

    if (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : {
      total_orders: 0,
      total_revenue: 0,
      total_bookings: 0,
      pending_bookings: 0,
      low_stock_count: 0,
      total_customers: 0
    };
  } catch (error) {
    console.error('Error in getDashboardOverview:', error);
    // Return empty data on error
    return {
      total_orders: 0,
      total_revenue: 0,
      total_bookings: 0,
      pending_bookings: 0,
      low_stock_count: 0,
      total_customers: 0
    };
  }
};

// ==================== ADMIN AUTHENTICATION ====================

/**
 * Verify admin login credentials
 */
export const verifyAdminLogin = async (username, password) => {
  try {
    const { data, error } = await supabase
      .rpc('verify_admin_login', {
        p_username: username,
        p_password: password
      });

    if (error) {
      console.error('Error verifying admin login:', error);
      throw error;
    }

    // The RPC returns an array with one result
    const result = data && data.length > 0 ? data[0] : null;

    if (!result || !result.success) {
      throw new Error(result?.message || 'Invalid credentials');
    }

    return {
      success: true,
      user: {
        id: result.user_id,
        username: result.username,
        email: result.email,
        fullName: result.full_name,
        role: result.role
      }
    };
  } catch (error) {
    console.error('Error in verifyAdminLogin:', error);
    throw error;
  }
};

// ==================== REVIEWS ====================

/**
 * Submit a new review (with pending status)
 */
export const submitReview = async (reviewData) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        ...reviewData,
        status: 'pending' // All new reviews start as pending
      }])
      .select()
      .single();

    if (error) {
      console.error('Error submitting review:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in submitReview:', error);
    throw error;
  }
};

/**
 * Get approved reviews (for public display)
 */
export const getApprovedReviews = async () => {
  try {
    const { data, error} = await supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approved reviews:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getApprovedReviews:', error);
    return [];
  }
};

/**
 * Get all reviews (admin only)
 */
export const getAllReviews = async () => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all reviews:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllReviews:', error);
    return [];
  }
};

/**
 * Get pending reviews (admin only)
 */
export const getPendingReviews = async () => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending reviews:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPendingReviews:', error);
    return [];
  }
};

/**
 * Update review status (approve/reject)
 */
export const updateReviewStatus = async (reviewId, status, adminNotes = '', reviewedBy = '') => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        status,
        admin_notes: adminNotes,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error updating review status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateReviewStatus:', error);
    throw error;
  }
};

/**
 * Delete a review (admin only)
 */
export const deleteReview = async (reviewId) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('Error deleting review:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteReview:', error);
    throw error;
  }
};

/**
 * Upload review media (image or video) to Supabase Storage
 */
export const uploadReviewMedia = async (file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    console.log('Uploading to bucket: review-media, file:', filePath);

    const { data, error } = await supabase.storage
      .from('review-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Upload successful!');

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('review-media')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadReviewMedia:', error);
    throw error;
  }
};

// ==================== BLOG ARTICLES ====================

/**
 * Upload blog image to Supabase Storage
 */
export const uploadBlogImage = async (file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    console.log('Uploading to bucket: blog-images, file:', filePath);

    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Upload successful!');

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadBlogImage:', error);
    throw error;
  }
};

/**
 * Get all blog articles (admin)
 */
export const getAllBlogArticles = async () => {
  try {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all blog articles:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllBlogArticles:', error);
    return [];
  }
};

/**
 * Get published blog articles (public)
 */
export const getPublishedBlogArticles = async () => {
  try {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching published blog articles:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPublishedBlogArticles:', error);
    return [];
  }
};

/**
 * Get single blog article by ID
 */
export const getBlogArticleById = async (articleId) => {
  try {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error) {
      console.error('Error fetching blog article:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getBlogArticleById:', error);
    throw error;
  }
};

/**
 * Create a new blog article
 */
export const createBlogArticle = async (articleData) => {
  try {
    const { data, error } = await supabase
      .from('blog_articles')
      .insert([{
        title: articleData.title,
        slug: articleData.slug,
        excerpt: articleData.excerpt,
        content: articleData.content,
        featured_image: articleData.featuredImage,
        category: articleData.category,
        author: articleData.author,
        status: articleData.status || 'draft',
        published_at: articleData.status === 'published' ? new Date().toISOString() : null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating blog article:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createBlogArticle:', error);
    throw error;
  }
};

/**
 * Update a blog article
 */
export const updateBlogArticle = async (articleId, updates) => {
  try {
    const updateData = {
      title: updates.title,
      slug: updates.slug,
      excerpt: updates.excerpt,
      content: updates.content,
      featured_image: updates.featuredImage,
      category: updates.category,
      author: updates.author,
      status: updates.status
    };

    // If publishing for the first time, set published_at
    if (updates.status === 'published' && !updates.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('blog_articles')
      .update(updateData)
      .eq('id', articleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog article:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateBlogArticle:', error);
    throw error;
  }
};

/**
 * Delete a blog article
 */
export const deleteBlogArticle = async (articleId) => {
  try {
    const { error } = await supabase
      .from('blog_articles')
      .delete()
      .eq('id', articleId);

    if (error) {
      console.error('Error deleting blog article:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteBlogArticle:', error);
    throw error;
  }
};

// ==================== DISCOUNTS ====================

/**
 * Get all discounts
 */
export const getAllDiscounts = async () => {
  try {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching discounts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllDiscounts:', error);
    return [];
  }
};

/**
 * Get active discounts
 */
export const getActiveDiscounts = async () => {
  try {
    // Get all active discounts and filter on client side for timezone accuracy
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active discounts:', error);
      throw error;
    }

    // Filter based on current local time (handles timezone properly)
    const now = new Date();
    const activeDiscounts = (data || []).filter(discount => {
      const startDate = new Date(discount.start_date);
      const endDate = new Date(discount.end_date);
      return now >= startDate && now <= endDate;
    });

    console.log('Active discounts loaded (SAST timezone):', activeDiscounts);
    return activeDiscounts;
  } catch (error) {
    console.error('Error in getActiveDiscounts:', error);
    return [];
  }
};

/**
 * Get discount by ID
 */
export const getDiscountById = async (discountId) => {
  try {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('id', discountId)
      .single();

    if (error) {
      console.error('Error fetching discount:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getDiscountById:', error);
    throw error;
  }
};

/**
 * Create a new discount
 */
export const createDiscount = async (discountData) => {
  try {
    const { data, error } = await supabase
      .from('discounts')
      .insert([discountData])
      .select()
      .single();

    if (error) {
      console.error('Error creating discount:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createDiscount:', error);
    throw error;
  }
};

/**
 * Update a discount
 */
export const updateDiscount = async (discountId, updates) => {
  try {
    const { data, error } = await supabase
      .from('discounts')
      .update(updates)
      .eq('id', discountId)
      .select()
      .single();

    if (error) {
      console.error('Error updating discount:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateDiscount:', error);
    throw error;
  }
};

/**
 * Delete a discount
 */
export const deleteDiscount = async (discountId) => {
  try {
    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('id', discountId);

    if (error) {
      console.error('Error deleting discount:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDiscount:', error);
    throw error;
  }
};

/**
 * Toggle discount active status
 */
export const toggleDiscountStatus = async (discountId, isActive) => {
  try {
    const { data, error } = await supabase
      .from('discounts')
      .update({ is_active: isActive })
      .eq('id', discountId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling discount status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in toggleDiscountStatus:', error);
    throw error;
  }
};

/**
 * Get active discount for a specific product
 */
export const getProductDiscount = async (productId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_active_discounts_for_product', {
        product_id: productId
      });

    if (error) {
      console.error('Error fetching product discount:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in getProductDiscount:', error);
    return null;
  }
};
