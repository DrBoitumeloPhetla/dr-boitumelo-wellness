import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

const FloatingCartButton = () => {
  const { getCartCount, setIsCartOpen } = useCart();
  const cartCount = getCartCount();

  // Only show on mobile/tablet (hide on desktop where header cart is always visible)
  if (cartCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 left-6 lg:hidden bg-primary-green hover:bg-green-dark text-white p-4 rounded-full shadow-2xl z-40 flex items-center justify-center"
        aria-label="Open shopping cart"
      >
        <FaShoppingCart className="text-xl" />
        {/* Badge with cart count */}
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-gold text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
        >
          {cartCount}
        </motion.span>
      </motion.button>
    </AnimatePresence>
  );
};

export default FloatingCartButton;
