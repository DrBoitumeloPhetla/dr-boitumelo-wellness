import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FaCalendarAlt, FaClock, FaUserMd, FaGraduationCap, FaCheckCircle, FaVideo } from 'react-icons/fa';
import { getAllWebinars } from '../lib/supabase';
import WebinarRegistrationModal from '../components/ui/WebinarRegistrationModal';

const VitaminDTalks = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadWebinars();
  }, []);

  const loadWebinars = async () => {
    try {
      const data = await getAllWebinars();
      setWebinars(data || []);
    } catch (error) {
      console.error('Error loading webinars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (webinar) => {
    setSelectedWebinar(webinar);
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthAbbrev = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { month: 'short' }).toUpperCase();
  };

  const getDay = (dateString) => {
    const date = new Date(dateString);
    return date.getDate();
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  // Topic icons mapping
  const topicIcons = {
    'Overview & Diagnosis': '🔬',
    'Supplementation & Dosing': '💊',
    'Hair, Skin & Nails': '✨',
    'Respiratory Health': '🫁',
    'Reproductive Health': '🌸',
    'Neurology': '🧠',
    'Bone, Teeth & Muscle': '🦴',
    'Autoimmune Conditions': '🛡️',
    'Cardiovascular Health': '❤️'
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-green via-green-dark to-primary-green text-white pt-32 pb-16 px-6 mt-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-9xl">☀️</div>
          <div className="absolute bottom-10 right-10 text-9xl">🩺</div>
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-4 py-2 rounded-full mb-6">
              <FaUserMd />
              <span className="text-sm font-semibold">For Healthcare Practitioners</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-montserrat font-bold text-white mb-4">
              Vitamin D Talks
            </h1>
            <div className="w-24 h-1 bg-gold mx-auto mb-6" />
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Monthly webinar series exploring the clinical applications of Vitamin D
              for healthcare professionals.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <FaCalendarAlt className="text-gold" />
                <span>Last Sunday of each month</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <FaClock className="text-gold" />
                <span>6:00 PM - 6:30 PM SAST</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <FaVideo className="text-gold" />
                <span>Live on Zoom</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-6 bg-cream">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="grid md:grid-cols-3 gap-8 items-center"
              ref={ref}
            >
              <div>
                <h2 className="text-3xl font-montserrat font-bold text-dark-text mb-4">
                  2026 Webinar Series
                </h2>
                <p className="text-gray-700 mb-6">
                  Join Dr. Boitumelo Phetla for an in-depth exploration of Vitamin D's role
                  across multiple medical specialties. Each monthly session covers a specific
                  topic with the latest research and clinical applications.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-primary-green mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Evidence-based presentations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-primary-green mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Live Q&A with Dr. Boitumelo</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-3">
                    <FaGraduationCap className="text-3xl text-gold" />
                  </div>
                  <h3 className="text-2xl font-bold text-dark-text mb-2">R200 per session</h3>
                  <p className="text-gray-600 mb-3 text-sm">HPCSA registered practitioners only</p>
                  <div className="text-xs text-gray-500 bg-cream p-3 rounded-lg">
                    Registration requires verification of your HPCSA number before
                    access to the webinar is granted.
                  </div>
                </div>
              </div>
              <div>
                <img
                  src="/Dates & Topics.jpeg"
                  alt="Vitamin D Talks 2026 Schedule"
                  className="w-full rounded-xl shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Webinars Grid */}
      <section className="py-16 px-6 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-dark-text mb-4">
              2026 Schedule
            </h2>
            <div className="w-20 h-1 bg-primary-green mx-auto mb-4" />
            <p className="text-gray-600 max-w-2xl mx-auto">
              Select a webinar below to register. Each session is held on the last Sunday of the month.
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
              <p className="mt-4 text-gray-600">Loading webinars...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {webinars.map((webinar, index) => {
                const upcoming = isUpcoming(webinar.date);
                const icon = topicIcons[webinar.title] || '📚';

                return (
                  <motion.div
                    key={webinar.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    className={`relative bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                      upcoming ? 'border-primary-green hover:border-gold' : 'border-gray-200 opacity-75'
                    }`}
                  >
                    {/* Date Badge */}
                    <div className="absolute top-4 left-4 bg-primary-green text-white rounded-lg overflow-hidden shadow-lg">
                      <div className="bg-green-dark px-3 py-1 text-xs font-bold text-center">
                        {getMonthAbbrev(webinar.date)}
                      </div>
                      <div className="px-3 py-2 text-2xl font-bold text-center">
                        {getDay(webinar.date)}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {!upcoming && (
                      <div className="absolute top-4 right-4 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        COMPLETED
                      </div>
                    )}
                    {upcoming && webinar.status === 'live' && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                        LIVE NOW
                      </div>
                    )}

                    {/* Content */}
                    <div className="pt-20 p-6">
                      <div className="text-4xl mb-3">{icon}</div>
                      <h3 className="text-xl font-montserrat font-bold text-dark-text mb-2">
                        {webinar.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {webinar.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <FaClock className="text-primary-green" />
                          <span>6:00 PM</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaVideo className="text-primary-green" />
                          <span>Zoom</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-xl font-bold text-primary-green">
                          R{webinar.price}
                        </span>
                        {upcoming ? (
                          <button
                            onClick={() => handleRegisterClick(webinar)}
                            className="px-6 py-2 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors"
                          >
                            Register
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Registration closed</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-cream">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-montserrat font-bold text-dark-text text-center mb-8">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-dark-text mb-2">Who can attend?</h3>
                <p className="text-gray-600">
                  These webinars are exclusively for HPCSA registered healthcare practitioners.
                  Your registration number will be verified before access is granted.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-dark-text mb-2">How do I join the webinar?</h3>
                <p className="text-gray-600">
                  After your registration is approved and payment confirmed, you'll receive
                  an email with the Zoom meeting link and calendar invite.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-dark-text mb-2">Will recordings be available?</h3>
                <p className="text-gray-600">
                  Recordings are not automatically provided. Live attendance is encouraged
                  for the interactive Q&A session with Dr. Boitumelo.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-dark-text mb-2">Can I register for multiple webinars?</h3>
                <p className="text-gray-600">
                  Yes! Each webinar is a separate registration. You're welcome to sign up
                  for as many sessions as you'd like.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-primary-green to-green-dark text-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-4">
              Ready to Expand Your Knowledge?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join fellow healthcare practitioners in exploring the fascinating world of Vitamin&nbsp;D.
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 600, behavior: 'smooth' });
              }}
              className="inline-block px-8 py-3 bg-gold text-white rounded-lg font-semibold hover:bg-gold-dark transition-colors"
            >
              View Schedule & Register
            </a>
          </motion.div>
        </div>
      </section>

      {/* Registration Modal */}
      <WebinarRegistrationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedWebinar(null);
        }}
        webinar={selectedWebinar}
      />
    </div>
  );
};

export default VitaminDTalks;
