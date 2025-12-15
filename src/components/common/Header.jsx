import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartCount, setIsCartOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', type: 'route' },
    { name: 'About', href: '/about', type: 'route' },
    { name: 'Shop', href: '/shop', type: 'route' },
    { name: 'Services', href: '/services', type: 'route' },
    { name: 'Vitamin D Talks', href: '/vitamin-d-talks', type: 'route' },
    { name: 'Team', href: '/team', type: 'route' },
    { name: 'Reviews', href: '/testimonials', type: 'route' },
    { name: 'Contact', href: '/contact', type: 'route' },
    { name: 'Blog', href: '/blog', type: 'route' },
  ];

  const handleNavClick = (link) => {
    if (link.type === 'route') {
      navigate(link.href);
      setIsMobileMenuOpen(false);
    } else if (link.type === 'section') {
      // If we're not on the home page, navigate to home first
      if (location.pathname !== '/') {
        navigate('/');
        // Wait for navigation to complete before scrolling
        setTimeout(() => {
          scrollToSection(link.href);
        }, 100);
      } else {
        scrollToSection(link.href);
      }
    }
  };

  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md"
    >
      <nav className="container-custom px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3"
          >
            <img
              src="/Logo.png"
              alt="Dr. Boitumelo Wellness"
              className="h-12 md:h-16 w-auto"
            />
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <motion.button
                key={link.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => handleNavClick(link)}
                className="font-montserrat font-medium text-dark-text hover:text-primary-green transition-colors duration-300"
              >
                {link.name}
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:scale-110 transition-transform"
            >
              <FaShoppingCart className="text-2xl text-primary-green" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {getCartCount()}
                </span>
              )}
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:scale-110 transition-transform"
          >
            {isMobileMenuOpen ? (
              <FaTimes className="text-2xl text-dark-text" />
            ) : (
              <FaBars className="text-2xl text-dark-text" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden mt-4 py-4 bg-white/95 backdrop-blur-md rounded-lg shadow-lg"
            >
              <div className="flex flex-col space-y-4 px-6">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link)}
                    className="font-montserrat font-medium text-dark-text hover:text-primary-green transition-colors py-3 border-b border-gray-200 last:border-0 text-left"
                  >
                    {link.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setIsCartOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <FaShoppingCart />
                  <span>Cart ({getCartCount()})</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
};

export default Header;
