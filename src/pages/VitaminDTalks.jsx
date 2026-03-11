import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FaCalendarAlt, FaClock, FaUserMd, FaGraduationCap, FaVideo, FaAward, FaMoneyBillWave, FaPlayCircle } from 'react-icons/fa';
import { getAllWebinars } from '../lib/supabase';
import WebinarRegistrationModal from '../components/ui/WebinarRegistrationModal';

// Fallback display data (used if DB fetch fails)
const FALLBACK_WEBINAR = {
  id: null,
  title: 'Vitamin D Talks',
  description: 'An accredited presentation exploring the ripple effect of Vitamin D deficiency across all body systems. Rather than covering individual systems separately, this holistic approach demonstrates how Vitamin D impacts every aspect of health — and why it matters in your clinical practice.',
  date: '2026-03-26',
  time: '19h00 - 20h00',
  price: 450,
  cpd_points: 1,
  platform: 'Zoom',
  presenter: 'Dr. Boitumelo Phetla',
  accredited: true,
};

const VitaminDTalks = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [detailsRef, detailsInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [faqRef, faqInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [webinar, setWebinar] = useState(FALLBACK_WEBINAR);

  // Load the webinar from Supabase to get the real database ID
  // We only need the ID for registration — all display data stays hardcoded
  useEffect(() => {
    const loadWebinar = async () => {
      try {
        const webinars = await getAllWebinars();
        // Only match the exact March 26 2026 webinar
        const match = webinars?.find(w => w.date === '2026-03-26');
        if (match) {
          setWebinar({
            ...FALLBACK_WEBINAR,
            id: match.id,
          });
        }
      } catch (err) {
        console.error('Error loading webinar:', err);
      }
    };
    loadWebinar();
  }, []);

  const isUpcoming = new Date(webinar.date) > new Date();


  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-green via-green-dark to-primary-green text-white pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-6 mt-20 overflow-hidden">
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
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-montserrat font-bold text-white mb-4">
              The Vitamin D Talk
            </h1>
            <div className="w-24 h-1 bg-gold mx-auto mb-4 md:mb-6" />
            <p className="text-base md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
              An accredited presentation on Vitamin D Talks
              by Dr. Boitumelo Phetla.
            </p>
            <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-2 md:gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-3 md:px-4 py-2 rounded-lg justify-center">
                <FaCalendarAlt className="text-gold flex-shrink-0" />
                <span>26 March 2026</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 md:px-4 py-2 rounded-lg justify-center">
                <FaClock className="text-gold flex-shrink-0" />
                <span>19h00 - 20h00</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 md:px-4 py-2 rounded-lg justify-center">
                <FaVideo className="text-gold flex-shrink-0" />
                <span>Live on Zoom</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 md:px-4 py-2 rounded-lg justify-center">
                <FaAward className="text-gold flex-shrink-0" />
                <span>1 CPD Point</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Webinar Section */}
      <section className="py-10 md:py-16 px-4 md:px-6 bg-cream" ref={ref}>
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="grid md:grid-cols-2 gap-6 md:gap-10 items-center"
            >
              {/* Poster */}
              <div className="relative group">
                <img
                  src="/Vitamin D Talks Webinar Poster.jpeg"
                  alt="The Vitamin D Talk - Vitamin D Talks"
                  className="w-full rounded-2xl shadow-2xl"
                />
              </div>

              {/* Details */}
              <div>
                <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-3 py-1.5 rounded-full text-sm font-semibold mb-4">
                  <FaAward />
                  <span>Accredited Course</span>
                </div>

                <h2 className="text-2xl md:text-4xl font-montserrat font-bold text-dark-text mb-3 md:mb-4">
                  Vitamin D Talks
                </h2>

                <p className="text-gray-700 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                  {webinar.description}
                </p>

                {/* Key Details Cards */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-6">
                  <div className="bg-white rounded-xl p-3 md:p-4 shadow-md text-center">
                    <FaCalendarAlt className="text-xl md:text-2xl text-primary-green mx-auto mb-1.5" />
                    <p className="text-xs md:text-sm text-gray-500">Date</p>
                    <p className="font-bold text-dark-text text-sm md:text-base">26 March 2026</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 md:p-4 shadow-md text-center">
                    <FaClock className="text-xl md:text-2xl text-primary-green mx-auto mb-1.5" />
                    <p className="text-xs md:text-sm text-gray-500">Time</p>
                    <p className="font-bold text-dark-text text-sm md:text-base">19h00 - 20h00</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 md:p-4 shadow-md text-center">
                    <FaGraduationCap className="text-xl md:text-2xl text-gold mx-auto mb-1.5" />
                    <p className="text-xs md:text-sm text-gray-500">CPD Points</p>
                    <p className="font-bold text-dark-text text-sm md:text-base">1 CPD Point</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 md:p-4 shadow-md text-center">
                    <FaMoneyBillWave className="text-xl md:text-2xl text-primary-green mx-auto mb-1.5" />
                    <p className="text-xs md:text-sm text-gray-500">Investment</p>
                    <p className="font-bold text-dark-text text-lg md:text-xl">R450</p>
                  </div>
                </div>

                {/* Register Button */}
                {isUpcoming ? (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full px-8 py-4 bg-primary-green text-white rounded-xl font-bold text-lg hover:bg-green-dark transition-colors shadow-lg hover:shadow-xl"
                  >
                    Register Now - R450
                  </button>
                ) : (
                  <div className="w-full px-8 py-4 bg-gray-400 text-white rounded-xl font-bold text-lg text-center">
                    This event has passed
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Invitation Section */}
      <section className="py-10 md:py-16 px-4 md:px-6 bg-white" ref={detailsRef}>
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={detailsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-dark-text mb-4">
              Watch the Invitation
            </h2>
            <div className="w-20 h-1 bg-primary-green mx-auto mb-8" />

            {/* Video Player */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video">
              {showVideo ? (
                <video
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  src="/Vitamin D Webinar Invitation Video.mp4"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <button
                  onClick={() => setShowVideo(true)}
                  className="w-full h-full relative group cursor-pointer bg-gradient-to-br from-primary-green via-green-dark to-primary-green"
                >
                  {/* Decorative sun element */}
                  <div className="absolute top-6 right-8 text-7xl opacity-20">☀️</div>

                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
                    <p className="text-white/70 text-sm font-medium uppercase tracking-widest">Dr. Boitumelo Phetla</p>
                    <div className="bg-white/15 backdrop-blur-sm rounded-full p-5 group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300 shadow-lg">
                      <FaPlayCircle className="text-5xl md:text-6xl text-white drop-shadow-lg" />
                    </div>
                    <div className="text-center">
                      <p className="text-white text-lg md:text-xl font-bold font-montserrat">Watch the Invitation</p>
                      <p className="text-white/60 text-sm mt-1">The Vitamin D Talk - 26 March 2026</p>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* What You'll Learn Section */}
      <section className="py-10 md:py-16 px-4 md:px-6 bg-cream">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={detailsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-dark-text mb-4">
                What You'll Learn
              </h2>
              <div className="w-20 h-1 bg-primary-green mx-auto mb-4" />
              <p className="text-gray-600 max-w-2xl mx-auto">
                This presentation takes a holistic approach, showing the interconnected ripple effect of Vitamin D deficiency across all body systems.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: '🔬', title: 'Clinical Relevance', desc: 'Understanding why Vitamin D matters in everyday general practice' },
                { icon: '🧬', title: 'Systemic Impact', desc: 'How deficiency creates a ripple effect across all organ systems' },
                { icon: '📊', title: 'Evidence-Based Insights', desc: 'Latest research and clinical data on Vitamin D applications' },
                { icon: '💊', title: 'Practical Applications', desc: 'Actionable knowledge you can apply in your clinical practice' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={detailsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1 * i }}
                  className="bg-white rounded-xl p-6 shadow-md flex gap-4 items-start"
                >
                  <span className="text-3xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-dark-text mb-1">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-10 md:py-16 px-4 md:px-6 bg-white" ref={faqRef}>
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={faqInView ? { opacity: 1, y: 0 } : {}}
              className="text-3xl font-montserrat font-bold text-dark-text text-center mb-8"
            >
              Frequently Asked Questions
            </motion.h2>

            <div className="space-y-4">
              <div className="bg-cream rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-dark-text mb-2">Who can attend?</h3>
                <p className="text-gray-600">
                  This accredited course is exclusively for healthcare practitioners.
                  Your HPCSA/SANC registration number will be verified before access is granted.
                </p>
              </div>

              <div className="bg-cream rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-dark-text mb-2">How much does it cost?</h3>
                <p className="text-gray-600">
                  The course fee is R450 per person. This includes the accredited 1-hour presentation and 1 CPD point upon completion.
                </p>
              </div>

              <div className="bg-cream rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-dark-text mb-2">How do I join the webinar?</h3>
                <p className="text-gray-600">
                  After registration and payment, your HPCSA number will be verified. Once approved, you'll receive
                  an email with the Zoom meeting link and calendar invite.
                </p>
              </div>

              <div className="bg-cream rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-dark-text mb-2">Will I receive a CPD certificate?</h3>
                <p className="text-gray-600">
                  Yes, this course is accredited. You will earn 1 CPD point for attending the full 1-hour presentation.
                </p>
              </div>

              <div className="bg-cream rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-dark-text mb-2">Will recordings be available?</h3>
                <p className="text-gray-600">
                  Recordings are not automatically provided. Live attendance is encouraged
                  for the interactive Q&A session with Dr. Boitumelo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-16 px-4 md:px-6 bg-gradient-to-br from-primary-green to-green-dark text-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-4">
              Secure Your Spot
            </h2>
            <p className="text-lg text-white/90 mb-3">
              Join fellow healthcare practitioners for this accredited Vitamin D presentation.
            </p>
            <p className="text-white/80 mb-8">
              26 March 2026 &bull; 19h00 - 20h00 &bull; Zoom &bull; R450 &bull; 1 CPD Point
            </p>
            {isUpcoming ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-block px-8 py-4 bg-gold text-white rounded-xl font-bold text-lg hover:bg-gold-dark transition-colors shadow-lg"
              >
                Register Now
              </button>
            ) : (
              <span className="inline-block px-8 py-4 bg-white/20 text-white rounded-xl font-bold text-lg">
                This event has passed
              </span>
            )}
          </motion.div>
        </div>
      </section>

      {/* Registration Modal */}
      <WebinarRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        webinar={webinar}
      />
    </div>
  );
};

export default VitaminDTalks;
