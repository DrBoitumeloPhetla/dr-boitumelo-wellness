import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  FaClipboardList,
  FaCapsules,
  FaUsers,
  FaSeedling,
  FaDna,
  FaCalendarCheck,
} from 'react-icons/fa';

const Services = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const services = [
    {
      icon: <FaClipboardList />,
      title: 'Doctor-Led Wellness Assessment & Health Analysis',
      description:
        'A comprehensive health review (biometrics, lifestyle, stress levels, gut health, hormones) led by a medical professional.',
      features: [
        'Complete health review',
        'Biometrics and lifestyle assessment',
        'Stress levels and gut health evaluation',
        'Personalised report with wellness roadmap',
        'Doctor-led professional analysis',
      ],
    },
    {
      icon: <FaCapsules />,
      title: 'Personalised Supplement Program',
      description:
        'Customising supplement plans based on the assessment; e.g., immunity support, gut-balance, hormone regulation, cellular regeneration.',
      features: [
        'Supplement plan designed for your body',
        'Immunity and gut balance support',
        'Hormone regulation guidance',
        'Ongoing monitoring and periodic review',
        'Cellular regeneration focus',
      ],
    },
    {
      icon: <FaUsers />,
      title: 'Corporate Employee Wellness Solutions',
      description:
        'A programme aimed at companies: employee wellness screening, tailored supplement packs for teams, stress/mood monitoring, productivity support.',
      features: [
        'Employee wellness screening',
        'Tailored supplement packs for teams',
        'Stress and mood monitoring',
        'On-site wellness talks',
        'Monthly check-ins and digital dashboards for HR',
      ],
    },
    {
      icon: <FaSeedling />,
      title: 'Gut-Health & Microbiome Support Programme',
      description:
        'Dedicated service focusing on gut health: probiotics, gut-brain axis, digestion, skin connection.',
      features: [
        'Comprehensive gut health focus',
        'Probiotics and gut-brain axis support',
        'Digestion and skin connection',
        'Dietary guidance and labs',
        'Follow-up supplementation',
      ],
    },
    {
      icon: <FaDna />,
      title: 'Hormonal & Cellular Regeneration Programme',
      description:
        'For clients needing deeper support: hormone optimisation (thyroid, adrenal, sex hormones), cellular repair, anti-oxidative stress.',
      features: [
        'Hormone optimisation support',
        'Thyroid, adrenal, and sex hormone focus',
        'Cellular repair and anti-oxidative stress',
        'Lab work and lifestyle coaching',
        'Supplement stack and periodic review',
      ],
    },
    {
      icon: <FaCalendarCheck />,
      title: 'Lifestyle Coaching & Ongoing Wellness Subscription',
      description:
        'A subscription-based service where clients receive regular check-ins, monthly coaching (nutrition, sleep, stress, movement), supplement refreshes, tracking of progress.',
      features: [
        'Regular check-ins and monthly coaching',
        'Nutrition, sleep, stress, and movement support',
        'Supplement refreshes included',
        'Progress tracking and monitoring',
        'Support for sustained well-being',
      ],
    },
  ];

  return (
    <section id="services" className="section-padding bg-sage/30" ref={ref}>
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="heading-secondary text-primary-green mb-4">
            Wellness Services
          </h2>
          <div className="w-20 h-1 bg-gold mx-auto mb-6" />
          <p className="text-body max-w-3xl mx-auto">
            Comprehensive holistic health services designed to support your
            wellness journey from consultation to ongoing care.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * index, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
            >
              {/* Icon Header */}
              <div className="bg-gradient-to-br from-primary-green to-green-dark p-6 text-white">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="font-montserrat font-bold text-2xl">
                  {service.title}
                </h3>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <span className="text-primary-green mr-2 mt-1">✓</span>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Services;
