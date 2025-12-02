import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaHeart,
} from 'react-icons/fa';
import { subscribeToNewsletter } from '../../lib/supabase';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ type: '', message: '' });

  const quickLinks = [
    { name: 'About', href: '#about' },
    { name: 'Products', href: '#products' },
    { name: 'Services', href: '#services' },
    { name: 'Reviews', href: '#testimonials' },
    { name: 'Contact', href: '#contact' },
  ];

  const productCategories = [
    'Antioxidants',
    'Minerals',
    'Immune Support',
    'Beauty & Wellness',
    'Multivitamins',
    'Heart Health',
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Shipping Policy', href: '#' },
    { name: 'Return Policy', href: '#' },
  ];

  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterStatus({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    try {
      const result = await subscribeToNewsletter(newsletterEmail);

      if (result.success) {
        setNewsletterStatus({ type: 'success', message: result.message });
        setNewsletterEmail(''); // Clear input on success

        // Clear success message after 5 seconds
        setTimeout(() => {
          setNewsletterStatus({ type: '', message: '' });
        }, 5000);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setNewsletterStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    }
  };

  return (
    <footer className="bg-gradient-to-br from-primary-green to-green-dark text-white">
      {/* Main Footer Content */}
      <div className="container-custom px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div>
            <motion.img
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              src="/Logo.png"
              alt="Dr. Boitumelo Wellness"
              className="h-16 w-auto mb-6"
            />
            <p className="text-white/80 mb-6 leading-relaxed">
              Empowering your wellness journey with premium supplements and
              holistic health solutions backed by science and expertise.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: <FaLinkedin />, link: 'https://www.linkedin.com/in/dr-boitumelo-phetla-md-mba-78020960/' },
                { icon: <FaTiktok />, link: 'https://www.tiktok.com/@drboitumelo_wellness' },
                { icon: <FaInstagram />, link: 'https://www.instagram.com/drboitumelo_wellness/' },
                { icon: <FaYoutube />, link: 'https://www.youtube.com/@heavenonearthwithdrbb' },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-white/20 hover:bg-gold rounded-full flex items-center justify-center text-lg transition-colors"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-montserrat font-bold text-xl mb-6 text-gold">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="text-white/80 hover:text-gold transition-colors flex items-center"
                  >
                    <span className="mr-2">›</span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="font-montserrat font-bold text-xl mb-6 text-gold">
              Shop By Category
            </h4>
            <ul className="space-y-3">
              {productCategories.map((category) => (
                <li key={category}>
                  <a
                    href="#products"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('#products');
                    }}
                    className="text-white/80 hover:text-gold transition-colors flex items-center"
                  >
                    <span className="mr-2">›</span>
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-montserrat font-bold text-xl mb-6 text-gold">
              Get In Touch
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <FaEnvelope className="text-gold mt-1 flex-shrink-0" />
                <a
                  href="mailto:admin@drboitumelowellness.co.za"
                  className="text-white/80 hover:text-gold transition-colors"
                >
                  admin@drboitumelowellness.co.za
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <FaPhone className="text-gold mt-1 flex-shrink-0" />
                <a
                  href="tel:+27176852263"
                  className="text-white/80 hover:text-gold transition-colors"
                >
                  017 685 2263 | 078 725 3389
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <FaMapMarkerAlt className="text-gold mt-1 flex-shrink-0" />
                <span className="text-white/80">
                  Mpumalanga, South Africa 2285
                </span>
              </li>
            </ul>

            {/* Newsletter Signup */}
            <div className="mt-6">
              <h5 className="font-montserrat font-semibold mb-3">
                Newsletter
              </h5>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 px-4 py-2 rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-white/10 border border-white/20 focus:outline-none focus:border-gold text-white placeholder-white/50"
                  required
                />
                <button
                  type="submit"
                  className="bg-gold hover:bg-gold-dark px-4 py-2 rounded-lg sm:rounded-r-lg sm:rounded-l-none transition-colors"
                >
                  <FaEnvelope />
                </button>
              </form>
              {/* Status Message */}
              {newsletterStatus.message && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 text-sm ${
                    newsletterStatus.type === 'success'
                      ? 'text-green-300'
                      : 'text-red-300'
                  }`}
                >
                  {newsletterStatus.message}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20">
        <div className="container-custom px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-white/70 text-sm text-center md:text-left">
              © {currentYear} Dr. Boitumelo Wellness. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm">
              {legalLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-white/70 hover:text-gold transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Made with Love */}
            <div className="flex items-center space-x-2 text-white/70 text-sm">
              <span>Made with</span>
              <FaHeart className="text-gold animate-pulse" />
              <span>for your wellness</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 bg-gold hover:bg-gold-dark text-white p-3 sm:p-4 rounded-full shadow-2xl z-40"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </motion.button>
    </footer>
  );
};

export default Footer;
