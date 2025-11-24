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
const ProtectedRoute = lazy(() => import('./components/Admin/ProtectedRoute'));

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
      </Routes>
      </Suspense>
    </div>
  );
}

export default App;
