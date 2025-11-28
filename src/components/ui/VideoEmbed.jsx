import { motion } from 'framer-motion';

const VideoEmbed = ({ videoId, title, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="group"
    >
      <div className="aspect-video rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {title && (
        <p className="mt-3 text-sm font-medium text-gray-700 text-center group-hover:text-primary-green transition-colors">
          {title}
        </p>
      )}
    </motion.div>
  );
};

export default VideoEmbed;
