import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FaEnvelope, FaPhone, FaLinkedin } from 'react-icons/fa';

const Team = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const teamMembers = [
    {
      name: 'Dr. Boitumelo Phetla',
      role: 'Founder & Medical Director',
      image: '/IMG_5781.jpg',
      qualifications: ['MBCHB', 'MBA', 'Certified Vitamin D Practitioner'],
      bio: 'Medical doctor with over 20 years of clinical experience. Founded Dr Boitumelo Wellness to address nutritional deficiencies and optimize wellness through evidence-based, personalized solutions.',
      email: '',
      phone: '',
    },
    {
      name: 'Dr. Nontobeko Mbatha',
      role: 'Pathology Specialist',
      image: '/Dr. Nontobeko Mbatha.png',
      qualifications: ['Founder of Tumeladi Diagnostic Pathologists'],
      bio: 'First black female-owned histopathology laboratory in Johannesburg and Vaal area. Mother of two, born in Ladysmith, KwaZulu-Natal.',
      email: 'drnontobeko.mbatha@gmail.com',
      phone: '+27837634138',
    },
    {
      name: 'Dr. Cornelia Phetla',
      role: 'Dietitian & Academic',
      image: '/Dr. Cornelia Phetla.jpeg',
      qualifications: [
        'BSc Dietetics (2002)',
        'Master\'s Public Health (2013)',
        'PhD Public Health (2022)',
      ],
      bio: 'Lecturer at the Department of Human Nutrition at Sefako Makgatho Health Sciences University. Over a decade of experience in nutrition, public health, and clinical dietetics.',
      email: 'drcphetla@gmail.com',
      phone: '+27722158953',
    },
    {
      name: 'Justin Swartz',
      role: 'Fitness Professional & Wellness Coach',
      image: '/Justin Swartz.png',
      qualifications: ['Exercise Specialist', 'Founder of JS Fitness'],
      bio: 'Specializes in functional training, strength conditioning, and habit coaching with 10 years of experience helping clients achieve their fitness goals.',
      email: 'info@jsfitnesssa.com',
      phone: '+27837634138',
    },
    {
      name: 'Potlako Moloya',
      role: 'Wellness Manager',
      image: '/Potlako Moloya.jpg',
      qualifications: ['Somatology', 'Pharmaceutical Science Advanced Diploma'],
      bio: 'Manages wellness operations and ensures clients receive the highest quality care and personalized attention.',
      email: 'sales@drboitumelowellness.co.za',
      phone: '',
    },
    {
      name: 'Basetsana Motlhamme',
      role: 'Brand Manager',
      image: '/Basetsana Motlhamme.jpg',
      qualifications: [
        'Master of Business Leadership',
        'Post-Graduate Diploma Marketing Management',
        'BTech Public Relations',
      ],
      bio: 'Leads brand strategy and marketing initiatives, ensuring Dr Boitumelo Wellness reaches and serves our community effectively.',
      email: 'wellness@drphetla.co.za',
      phone: '',
    },
    {
      name: 'Lerato Mampuru',
      role: 'Practice Manager',
      image: '/Lerato Mampuru.png',
      qualifications: ['BCom Accounting Science'],
      bio: 'Manages day-to-day practice operations, ensuring smooth administrative processes and excellent patient experience.',
      email: 'admin@drboitumelowellness.co.za',
      phone: '',
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
            <h1 className="heading-primary text-white mb-4">Meet Our Team</h1>
            <div className="w-20 h-1 bg-gold mx-auto mb-6" />
            <p className="text-lg md:text-xl text-white/90">
              A dedicated team of health professionals committed to your wellness journey
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Team Member - Dr. Boitumelo */}
      <section className="section-padding bg-white" ref={ref}>
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="md:flex">
                {/* Image */}
                <div className="relative md:w-1/2 h-96 md:h-auto overflow-hidden">
                  <img
                    src={teamMembers[0].image}
                    alt={teamMembers[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-montserrat font-bold text-2xl text-white mb-1">
                      {teamMembers[0].name}
                    </h3>
                    <p className="text-gold font-semibold text-lg">{teamMembers[0].role}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="md:w-1/2 p-8">
                  {/* Qualifications */}
                  <div className="mb-6">
                    <h4 className="font-montserrat font-semibold text-base text-primary-green mb-3">
                      Qualifications
                    </h4>
                    <ul className="space-y-2">
                      {teamMembers[0].qualifications.map((qual, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="text-primary-green mr-2">•</span>
                          <span>{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                    {teamMembers[0].bio}
                  </p>

                  {/* Contact */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    {teamMembers[0].email && (
                      <a
                        href={`mailto:${teamMembers[0].email}`}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-green transition-colors"
                      >
                        <FaEnvelope className="text-primary-green" />
                        <span className="truncate">{teamMembers[0].email}</span>
                      </a>
                    )}
                    {teamMembers[0].phone && (
                      <a
                        href={`tel:${teamMembers[0].phone}`}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-green transition-colors"
                      >
                        <FaPhone className="text-primary-green" />
                        <span>{teamMembers[0].phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Grid - Remaining Team Members */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-dark-text mb-4">
              Our Expert Team
            </h2>
            <div className="w-20 h-1 bg-primary-green mx-auto mb-4" />
            <p className="text-gray-600">
              Supporting your wellness journey with specialized expertise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.slice(1).map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * (index + 1), duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${
                      member.name === 'Dr. Nontobeko Mbatha'
                        ? 'object-cover object-top'
                        : member.name === 'Potlako Moloya'
                        ? 'object-cover object-top scale-125'
                        : member.name === 'Basetsana Motlhamme'
                        ? 'object-cover object-top'
                        : 'object-cover'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-montserrat font-bold text-xl text-white mb-1">
                      {member.name}
                    </h3>
                    <p className="text-gold font-semibold">{member.role}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Qualifications */}
                  <div className="mb-4">
                    <h4 className="font-montserrat font-semibold text-sm text-primary-green mb-2">
                      Qualifications
                    </h4>
                    <ul className="space-y-1">
                      {member.qualifications.map((qual, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="text-primary-green mr-2">•</span>
                          <span>{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                    {member.bio}
                  </p>

                  {/* Contact */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-green transition-colors"
                      >
                        <FaEnvelope className="text-primary-green" />
                        <span className="truncate">{member.email}</span>
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-green transition-colors"
                      >
                        <FaPhone className="text-primary-green" />
                        <span>{member.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-gradient-to-br from-primary-green to-green-dark text-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-4">
              Ready to Start Your Wellness Journey?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Our expert team is here to guide you every step of the way
            </p>
            <a href="/#contact" className="btn-primary bg-gold hover:bg-gold-dark">
              Get In Touch
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Team;
