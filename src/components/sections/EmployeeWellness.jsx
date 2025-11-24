import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  FaBriefcase,
  FaBolt,
  FaBrain,
  FaHeart,
  FaChartLine,
  FaUsers,
  FaClipboardCheck,
  FaBoxes,
  FaHeadset,
  FaExclamationTriangle,
} from 'react-icons/fa';

const EmployeeWellness = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const benefits = [
    {
      icon: <FaBolt />,
      title: 'Increased Energy',
      description: 'Boost energy levels and mental focus throughout workdays',
    },
    {
      icon: <FaBrain />,
      title: 'Mental Clarity',
      description: 'Enhance cognitive function and decision-making abilities',
    },
    {
      icon: <FaHeart />,
      title: 'Reduced Discomfort',
      description: 'Decrease physical aches and pain for improved comfort',
    },
    {
      icon: <FaChartLine />,
      title: 'Higher Productivity',
      description: 'Improve overall work quality and team performance',
    },
  ];

  const targetGroups = [
    'Household staff and domestic workers',
    'Childcare providers',
    'Management and supervisory personnel',
    'Administrative assistants',
    'Core operational staff',
  ];

  const warningSignsLeft = [
    'Low energy and chronic fatigue',
    'Frequent missed deadlines',
    'Mood changes and irritability',
  ];

  const warningSignsRight = [
    'Increased customer complaints',
    'Excessive reliance on stimulants',
    'Decreased work quality',
  ];

  const enrollmentSteps = [
    {
      icon: <FaClipboardCheck />,
      step: '1',
      title: 'Complete Enrollment',
      description: 'Fill out our simple enrollment form with your team details',
    },
    {
      icon: <FaBoxes />,
      step: '2',
      title: 'Select Package',
      description: 'Choose from our flexible tiered packages with cost savings',
    },
    {
      icon: <FaHeadset />,
      step: '3',
      title: 'Receive Support',
      description: 'Get product dispatch with ongoing personalized support',
    },
  ];

  return (
    <section id="employee-wellness" className="section-padding bg-gradient-to-br from-primary-green to-green-dark text-white">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-block p-4 bg-white/10 rounded-full mb-6">
            <FaBriefcase className="text-4xl text-gold" />
          </div>
          <h2 className="heading-primary text-white mb-4">
            Employee Wellness Program
          </h2>
          <div className="w-20 h-1 bg-gold mx-auto mb-6" />
          <p className="text-lg text-white/90">
            A Tailored Solution to Your Employee Wellness & Wellbeing
          </p>
          <p className="text-base text-white/80 mt-4">
            Doctor-led analysis with measurable impact through personalized support plans
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * index, duration: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300"
            >
              <div className="text-3xl text-gold mb-4">{benefit.icon}</div>
              <h3 className="font-montserrat font-bold text-lg text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-white/80">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Target Groups & Warning Signs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Target Groups */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <FaUsers className="text-3xl text-gold" />
              <h3 className="font-montserrat font-bold text-2xl text-white">
                Who We Support
              </h3>
            </div>
            <ul className="space-y-3">
              {targetGroups.map((group, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="text-gold mt-1">✓</span>
                  <span className="text-white/90">{group}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Warning Signs */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <FaExclamationTriangle className="text-3xl text-gold" />
              <h3 className="font-montserrat font-bold text-2xl text-white">
                Warning Signs
              </h3>
            </div>
            <p className="text-white/80 mb-4 text-sm">
              Watch for these burnout indicators in your team:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ul className="space-y-3">
                {warningSignsLeft.map((sign, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="text-gold mt-1">⚠</span>
                    <span className="text-white/90 text-sm">{sign}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3">
                {warningSignsRight.map((sign, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="text-gold mt-1">⚠</span>
                    <span className="text-white/90 text-sm">{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Differentiation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-gold/10 border-2 border-gold rounded-2xl p-8 mb-16 text-center"
        >
          <h3 className="font-montserrat font-bold text-2xl text-white mb-4">
            What Sets Us Apart
          </h3>
          <p className="text-lg text-white/90 max-w-3xl mx-auto">
            Our programs feature <span className="font-semibold text-gold">doctor-formulated and certified</span> supplements with{' '}
            <span className="font-semibold text-gold">science-backed formulations</span> and{' '}
            <span className="font-semibold text-gold">optimal, evidence-based dosages</span> of ingredients—
            distinguishing them from typical supplements.
          </p>
        </motion.div>

        {/* Enrollment Process */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-16"
        >
          <h3 className="font-montserrat font-bold text-3xl text-white text-center mb-12">
            Our Simple 3-Step Process
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {enrollmentSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 + 0.1 * index, duration: 0.6 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 h-full shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gold rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.step}
                  </div>
                  <div className="text-4xl text-primary-green mb-4 mt-4 text-center group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <h4 className="font-montserrat font-bold text-xl text-dark-text mb-3 text-center">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 text-center">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Packages Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mb-16"
        >
          <h3 className="font-montserrat font-bold text-3xl text-white text-center mb-12">
            Our Packages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Option 1 - Get Started */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 text-center">
                <h4 className="font-montserrat font-bold text-xl mb-2">Option 1</h4>
                <p className="text-sm opacity-90">(Get Started)</p>
                <div className="mt-4 pt-4 border-t border-white/30">
                  <p className="font-bold text-lg">Oxidation VitaMinerals</p>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-green mt-1">•</span>
                    <span className="text-gray-700">Essential vitamins & minerals</span>
                  </li>
                </ul>
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">2 Months Supply</span>
                    <span className="font-bold text-primary-green">R500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">6 Months Supply</span>
                    <span className="font-bold text-primary-green">R1387.50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">12 Months Supply</span>
                    <span className="font-bold text-primary-green">R2550</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Option 2 - Recommended */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ring-4 ring-gold"
            >
              <div className="bg-gradient-to-br from-green-700 to-green-800 text-white p-6 text-center">
                <div className="inline-block bg-gold text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                  RECOMMENDED
                </div>
                <h4 className="font-montserrat font-bold text-xl mb-2">Option 2</h4>
                <p className="text-sm opacity-90">(Recommended)</p>
                <div className="mt-4 pt-4 border-t border-white/30">
                  <p className="font-bold text-lg">Silver Plus Package</p>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-green mt-1">•</span>
                    <span className="text-gray-700">Immuno</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-green mt-1">•</span>
                    <span className="text-gray-700">Nutri</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-green mt-1">•</span>
                    <span className="text-gray-700">Magnesium Glycinate</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-green mt-1">•</span>
                    <span className="text-gray-700">Omega 3</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-green mt-1">•</span>
                    <span className="text-gray-700">VitaMinerals</span>
                  </li>
                </ul>
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">2 Months Supply</span>
                    <span className="font-bold text-primary-green">R1300</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">6 Months Supply</span>
                    <span className="font-bold text-primary-green">R3607.50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">12 Months Supply</span>
                    <span className="font-bold text-primary-green">R6630</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Option 3 - Premium */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="bg-gradient-to-br from-gold to-gold-dark text-white p-6 text-center">
                <h4 className="font-montserrat font-bold text-xl mb-2">Option 3</h4>
                <p className="text-sm opacity-90">(Premium)</p>
                <div className="mt-4 pt-4 border-t border-white/30">
                  <p className="font-bold text-lg">Gold Standard Package</p>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-green mt-1">•</span>
                    <span className="text-gray-700">Vitaminerals</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-green mt-1">•</span>
                    <span className="text-gray-700">Collagen</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-green mt-1">•</span>
                    <span className="text-gray-700">Entero</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-green mt-1">•</span>
                    <span className="text-gray-700">Omega 3</span>
                  </li>
                </ul>
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">2 Months Supply</span>
                    <span className="font-bold text-primary-green">R1000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">6 Months Supply</span>
                    <span className="font-bold text-primary-green">R2775</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">12 Months Supply</span>
                    <span className="font-bold text-primary-green">R5100</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Flexible Pricing Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-8"
          >
            <h4 className="font-montserrat font-bold text-2xl text-white text-center mb-6">
              Flexible Pricing for Your Business
            </h4>
            <p className="text-white/90 text-center mb-8">
              The longer the commitment, the greater the savings for your company.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center space-x-4 bg-white/10 rounded-lg p-4">
                <div className="flex-shrink-0 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  0%
                </div>
                <div className="text-white">
                  <p className="font-semibold">Once-off purchase</p>
                  <p className="text-sm opacity-80">No discount</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 bg-white/10 rounded-lg p-4">
                <div className="flex-shrink-0 w-16 h-16 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  7.5%
                </div>
                <div className="text-white">
                  <p className="font-semibold">6-months supply</p>
                  <p className="text-sm opacity-80">7.5% discount</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 bg-white/10 rounded-lg p-4">
                <div className="flex-shrink-0 w-16 h-16 bg-green-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  15%
                </div>
                <div className="text-white">
                  <p className="font-semibold">12-months supply</p>
                  <p className="text-sm opacity-80">15% discount</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-2xl mx-auto"
        >
          <h3 className="font-montserrat font-bold text-2xl text-white mb-4">
            Ready to Invest in Your Team's Wellness?
          </h3>
          <p className="text-white/90 mb-6">
            Contact us today for flexible pricing packages with cost savings based on commitment length
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://wa.me/27615850286"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary bg-gold hover:bg-gold-dark"
            >
              WhatsApp: 061 585 0286
            </a>
            <a
              href="mailto:drbb@drboitumelowellness.co.za"
              className="btn-secondary border-white text-white hover:bg-white hover:text-primary-green"
            >
              Email Us
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EmployeeWellness;
