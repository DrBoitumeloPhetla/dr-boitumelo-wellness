import { useState } from 'react';
import { motion } from 'framer-motion';
import BookingModal from '../ui/BookingModal';

const Hero = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const scrollToProducts = () => {
    document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24"
    >
      {/* Clean Background with Subtle Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-sage/30 via-cream to-white z-0" />

      {/* Subtle Background Image - Very Light */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: 'url(/PSD_05-2-2048x1582.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Content */}
      <div className="relative z-20 container-custom px-6 text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-montserrat font-bold mb-6 text-dark-text">
            Fueling Your Life,
            <br />
            <span className="text-primary-green">Cell by Cell</span>
          </h1>

          {/* Subheading */}
          <p className="text-2xl md:text-3xl font-raleway mb-8 text-gray-700">
            Science-Backed Wellness
          </p>

          {/* Description */}
          <p className="text-lg md:text-xl font-raleway mb-12 max-w-3xl mx-auto text-gray-600 leading-relaxed">
            Premium nutritional supplements designed by a medical doctor for immunity,
            gut balance, hormonal regulation, and cellular regeneration.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToProducts}
              className="btn-primary w-full sm:min-w-[200px] text-lg py-4"
            >
              Shop Supplements
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsBookingModalOpen(true)}
              className="btn-secondary w-full sm:min-w-[200px] text-lg py-4"
            >
              Book Consultation
            </motion.button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl font-bold text-primary-green mb-2">10+</div>
              <div className="text-sm font-montserrat text-gray-700 uppercase tracking-wide">
                Years Experience
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl font-bold text-primary-green mb-2">1000+</div>
              <div className="text-sm font-montserrat text-gray-700 uppercase tracking-wide">
                Happy Clients
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl font-bold text-primary-green mb-2">100%</div>
              <div className="text-sm font-montserrat text-gray-700 uppercase tracking-wide">
                Locally Made
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-15" />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </section>
  );
};

export default Hero;
