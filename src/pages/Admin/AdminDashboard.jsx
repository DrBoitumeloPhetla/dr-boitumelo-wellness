import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getAllOrders,
  getAllContacts,
  getOrderStatistics,
  getDailyStatistics,
  getTopProducts,
  getDashboardOverview
} from '../../lib/supabase';
import {
  FaShoppingCart,
  FaEnvelope,
  FaChartLine,
  FaMoneyBillWave,
  FaClock,
  FaArrowRight,
  FaArrowUp
} from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import SimpleBarChart from '../../components/Charts/SimpleBarChart';
import SimpleLineChart from '../../components/Charts/SimpleLineChart';

const StatCard = ({ icon: Icon, title, value, subtitle, color, link }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-10 flex items-center justify-center`}>
        <Icon className={`text-2xl ${color.replace('bg-', 'text-')}`} />
      </div>
      {link && (
        <Link to={link} className="text-primary-green hover:text-opacity-80 text-sm flex items-center space-x-1">
          <span>View All</span>
          <FaArrowRight />
        </Link>
      )}
    </div>
    <h3 className="text-2xl font-bold text-dark-text mb-1">{value}</h3>
    <p className="text-gray-600 font-medium">{title}</p>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </motion.div>
);

const RecentActivity = ({ icon: Icon, title, subtitle, time, color }) => (
  <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
    <div className={`w-10 h-10 rounded-full ${color} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
      <Icon className={`${color.replace('bg-', 'text-')}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-dark-text">{title}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
    <span className="text-xs text-gray-400 flex-shrink-0">{time}</span>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalContacts: 0,
    newContacts: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [timePeriod, setTimePeriod] = useState('week'); // today, week, month, year
  const [orderStats, setOrderStats] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    loadDashboardData();
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [timePeriod]);

  const loadAnalytics = async () => {
    try {
      // Determine days based on period
      const daysMap = {
        today: 1,
        week: 7,
        month: 30,
        year: 365
      };

      const [orderData, dailyStats, topProds] = await Promise.all([
        getOrderStatistics(timePeriod),
        getDailyStatistics(daysMap[timePeriod] || 7),
        getTopProducts(5)
      ]);

      setOrderStats(orderData);
      setTopProducts(topProds);

      // Format daily data for charts
      if (dailyStats && dailyStats.length > 0) {
        setDailyData(dailyStats.map(d => ({
          date: new Date(d.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
          orders: parseInt(d.orders_count) || 0,
          revenue: parseFloat(d.revenue) || 0
        })));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load data from Supabase
      const [orders, contacts] = await Promise.all([
        getAllOrders(),
        getAllContacts()
      ]);

      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const newContacts = contacts.filter(c => c.status === 'new').length;

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        totalRevenue,
        totalContacts: contacts.length,
        newContacts
      });

      // Get recent orders (last 5)
      setRecentOrders(orders.slice(-5).reverse());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-montserrat font-bold text-dark-text mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
          </div>

          {/* Time Period Filter */}
          <div className="mt-4 sm:mt-0 w-full sm:w-auto overflow-x-auto">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 min-w-full sm:min-w-0">
              {['today', 'week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    timePeriod === period
                      ? 'bg-primary-green text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={FaShoppingCart}
            title="Total Orders"
            value={stats.totalOrders}
            subtitle={`${stats.pendingOrders} pending`}
            color="bg-blue-500"
            link="/admin/orders"
          />

          <StatCard
            icon={FaMoneyBillWave}
            title="Total Revenue"
            value={`R${stats.totalRevenue.toFixed(2)}`}
            subtitle="From orders"
            color="bg-green-500"
          />

          <StatCard
            icon={FaEnvelope}
            title="Contact Messages"
            value={stats.totalContacts}
            subtitle={`${stats.newContacts} new`}
            color="bg-orange-500"
            link="/admin/contacts"
          />
        </div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue & Orders Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-montserrat font-bold text-dark-text">Revenue Trend</h2>
                <p className="text-sm text-gray-500">Daily revenue for {timePeriod}</p>
              </div>
              <FaArrowUp className="text-2xl text-green-500" />
            </div>
            <SimpleLineChart
              data={dailyData.map(d => ({ label: d.date, value: d.revenue }))}
              height={250}
              lineColor="#10b981"
              fillColor="rgba(16, 185, 129, 0.1)"
            />
            {orderStats && (
              <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    R{parseFloat(orderStats.total_revenue || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R{parseFloat(orderStats.average_order_value || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Orders Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-montserrat font-bold text-dark-text">Daily Orders</h2>
                <p className="text-sm text-gray-500">Orders count per day</p>
              </div>
              <FaShoppingCart className="text-2xl text-blue-500" />
            </div>
            <SimpleBarChart
              data={dailyData.map(d => ({ label: d.date, value: d.orders }))}
              height={250}
              barColor="#3b82f6"
            />
            {orderStats && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">
                  {orderStats.total_orders || 0}
                </p>
              </div>
            )}
          </motion.div>

          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-montserrat font-bold text-dark-text">Top Products</h2>
                <p className="text-sm text-gray-500">Best sellers all time</p>
              </div>
              <FaChartLine className="text-2xl text-primary-gold" />
            </div>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-dark-text truncate">{product.product_name}</p>
                      <p className="text-sm text-gray-500">{product.times_sold} sold</p>
                    </div>
                    <p className="font-bold text-primary-green ml-4">
                      R{parseFloat(product.total_revenue || 0).toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <FaChartLine className="text-4xl mx-auto mb-2 opacity-30" />
                <p>No sales data yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-montserrat font-bold text-dark-text">Recent Orders</h2>
              <Link to="/admin/orders" className="text-primary-green hover:text-opacity-80 text-sm flex items-center space-x-1">
                <span>View All</span>
                <FaArrowRight />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FaShoppingCart className="text-4xl text-gray-300 mx-auto mb-2" />
                <p>No orders yet</p>
              </div>
            ) : (
              recentOrders.map(order => (
                <RecentActivity
                  key={order.id}
                  icon={FaShoppingCart}
                  title={`Order #${order.id.substring(0, 8)}`}
                  subtitle={`${order.customer.name} - R${order.total.toFixed(2)}`}
                  time={formatTimeAgo(order.orderDate)}
                  color="bg-blue-500"
                />
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-green to-primary-gold rounded-lg shadow-lg p-8 text-white"
        >
          <h2 className="text-2xl font-montserrat font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/admin/orders"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all flex items-center space-x-3"
            >
              <FaClock className="text-2xl" />
              <div>
                <p className="font-semibold">Pending Orders</p>
                <p className="text-sm opacity-90">{stats.pendingOrders} to review</p>
              </div>
            </Link>
            <Link
              to="/admin/contacts"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all flex items-center space-x-3"
            >
              <FaEnvelope className="text-2xl" />
              <div>
                <p className="font-semibold">New Messages</p>
                <p className="text-sm opacity-90">{stats.newContacts} to respond</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
