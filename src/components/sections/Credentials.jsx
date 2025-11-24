import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  FaGraduationCap,
  FaCertificate,
  FaAward,
  FaMedal,
  FaUniversity,
  FaStethoscope,
} from 'react-icons/fa';

const Credentials = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const education = [
    {
      icon: <FaStethoscope />,
      degree: 'MBCHB (Bachelor of Medicine and Bachelor of Surgery)',
      institution: 'Medical School',
      year: 'Medical Doctor',
    },
    {
      icon: <FaUniversity />,
      degree: 'MBA (Master of Business Administration)',
      institution: 'Business School',
      year: 'Business Leadership',
    },
  ];

  const certifications = [
    {
      icon: <FaCertificate />,
      title: 'Certified Vitamin D Practitioner',
      issuer: 'Professional Certification',
      color: 'primary-green',
    },
  ];

  const achievements = [
    {
      icon: <FaAward />,
      title: 'Founder of Dr Boitumelo Wellness',
      year: 'Nutritional Supplements Range',
    },
    {
      icon: <FaMedal />,
      title: 'Medical and Scientific Leader',
      year: 'Evidence-Based Wellness',
    },
    {
      icon: <FaAward />,
      title: '20+ Years Medical Practice',
      year: 'Dedicated Patient Care',
    },
  ];

  const stats = [
    { number: '20+', label: 'Years Practice' },
    { number: '1000+', label: 'Clients Helped' },
    { number: '3', label: 'Qualifications' },
    { number: '100%', label: 'Dedication' },
  ];

  return (
    <section id="credentials" className="section-padding bg-white" ref={ref}>
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="heading-secondary text-primary-green mb-4">
            Credentials & Expertise
          </h2>
          <div className="w-20 h-1 bg-gold mx-auto mb-6" />
          <p className="text-body max-w-3xl mx-auto">
            Backed by medical education (MBCHB), business leadership (MBA), and over
            20 years of clinical experience in nutritional medicine and wellness optimization.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Image Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/IMG_5781.jpg"
                  alt="Dr. Boitumelo Phetla"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-green/50 to-transparent" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-sage/50 rounded-xl p-4 text-center"
                  >
                    <div className="text-3xl font-bold text-primary-green mb-1">
                      {stat.number}
                    </div>
                    <div className="text-sm font-montserrat text-gray-700">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Content Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Education */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
            >
              <h3 className="heading-tertiary text-primary-green mb-6">
                Education
              </h3>
              <div className="space-y-4">
                {education.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start space-x-4 p-4 bg-cream rounded-xl hover:shadow-lg transition-shadow"
                  >
                    <div className="text-3xl text-primary-green mt-1">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-montserrat font-bold text-dark-text mb-1">
                        {item.degree}
                      </h4>
                      <p className="text-gray-600">{item.institution}</p>
                      <p className="text-sm text-gray-500">{item.year}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Certifications */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
            >
              <h3 className="heading-tertiary text-primary-green mb-6">
                Professional Certifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certifications.map((cert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-white border-2 border-sage rounded-xl p-4 hover:border-primary-green hover:shadow-lg transition-all"
                  >
                    <div
                      className={`text-3xl text-${cert.color} mb-3 flex items-center justify-center`}
                    >
                      {cert.icon}
                    </div>
                    <h4 className="font-montserrat font-semibold text-dark-text text-center mb-2">
                      {cert.title}
                    </h4>
                    <p className="text-sm text-gray-600 text-center">
                      {cert.issuer}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
            >
              <h3 className="heading-tertiary text-primary-green mb-6">
                Awards & Recognition
              </h3>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gold/10 to-transparent rounded-xl"
                  >
                    <div className="text-3xl text-gold">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-montserrat font-semibold text-dark-text">
                        {achievement.title}
                      </h4>
                      <p className="text-sm text-gray-600">{achievement.year}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Credentials;
