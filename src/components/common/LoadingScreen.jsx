import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white px-6"
    >
      <div className="text-center w-full max-w-xs">
        {/* Logo */}
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          src="/Logo.png"
          alt="Dr. Boitumelo Wellness"
          className="h-16 w-auto mx-auto mb-8"
        />

        {/* Progress Bar */}
        <div className="w-full bg-sage rounded-full h-2 overflow-hidden mb-4">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="h-full bg-primary-green"
          />
        </div>

        {/* Loading Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-gray-600 font-montserrat"
        >
          Loading your wellness journey...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
