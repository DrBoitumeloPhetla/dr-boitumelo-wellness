import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FaShoppingCart, FaStar, FaHeart, FaCheck, FaExclamationTriangle, FaTag, FaChevronDown, FaChevronUp, FaPrescriptionBottle } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { getActiveProducts, getActiveDiscounts } from '../lib/supabase';
import PrescriptionRequestModal from '../components/ui/PrescriptionRequestModal';

const Shop = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [addedToCart, setAddedToCart] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
    loadDiscounts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getActiveProducts();

      // If database is empty or fails, fallback to local products
      if (!data || data.length === 0) {
        const productsData = await import('../data/products.json');
        const localProducts = productsData.products.map(p => ({
          ...p,
          image_url: p.image,
          stock_quantity: 100, // Default stock for local products
          low_stock_threshold: 10,
          status: 'active'
        }));
        setProducts(localProducts);
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to local products on error
      try {
        const productsData = await import('../data/products.json');
        const localProducts = productsData.products.map(p => ({
          ...p,
          image_url: p.image,
          stock_quantity: 100,
          low_stock_threshold: 10,
          status: 'active'
        }));
        setProducts(localProducts);
      } catch (fallbackError) {
        console.error('Error loading fallback products:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDiscounts = async () => {
    try {
      const data = await getActiveDiscounts();
      setDiscounts(data);
    } catch (error) {
      console.error('Error loading discounts:', error);
    }
  };

  const getProductDiscount = (product) => {
    // Find applicable discount for this product
    return discounts.find(discount => {
      if (discount.apply_to === 'all') return true;
      if (discount.apply_to === 'specific' && discount.product_ids?.includes(product.id)) return true;
      return false;
    });
  };

  const calculateDiscountedPrice = (product) => {
    const discount = getProductDiscount(product);
    if (!discount) return null;

    const price = parseFloat(product.price);
    let discountedPrice = price;

    switch (discount.discount_type) {
      case 'percentage':
        discountedPrice = price - (price * (discount.discount_value / 100));
        break;
      case 'fixed_amount':
        discountedPrice = Math.max(0, price - discount.discount_value);
        break;
      case 'buy_x_get_y':
        // Buy X Get Y will be handled in cart
        return null;
      default:
        return null;
    }

    return {
      originalPrice: price,
      discountedPrice: discountedPrice,
      discount: discount
    };
  };

  const categories = [
    'All',
    ...new Set(products.map((p) => p.category)),
  ];

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleExpanded = (productId) => {
    setExpandedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToCart = (product) => {
    // Calculate discount info first
    const priceInfo = calculateDiscountedPrice(product);

    // Check if product requires prescription
    if (product.requires_prescription) {
      // Pass product with discount info to modal
      const productWithDiscount = {
        ...product,
        ...(priceInfo && {
          originalPrice: priceInfo.originalPrice,
          discountedPrice: priceInfo.discountedPrice,
          discount: priceInfo.discount
        })
      };
      setSelectedProduct(productWithDiscount);
      setPrescriptionModalOpen(true);
      return;
    }

    // Check if product is out of stock
    if (product.status === 'out_of_stock' || product.stock_quantity <= 0) {
      alert('This product is currently out of stock.');
      return;
    }
    const finalPrice = priceInfo ? priceInfo.discountedPrice : parseFloat(product.price);

    addToCart({
      ...product,
      image: product.image_url,
      price: finalPrice,
      originalPrice: parseFloat(product.price),
      discount: priceInfo ? priceInfo.discount : null
    });
    // Show visual feedback
    setAddedToCart((prev) => [...prev, product.id]);
    setTimeout(() => {
      setAddedToCart((prev) => prev.filter((id) => id !== product.id));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-green to-green-dark text-white pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 mt-16 sm:mt-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="heading-primary text-white mb-4">Shop Premium Supplements</h1>
            <div className="w-20 h-1 bg-gold mx-auto mb-6" />
            <p className="text-lg md:text-xl text-white/90">
              Science-backed formulations designed to support your wellness journey with the highest quality natural ingredients
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="section-padding bg-white" ref={ref}>
        <div className="container-custom">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : (
            <>
              {/* Category Filter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-3 mb-12"
              >
                {categories.map((category, index) => (
                  <motion.button
                    key={category}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-2 rounded-full font-montserrat font-medium transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-primary-green text-white shadow-lg scale-105'
                        : 'bg-cream text-dark-text hover:bg-sage'
                    }`}
                  >
                    {category}
                  </motion.button>
                ))}
              </motion.div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => {
              const isOutOfStock = product.status === 'out_of_stock' || product.stock_quantity <= 0;
              const isLowStock = product.stock_quantity <= product.low_stock_threshold && !isOutOfStock;
              const priceInfo = calculateDiscountedPrice(product);
              const hasDiscount = priceInfo !== null;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * Math.min(index, 8), duration: 0.5 }}
                  className={`card-wellness group relative overflow-hidden ${isOutOfStock ? 'opacity-75' : ''}`}
                >
                  {/* Stock Status Badges */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {hasDiscount && (
                      <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                        <FaTag className="text-xs" />
                        {priceInfo.discount.discount_type === 'percentage' && `${priceInfo.discount.discount_value}% OFF`}
                        {priceInfo.discount.discount_type === 'fixed_amount' && `R${priceInfo.discount.discount_value} OFF`}
                      </div>
                    )}
                    {product.requires_prescription && (
                      <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <FaPrescriptionBottle className="text-xs" />
                        PRESCRIPTION REQUIRED
                      </div>
                    )}
                    {product.featured && (
                      <div className="bg-gold text-white text-xs font-bold px-3 py-1 rounded-full">
                        FEATURED
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <FaExclamationTriangle className="text-xs" />
                        OUT OF STOCK
                      </div>
                    )}
                    {isLowStock && (
                      <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <FaExclamationTriangle className="text-xs" />
                        LOW STOCK
                      </div>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <FaHeart
                      className={`text-lg ${
                        favorites.includes(product.id)
                          ? 'text-red-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>

                  {/* Product Image */}
                  <div className="relative overflow-hidden rounded-xl mb-4 bg-cream h-64">
                    <img
                      src={product.image_url || product.image}
                      alt={product.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">SOLD OUT</span>
                      </div>
                    )}
                  </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-montserrat text-primary-green bg-sage px-3 py-1 rounded-full">
                      {product.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-gold text-sm" />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-montserrat font-bold text-lg text-dark-text">
                    {product.name}
                  </h3>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Benefits */}
                  <ul className="space-y-1">
                    {(product.benefits || []).slice(0, 2).map((benefit, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-500 flex items-start"
                      >
                        <span className="text-primary-green mr-2">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  {/* View Details Button with Composition, Uses & Usage */}
                  {(product.package_contents || product.composition || product.uses || product.usage) && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleExpanded(product.id)}
                        className="flex items-center justify-between w-full text-sm font-semibold text-primary-green hover:text-green-dark transition-colors py-2 px-3 bg-sage/30 rounded-lg"
                      >
                        <span>Product Details</span>
                        {expandedProducts.includes(product.id) ? (
                          <FaChevronUp className="text-xs" />
                        ) : (
                          <FaChevronDown className="text-xs" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedProducts.includes(product.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 p-3 bg-cream rounded-lg space-y-3">
                              {/* Composition */}
                              {product.composition && (
                                <div>
                                  <h4 className="text-xs font-bold text-dark-text mb-1 flex items-center gap-1">
                                    <span className="text-primary-green">📋</span> Composition
                                  </h4>
                                  <div className="text-xs text-gray-700 whitespace-pre-line">
                                    {product.composition}
                                  </div>
                                </div>
                              )}

                              {/* Uses */}
                              {product.uses && (
                                <div>
                                  <h4 className="text-xs font-bold text-dark-text mb-1 flex items-center gap-1">
                                    <span className="text-primary-green">💊</span> Uses & Benefits
                                  </h4>
                                  <div className="text-xs text-gray-700 whitespace-pre-line">
                                    {product.uses}
                                  </div>
                                </div>
                              )}

                              {/* Usage Instructions */}
                              {product.usage && (
                                <div>
                                  <h4 className="text-xs font-bold text-dark-text mb-1 flex items-center gap-1">
                                    <span className="text-primary-green">⏰</span> How to Use
                                  </h4>
                                  <div className="text-xs text-gray-700 whitespace-pre-line">
                                    {product.usage}
                                  </div>
                                </div>
                              )}

                              {/* Package Contents */}
                              {product.package_contents && (
                                <div>
                                  <h4 className="text-xs font-bold text-dark-text mb-1 flex items-center gap-1">
                                    <span className="text-primary-green">📦</span> Package Includes
                                  </h4>
                                  <div className="text-xs text-gray-700 whitespace-pre-line">
                                    {product.package_contents}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Stock Information */}
                  <div className="text-xs text-gray-500 mt-2">
                    {isOutOfStock ? (
                      <span className="text-red-600 font-semibold">Currently unavailable</span>
                    ) : isLowStock ? (
                      <span className="text-orange-600 font-semibold">Only {product.stock_quantity} left in stock!</span>
                    ) : (
                      <span className="text-green-600 font-semibold">In stock ({product.stock_quantity} available)</span>
                    )}
                  </div>

                  {/* Price and Add to Cart */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      {hasDiscount ? (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-400 line-through">
                            R{priceInfo.originalPrice.toFixed(2)}
                          </span>
                          <span className="text-2xl font-bold text-red-600">
                            R{priceInfo.discountedPrice.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-primary-green">
                            R{product.price}
                          </span>
                        </div>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: isOutOfStock ? 1 : 1.05 }}
                      whileTap={{ scale: isOutOfStock ? 1 : 0.95 }}
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className={`p-3 rounded-lg transition-all flex items-center space-x-2 ${
                        isOutOfStock
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : addedToCart.includes(product.id)
                          ? 'bg-green-600 text-white'
                          : product.requires_prescription
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-primary-green text-white hover:bg-green-dark'
                      }`}
                    >
                      {isOutOfStock ? (
                        <>
                          <FaExclamationTriangle />
                          <span className="text-sm font-semibold">Out of Stock</span>
                        </>
                      ) : addedToCart.includes(product.id) ? (
                        <>
                          <FaCheck />
                          <span className="text-sm font-semibold">Added!</span>
                        </>
                      ) : product.requires_prescription ? (
                        <>
                          <FaPrescriptionBottle />
                          <span className="text-sm font-semibold">Request</span>
                        </>
                      ) : (
                        <>
                          <FaShoppingCart />
                          <span className="text-sm font-semibold">Add</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
                </motion.div>
              );
            })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Prescription Request Modal */}
      <PrescriptionRequestModal
        isOpen={prescriptionModalOpen}
        onClose={() => {
          setPrescriptionModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </div>
  );
};

export default Shop;
