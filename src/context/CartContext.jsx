import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('drBoitumeloCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('drBoitumeloCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart
  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        // If item exists, increase quantity
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // If new item, add with quantity 1
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Get total number of items
  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Calculate effective price for an item (applies min_quantity discounts)
  const getItemPrice = (item) => {
    const originalPrice = item.originalPrice ? parseFloat(item.originalPrice) : (typeof item.price === 'number' ? item.price : parseFloat(item.price));
    const discount = item.discount;

    // If discount has min_quantity, only apply when quantity meets threshold
    if (discount && discount.min_quantity > 1) {
      if (item.quantity >= discount.min_quantity) {
        if (discount.discount_type === 'percentage') {
          return originalPrice - (originalPrice * (discount.discount_value / 100));
        } else if (discount.discount_type === 'fixed_amount') {
          return Math.max(0, originalPrice - discount.discount_value);
        }
      }
      return originalPrice;
    }

    // Regular price (already discounted or no discount)
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
    return price;
  };

  // Get total price
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + getItemPrice(item) * item.quantity;
    }, 0);
  };

  const value = {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal,
    getItemPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
