import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const EPOCH = new Date(0).toISOString();

export const useNotifications = () => {
  const [counts, setCounts] = useState({
    orders: 0,
    contacts: 0,
    reviews: 0,
    clients: 0,
    prescriptionRequests: 0,
    consultations: 0,
    webinarRegistrations: 0,
  });

  // Fetch the shared "last viewed" timestamps from Supabase.
  // Returns a map { page: ISO timestamp }. Missing pages fall back to epoch.
  const fetchLastViewedMap = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notification_views')
        .select('page, last_viewed_at');

      if (error) {
        console.error('Failed to load notification view timestamps:', error.message);
        return {};
      }

      const map = {};
      (data || []).forEach((row) => {
        map[row.page] = row.last_viewed_at;
      });
      return map;
    } catch (err) {
      console.error('Unexpected error loading notification timestamps:', err);
      return {};
    }
  };

  const getLastViewed = (map, page) => map[page] || EPOCH;

  // Shared write: any admin viewing the page clears the badge for everyone.
  const markAsVisited = useCallback(async (page) => {
    try {
      await supabase
        .from('admin_notification_views')
        .upsert(
          { page, last_viewed_at: new Date().toISOString() },
          { onConflict: 'page' }
        );
    } catch (err) {
      console.error(`Failed to mark page "${page}" as visited:`, err);
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const lastViewed = await fetchLastViewedMap();

      const [
        ordersResult,
        contactsResult,
        reviewsResult,
        clientsResult,
        prescriptionsResult,
        consultationsResult,
        webinarResult,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', getLastViewed(lastViewed, 'orders')),
        supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', getLastViewed(lastViewed, 'contacts')),
        supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', getLastViewed(lastViewed, 'reviews')),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', getLastViewed(lastViewed, 'clients')),
        supabase
          .from('prescription_requests')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', getLastViewed(lastViewed, 'prescription-requests')),
        supabase
          .from('consultation_appointments')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', getLastViewed(lastViewed, 'appointments')),
        supabase
          .from('webinar_registrations')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', getLastViewed(lastViewed, 'webinar-registrations')),
      ]);

      setCounts({
        orders: ordersResult.count || 0,
        contacts: contactsResult.count || 0,
        reviews: reviewsResult.count || 0,
        clients: clientsResult.count || 0,
        prescriptionRequests: prescriptionsResult.count || 0,
        consultations: consultationsResult.count || 0,
        webinarRegistrations: webinarResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return {
    counts,
    markAsVisited,
    refreshCounts: fetchCounts,
  };
};
