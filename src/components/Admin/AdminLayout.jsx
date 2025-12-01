import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { motion } from 'framer-motion';
import {
  FaHome,
  FaShoppingCart,
  FaCalendarAlt,
  FaEnvelope,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChartLine,
  FaCog,
  FaUsers,
  FaBoxes,
  FaStar,
  FaNewspaper,
  FaTag,
  FaPrescriptionBottle
} from 'react-icons/fa';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { counts, markAsVisited, refreshCounts } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Mark page as visited when location changes
  useEffect(() => {
    const pageMap = {
      '/admin/orders': 'orders',
      '/admin/contacts': 'contacts',
      '/admin/reviews': 'reviews',
      '/admin/clients': 'clients',
      '/admin/prescription-requests': 'prescription-requests',
    };

    const pageName = pageMap[location.pathname];
    if (pageName) {
      markAsVisited(pageName);
      // Refresh counts after marking as visited
      setTimeout(refreshCounts, 100);
    }
  }, [location.pathname]);

  const menuItems = [
    { path: '/admin/dashboard', icon: FaHome, label: 'Dashboard', notificationKey: null },
    { path: '/admin/clients', icon: FaUsers, label: 'Supplement Buyers', notificationKey: 'clients' },
    { path: '/admin/products', icon: FaBoxes, label: 'Products', notificationKey: null },
    { path: '/admin/discounts', icon: FaTag, label: 'Discounts & Sales', notificationKey: null },
    { path: '/admin/orders', icon: FaShoppingCart, label: 'Orders', notificationKey: 'orders' },
    { path: '/admin/prescription-requests', icon: FaPrescriptionBottle, label: 'Prescription Requests', notificationKey: 'prescriptionRequests' },
    { path: '/admin/blog', icon: FaNewspaper, label: 'Blog Articles', notificationKey: null },
    { path: '/admin/reviews', icon: FaStar, label: 'Reviews', notificationKey: 'reviews' },
    { path: '/admin/contacts', icon: FaEnvelope, label: 'Contact Submissions', notificationKey: 'contacts' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-md p-4 flex items-center justify-between">
        <h1 className="text-xl font-montserrat font-bold text-primary-green">
          Admin Dashboard
        </h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-2xl text-gray-600"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 flex flex-col
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-2xl font-montserrat font-bold text-primary-green">
            Dr. Boitumelo
          </h1>
          <p className="text-sm text-gray-600 mt-1">Admin Panel</p>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const notificationCount = item.notificationKey ? counts[item.notificationKey] : 0;
            const showBadge = notificationCount > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-lg transition-all relative
                  ${isActive
                    ? 'bg-primary-green text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="text-lg" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {showBadge && (
                  <div className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-xs font-bold rounded-full">
                    {notificationCount}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button - Fixed */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-all"
          >
            <FaSignOutAlt className="text-lg" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
