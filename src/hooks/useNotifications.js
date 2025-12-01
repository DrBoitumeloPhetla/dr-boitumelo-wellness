import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useNotifications = () => {
  const [counts, setCounts] = useState({
    orders: 0,
    contacts: 0,
    reviews: 0,
    clients: 0,
    prescriptionRequests: 0,
  });

  const getLastVisited = (page) => {
    const timestamp = localStorage.getItem(`lastVisited_${page}`);
    return timestamp || new Date(0).toISOString(); // Return epoch if never visited
  };

  const markAsVisited = (page) => {
    localStorage.setItem(`lastVisited_${page}`, new Date().toISOString());
  };

  const fetchCounts = async () => {
    try {
      const lastVisitedOrders = getLastVisited('orders');
      const lastVisitedContacts = getLastVisited('contacts');
      const lastVisitedReviews = getLastVisited('reviews');
      const lastVisitedClients = getLastVisited('clients');
      const lastVisitedPrescriptions = getLastVisited('prescription-requests');

      // Fetch new orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastVisitedOrders);

      // Fetch new contacts count
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastVisitedContacts);

      // Fetch new reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastVisitedReviews);

      // Fetch new clients count (customers who made purchases)
      const { count: clientsCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastVisitedClients);

      // Fetch new prescription requests count
      const { count: prescriptionsCount } = await supabase
        .from('prescription_requests')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastVisitedPrescriptions);

      setCounts({
        orders: ordersCount || 0,
        contacts: contactsCount || 0,
        reviews: reviewsCount || 0,
        clients: clientsCount || 0,
        prescriptionRequests: prescriptionsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  useEffect(() => {
    // Fetch counts on mount
    fetchCounts();

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    counts,
    markAsVisited,
    refreshCounts: fetchCounts,
  };
};
