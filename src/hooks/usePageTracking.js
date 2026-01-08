import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Send page view to Google Analytics when route changes
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-08P579VTZ5', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
};

export default usePageTracking;
