import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FaCheckCircle, FaHeart, FaLeaf, FaUserMd } from 'react-icons/fa';

const About = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const features = [
    {
      icon: <FaUserMd />,
      title: 'Expert Guidance',
      description: 'Personalized wellness plans backed by years of clinical experience',
    },
    {
      icon: <FaLeaf />,
      title: 'Natural Approach',
      description: 'Holistic solutions using nature\'s most powerful ingredients',
    },
    {
      icon: <FaHeart />,
      title: 'Patient-Centered',
      description: 'Your health goals and wellness journey are our top priority',
    },
  ];

  const highlights = [
    'MBCHB (Medical Doctor)',
    'MBA (Master of Business Administration)',
    'Certified Vitamin D Practitioner',
    '20+ years of medical practice experience',
    'Founder of Dr Boitumelo Wellness',
    'Specializes in nutritional deficiency correction',
  ];

  return (
    <section id="about" className="section-padding bg-cream" ref={ref}>
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/IMG_5735-1.png"
                alt="Dr. Boitumelo Phetla"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-green/30 to-transparent" />
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -bottom-6 -right-6 bg-gold text-white p-6 rounded-2xl shadow-2xl"
            >
              <div className="text-center">
                <div className="text-3xl font-bold">20+</div>
                <div className="text-sm font-montserrat">Years</div>
                <div className="text-xs">Experience</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Content Column */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="heading-secondary text-primary-green mb-4"
            >
              Meet Dr. Boitumelo Phetla
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="w-20 h-1 bg-gold mb-6"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 }}
              className="text-body mb-6"
            >
              With over 20 years of medical practice experience, Dr. Boitumelo Phetla
              (MBCHB, MBA, Certified Vitamin D Practitioner) founded Dr Boitumelo Wellness
              to address nutritional deficiencies and optimize wellness through evidence-based,
              personalized solutions.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="text-body mb-8"
            >
              Dr. Boitumelo's journey into nutritional wellness was inspired by her own
              health challenges—from vitiligo and postpartum depression to discovering
              critical vitamin D and iron deficiencies. This personal experience drives
              her mission to keep clients "joyfully well" through tailored nutritional
              interventions designed for our population and environmental needs.
            </motion.p>

            {/* Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.7 }}
              className="space-y-3 mb-8"
            >
              {highlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <FaCheckCircle className="text-primary-green text-xl flex-shrink-0" />
                  <span className="text-gray-700 font-raleway">{highlight}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  className="text-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="text-3xl text-primary-green mb-2 flex justify-center">
                    {feature.icon}
                  </div>
                  <h4 className="font-montserrat font-semibold text-dark-text mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
