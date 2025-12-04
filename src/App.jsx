import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import CartModal from './components/ui/CartModal';
import LoadingScreen from './components/common/LoadingScreen';
import FloatingCartButton from './components/common/FloatingCartButton';
import ScrollToTop from './components/common/ScrollToTop';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Shop = lazy(() => import('./pages/Shop'));
const Services = lazy(() => import('./pages/Services'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogArticle = lazy(() => import('./pages/BlogArticle'));
const Team = lazy(() => import('./pages/Team'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));

// Lazy load admin pages
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminClients = lazy(() => import('./pages/Admin/AdminClients'));
const AdminProducts = lazy(() => import('./pages/Admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/Admin/AdminOrders'));
const AdminBlog = lazy(() => import('./pages/Admin/AdminBlog'));
const AdminReviews = lazy(() => import('./pages/Admin/AdminReviews'));
const AdminDiscounts = lazy(() => import('./pages/Admin/AdminDiscounts'));
const AdminContacts = lazy(() => import('./pages/Admin/AdminContacts'));
const AdminPrescriptionRequests = lazy(() => import('./pages/Admin/AdminPrescriptionRequests'));
const AdminActivityLogs = lazy(() => import('./pages/Admin/AdminActivityLogs'));
const ProtectedRoute = lazy(() => import('./components/Admin/ProtectedRoute'));
const PrescriptionPurchase = lazy(() => import('./pages/PrescriptionPurchase'));

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for initial assets
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen key="loading" />}
      </AnimatePresence>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
        </div>
      }>
        <ScrollToTop />
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <>
            <Header />
            <Home />
            <Footer />
            <CartModal />
            <FloatingCartButton />
          </>
        } />
        <Route path="/about" element={
          <>
            <Header />
            <About />
            <Footer />
            <CartModal />
            <FloatingCartButton />
          </>
        } />
        <Route path="/shop" element={
          <>
            <Header />
            <Shop />
            <Footer />
            <CartModal />
            <FloatingCartButton />
          </>
        } />
        <Route path="/services" element={
          <>
            <Header />
            <Services />
            <Footer />
            <CartModal />
            <FloatingCartButton />
          </>
        } />
        <Route path="/testimonials" element={
          <>
            <Header />
            <Testimonials />
            <Footer />
            <CartModal />
            <FloatingCartButton />
          </>
        } />
        <Route path="/contact" element={
          <>
            <Header />
            <Contact />
            <Footer />
            <CartModal />
            <FloatingCartButton />
          </>
        } />
        <Route path="/blog" element={
          <>
            <Header />
            <Blog />
            <Footer />
            <CartModal />
            <FloatingCartButton />
          </>
        } />
        <Route path="/blog/:slug" element={
          <>
            <Header />
            <BlogArticle />
            <Footer />
            <CartModal />
            <FloatingCartButton />
          </>
        } />
        <Route path="/team" element={
          <>
            <Header />
            <Team />
            <Footer />
            <CartModal />
            <FloatingCartButton />
          </>
        } />

        {/* Payment Routes */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />

        {/* Booking Routes */}
        <Route path="/booking/success" element={<BookingSuccess />} />
        <Route path="/booking/cancel" element={<PaymentCancel />} />

        {/* Prescription Purchase Route */}
        <Route path="/prescription-purchase/:code" element={
          <>
            <Header />
            <PrescriptionPurchase />
            <Footer />
            <CartModal />
            <FloatingCartButton />
          </>
        } />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/clients" element={
          <ProtectedRoute>
            <AdminClients />
          </ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute>
            <AdminProducts />
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute>
            <AdminOrders />
          </ProtectedRoute>
        } />
        <Route path="/admin/blog" element={
          <ProtectedRoute>
            <AdminBlog />
          </ProtectedRoute>
        } />
        <Route path="/admin/reviews" element={
          <ProtectedRoute>
            <AdminReviews />
          </ProtectedRoute>
        } />
        <Route path="/admin/discounts" element={
          <ProtectedRoute>
            <AdminDiscounts />
          </ProtectedRoute>
        } />
        <Route path="/admin/contacts" element={
          <ProtectedRoute>
            <AdminContacts />
          </ProtectedRoute>
        } />
        <Route path="/admin/prescription-requests" element={
          <ProtectedRoute>
            <AdminPrescriptionRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin/activity-logs" element={
          <ProtectedRoute>
            <AdminActivityLogs />
          </ProtectedRoute>
        } />
      </Routes>
      </Suspense>
    </div>
  );
}

export default App;
