import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  FaVideo,
  FaPhone,
  FaUserMd,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaCalendarAlt,
  FaArrowRight,
} from 'react-icons/fa';
import BookingModal from '../components/ui/BookingModal';

const BookConsultation = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const consultationTypes = [
    {
      id: 'virtual',
      icon: <FaVideo className="text-4xl" />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'Virtual Consultation',
      price: 'R1,500',
      duration: '60 minutes',
      description: 'Connect with Dr. Boitumelo from the comfort of your home through a secure video call. This option includes 2 separate 30 minute sessions. (Assessment Consultation & Treatment Plan Consultation.)',
      features: [
        'Secure HD video call platform',
        'Screen sharing for test results review',
        'Digital prescription if needed',
        'No travel required',
      ],
      bestFor: 'Ideal for clients outside Pretoria or those preferring remote consultations',
    },
    {
      id: 'telephonic',
      icon: <FaPhone className="text-4xl" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'Telephonic Consultation',
      price: 'R500',
      duration: '30 minutes',
      description: 'A convenient phone consultation with Dr. Boitumelo. Great for quick check-ins, discussing test results, or getting wellness advice on the go.',
      features: [
        'Direct call from Dr. Boitumelo',
        'Flexible and convenient',
        'Most affordable option',
        'Perfect for quick consultations',
      ],
      bestFor: 'Ideal for quick follow-ups and clients with busy schedules',
    },
    {
      id: 'face_to_face',
      icon: <FaUserMd className="text-4xl" />,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      title: 'Face-to-Face Consultation',
      price: 'R1,500',
      duration: '60 minutes',
      description: 'An in-person consultation at our Garsfontein practice. This option includes 2 separate 30 minute sessions. (Assessment Consultation & Treatment Plan Consultation.)',
      features: [
        'Comprehensive physical assessment',
        'In-person supplement demonstration',
        'Immediate product recommendations',
        'Access to in-practice resources',
      ],
      bestFor: 'Ideal for new clients and comprehensive wellness assessments',
      location: '908 St Bernards Drive, Garsfontein, Pretoria East',
    },
  ];

  const whyChooseUs = [
    {
      icon: <FaUserMd className="text-2xl text-primary-green" />,
      title: 'Doctor-Led Care',
      description: 'All consultations are conducted by Dr. Boitumelo Phetla, a qualified medical professional specialising in holistic wellness.',
    },
    {
      icon: <FaCheckCircle className="text-2xl text-primary-green" />,
      title: 'Personalised Approach',
      description: 'Every consultation is tailored to your unique health needs, lifestyle, and wellness goals.',
    },
    {
      icon: <FaClock className="text-2xl text-primary-green" />,
      title: 'Flexible Scheduling',
      description: 'Book appointments that suit your schedule with our easy online booking system.',
    },
    {
      icon: <FaCalendarAlt className="text-2xl text-primary-green" />,
      title: 'Real-Time Availability',
      description: 'See available time slots instantly and secure your appointment with a 10-minute reservation hold.',
    },
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
            <h1 className="heading-primary text-white mb-4">Book a Consultation</h1>
            <div className="w-20 h-1 bg-gold mx-auto mb-6" />
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Take the first step towards optimal wellness with a personalised consultation with Dr. Boitumelo Phetla
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsBookingModalOpen(true)}
              className="px-8 py-4 bg-gold text-white rounded-full font-bold text-lg shadow-lg hover:bg-yellow-600 transition-all flex items-center space-x-2 mx-auto"
            >
              <span>Book Now</span>
              <FaArrowRight />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Consultation Types Section */}
      <section className="section-padding bg-sage/30" ref={ref}>
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="heading-secondary text-primary-green mb-4">Choose Your Consultation Type</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer three consultation options to suit your needs and preferences. All consultations are 30 minutes long and include a personalised wellness assessment.
            </p>
          </motion.div>

          {/* Consultation Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {consultationTypes.map((consultation, index) => (
              <motion.div
                key={consultation.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-primary-green to-green-dark p-6 text-white">
                  <div className={`${consultation.iconBg} ${consultation.iconColor} w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {consultation.icon}
                  </div>
                  <h3 className="font-montserrat font-bold text-2xl mb-2">
                    {consultation.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-gold">{consultation.price}</span>
                    <span className="flex items-center text-white/80 text-sm">
                      <FaClock className="mr-1" />
                      {consultation.duration}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {consultation.description}
                  </p>

                  {/* Location for face-to-face */}
                  {consultation.location && (
                    <div className="flex items-center text-gray-600 text-sm mb-4 bg-purple-50 p-3 rounded-lg">
                      <FaMapMarkerAlt className="mr-2 text-purple-600" />
                      <span>{consultation.location}</span>
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2 mb-4 flex-1">
                    {consultation.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <FaCheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Best For */}
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 italic">{consultation.bestFor}</p>
                  </div>

                  {/* Book Button */}
                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="w-full px-6 py-3 bg-primary-green text-white rounded-xl font-semibold hover:bg-green-dark transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Book This Consultation</span>
                    <FaArrowRight />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="heading-secondary text-primary-green mb-4">Why Book With Us?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience tailored solutions for your wellness & well-being.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="text-center p-6 bg-sage/20 rounded-xl"
              >
                <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  {item.icon}
                </div>
                <h3 className="font-montserrat font-bold text-lg text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="section-padding bg-sage/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="heading-secondary text-primary-green mb-8 text-center">What to Expect</h2>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-montserrat font-bold text-xl text-gray-800 mb-4">During 1st Consultation - Assessment</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">Comprehensive health and wellness assessment</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">Discussion of your health goals and concerns</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">Order relevant Investigations</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-xl text-gray-800 mb-4">During 2nd Consultation - Treatment Plan</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">Interpretation of Results</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">Personalized Supplements and/or Medication</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">Follow up date recommendation</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">Lifestyle modifications</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary-green to-green-dark text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-4">
              Ready to Start Your Wellness Journey?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Book your consultation today and take the first step towards a healthier, more balanced you.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsBookingModalOpen(true)}
              className="px-10 py-4 bg-gold text-white rounded-full font-bold text-lg shadow-lg hover:bg-yellow-600 transition-all flex items-center space-x-2 mx-auto"
            >
              <FaCalendarAlt />
              <span>Book Your Consultation</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} />
    </div>
  );
};

export default BookConsultation;
