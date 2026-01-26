import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { createContact } from '../lib/supabase';
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa';
import BookingModal from '../components/ui/BookingModal';

const Contact = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  });

  const [formStatus, setFormStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare contact submission for admin dashboard
    const contactData = {
      id: 'CON-' + Date.now(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      serviceType: formData.service,
      message: formData.message,
      submittedAt: new Date().toISOString(),
      status: 'new'
    };

    try {
      // Save to Supabase database
      await createContact(contactData);
      console.log('Contact saved to Supabase successfully!');

      // Show success message
      setFormStatus('success');

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: '',
      });

      setTimeout(() => setFormStatus(null), 5000);
    } catch (error) {
      console.error('Error saving contact:', error);
      setFormStatus('error');
      setTimeout(() => setFormStatus(null), 5000);
    }
  };

  const contactInfo = [
    {
      icon: <FaEnvelope />,
      title: 'Wellness Talks',
      content: 'wellness@drphetla.co.za',
      link: 'mailto:wellness@drphetla.co.za',
      highlight: true,
    },
    {
      icon: <FaEnvelope />,
      title: 'Vitamin D Webinars',
      content: 'drbb@drboitumelowellness.co.za',
      link: 'mailto:drbb@drboitumelowellness.co.za',
    },
    {
      icon: <FaEnvelope />,
      title: 'General Inquiries',
      content: 'admin@drboitumelowellness.co.za',
      link: 'mailto:admin@drboitumelowellness.co.za',
    },
    {
      icon: <FaEnvelope />,
      title: 'Sales & Orders',
      content: 'sales@drboitumelowellness.co.za',
      link: 'mailto:sales@drboitumelowellness.co.za',
    },
    {
      icon: <FaPhone />,
      title: 'Phone',
      content: '017 685 2263 | 078 725 3389',
      link: 'tel:+27176852263',
    },
    {
      icon: <FaMapMarkerAlt />,
      title: 'Location',
      content: '908 St Bernards Drive, Garsfontein, Pretoria East',
      link: null,
    },
    {
      icon: <FaClock />,
      title: 'WhatsApp',
      content: '076 577 6715',
      link: 'https://wa.me/27765776715',
    },
  ];

  const services = [
    'Virtual Consultation',
    'Wellness Assessment',
    'Nutrition Coaching',
    'Supplement Consultation',
    'Chronic Condition Support',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-green to-green-dark text-white pt-32 pb-20 px-6 mt-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="heading-primary text-white mb-4">Get In Touch</h1>
            <div className="w-20 h-1 bg-gold mx-auto mb-6" />
            <p className="text-lg md:text-xl text-white/90">
              Ready to transform your health? Reach out to schedule a consultation or ask any questions about our services
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-white" ref={ref}>
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-cream rounded-2xl p-8 shadow-lg">
                <h3 className="heading-tertiary text-dark-text mb-6">
                  Send Us a Message
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block font-montserrat font-medium text-dark-text mb-2"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block font-montserrat font-medium text-dark-text mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block font-montserrat font-medium text-dark-text mb-2"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none transition-all"
                      placeholder="+27 11 234 5678"
                    />
                  </div>

                  {/* Service */}
                  <div>
                    <label
                      htmlFor="service"
                      className="block font-montserrat font-medium text-dark-text mb-2"
                    >
                      Interested In *
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none transition-all"
                    >
                      <option value="">Select a service</option>
                      {services.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block font-montserrat font-medium text-dark-text mb-2"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="4"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 outline-none transition-all resize-none"
                      placeholder="Tell us about your health goals and how we can help..."
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full btn-secondary"
                  >
                    Send Message
                  </motion.button>

                  {/* Success Message */}
                  {formStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg"
                    >
                      Thank you! We'll get back to you within 24 hours.
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {formStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
                    >
                      There was an error submitting your message. Please try again.
                    </motion.div>
                  )}
                </form>
              </div>
            </motion.div>

            {/* Contact Info & Map */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              {/* Contact Cards */}
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow flex items-start space-x-4"
                  >
                    <div className="text-3xl text-primary-green mt-1">
                      {info.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-montserrat font-semibold text-dark-text mb-1">
                        {info.title}
                      </h4>
                      {info.link ? (
                        <a
                          href={info.link}
                          className="text-gray-600 hover:text-primary-green transition-colors"
                        >
                          {info.content}
                        </a>
                      ) : (
                        <p className="text-gray-600">{info.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Social Media */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-primary-green to-green-dark rounded-xl p-6 shadow-lg text-white"
              >
                <h4 className="font-montserrat font-semibold text-xl mb-4">
                  Connect With Us
                </h4>
                <div className="flex space-x-4">
                  {[
                    { icon: <FaLinkedin />, link: 'https://www.linkedin.com/in/dr-boitumelo-phetla-md-mba-78020960/' },
                    { icon: <FaTiktok />, link: 'https://www.tiktok.com/@drboitumelo_wellness' },
                    { icon: <FaInstagram />, link: 'https://www.instagram.com/drboitumelo_wellness/' },
                    { icon: <FaYoutube />, link: 'https://www.youtube.com/@heavenonearthwithdrbb' },
                  ].map((social, index) => (
                    <a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xl transition-all hover:scale-110"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Booking CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.7 }}
                className="bg-gold/10 border-2 border-gold rounded-xl p-6 text-center"
              >
                <h4 className="font-montserrat font-bold text-xl text-dark-text mb-2">
                  Ready to Book?
                </h4>
                <p className="text-gray-700 mb-4">
                  Schedule your consultation directly through our booking system
                </p>
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="btn-primary w-full"
                >
                  Book Appointment Now
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
};

export default Contact;
