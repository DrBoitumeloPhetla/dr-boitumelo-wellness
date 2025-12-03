import { motion } from 'framer-motion';
import { FaYoutube, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import VideoEmbed from '../ui/VideoEmbed';

const MediaSection = ({ showAllVideos = false }) => {
  const videos = [
    {
      id: 'x-hKdWFwoc8',
      title: 'Health & Wellness Insights'
    },
    {
      id: 'uTJcYVF_gGY',
      title: 'Expert Medical Advice'
    },
    {
      id: 'LedyP0jUF8I',
      title: 'Holistic Health Approach'
    },
    {
      id: 'AQ1zvMFZfRg',
      title: 'Featured Talk'
    }
  ];

  const socialLinks = [
    {
      name: 'YouTube',
      url: 'https://youtube.com/@drboitumelophetla',
      icon: FaYoutube,
      color: 'hover:text-red-600'
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/drboitumelophetla',
      icon: FaInstagram,
      color: 'hover:text-pink-600'
    },
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@drboitumelo_wellness',
      icon: SiTiktok,
      color: 'hover:text-black'
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/dr-boitumelo-phetla-md-mba-78020960',
      icon: FaLinkedin,
      color: 'hover:text-blue-700'
    }
  ];

  const displayVideos = showAllVideos ? videos : videos;

  return (
    <section className="section-padding bg-sage/20">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="heading-secondary text-primary-green mb-4">
            Featured Talks & Media
          </h2>
          <div className="w-20 h-1 bg-gold mx-auto mb-4" />
          <p className="text-body max-w-2xl mx-auto">
            Watch Dr. Boitumelo share expert insights on wellness, health, and holistic living
          </p>
        </motion.div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {displayVideos.map((video, index) => (
            <VideoEmbed
              key={video.id}
              videoId={video.id}
              title={video.title}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Social Media Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center"
        >
          <p className="text-gray-700 font-medium mb-6">
            Follow Dr. Boitumelo for more wellness content
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-2 px-6 py-3 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 text-gray-700 ${social.color} group`}
                >
                  <Icon className="text-2xl group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">{social.name}</span>
                </a>
              );
            })}
          </div>
        </motion.div>

        {/* View More Button (only on home page) */}
        {!showAllVideos && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <a
              href="https://youtube.com/@drboitumelophetla"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-8 py-3 bg-primary-green text-white rounded-lg font-semibold hover:bg-green-dark transition-colors shadow-lg hover:shadow-xl"
            >
              <FaYoutube className="text-xl" />
              <span>View More on YouTube</span>
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default MediaSection;
