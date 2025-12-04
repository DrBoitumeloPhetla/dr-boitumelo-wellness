import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBox,
  FaStar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import { useAdmin } from '../../context/AdminContext';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
} from '../../lib/supabase';

// Inner component that uses AdminContext
const AdminProductsContent = () => {
  const { log, canPerform } = useAdmin();
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Antioxidants',
    price: '',
    shipping_cost: '0',
    stock_quantity: '',
    low_stock_threshold: 10,
    image_url: '',
    benefits: '',
    package_contents: '',
    status: 'active',
    featured: false
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadProducts();
    loadLowStockProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setLoading(false);
    }
  };

  const loadLowStockProducts = async () => {
    try {
      const data = await getLowStockProducts();
      setLowStockProducts(data);
    } catch (error) {
      console.error('Error loading low stock products:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'supplements',
      price: '',
      shipping_cost: '0',
      stock_quantity: '',
      low_stock_threshold: 10,
      image_url: '',
      benefits: '',
      package_contents: '',
      status: 'active',
      featured: false
    });
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalImageUrl = formData.image_url;

    // If user uploaded a new image file, use that
    if (imageFile) {
      finalImageUrl = imagePreview; // Use the base64 preview as the image URL
    }
    // If editing and no new image uploaded, keep existing image from original product
    else if (editingProduct && !imageFile) {
      finalImageUrl = editingProduct.image_url; // Use the original image URL from database
    }

    const productData = {
      ...formData,
      image_url: finalImageUrl,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
      low_stock_threshold: parseInt(formData.low_stock_threshold),
      benefits: formData.benefits.split(',').map(b => b.trim()).filter(b => b)
    };

    console.log('Saving product with image URL length:', finalImageUrl?.length || 0);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);

        // Log the update activity
        await log({
          actionType: 'update',
          resourceType: 'product',
          resourceId: editingProduct.id,
          resourceName: productData.name,
          details: {
            category: productData.category,
            price: productData.price,
            stockQuantity: productData.stock_quantity,
            changes: 'Product details updated'
          }
        });
      } else {
        const newProduct = await createProduct(productData);

        // Log the create activity
        await log({
          actionType: 'create',
          resourceType: 'product',
          resourceId: newProduct.id,
          resourceName: productData.name,
          details: {
            category: productData.category,
            price: productData.price,
            stockQuantity: productData.stock_quantity
          }
        });
      }

      setShowModal(false);
      resetForm();
      loadProducts();
      loadLowStockProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      console.error('Error details:', error.message);
      alert(`Failed to save product: ${error.message}`);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price.toString(),
      shipping_cost: product.shipping_cost ? product.shipping_cost.toString() : '0',
      stock_quantity: product.stock_quantity.toString(),
      low_stock_threshold: product.low_stock_threshold,
      image_url: product.image_url || '',
      benefits: product.benefits ? product.benefits.join(', ') : '',
      package_contents: product.package_contents || '',
      status: product.status,
      featured: product.featured
    });
    setImagePreview(product.image_url || null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    // Check permissions
    if (!canPerform('delete')) {
      alert('You do not have permission to delete products. Only super admins can delete products.');
      return;
    }

    if (!confirm('Are you sure you want to delete this product?')) return;

    // Find product to get its name for logging
    const product = products.find(p => p.id === productId);

    try {
      await deleteProduct(productId);

      // Log the delete activity
      await log({
        actionType: 'delete',
        resourceType: 'product',
        resourceId: productId,
        resourceName: product?.name || 'Unknown Product',
        details: {
          category: product?.category,
          price: product?.price,
          deletedAt: new Date().toISOString()
        }
      });

      loadProducts();
      loadLowStockProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'all') return true;
    return product.category === selectedCategory;
  });

  const categories = ['all', 'supplements', 'wellness', 'skincare', 'books'];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-montserrat font-bold text-dark-text mb-2">
          Product Management
        </h1>
        <p className="text-gray-600">Manage your product inventory and stock levels</p>
      </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-lg flex items-start space-x-3"
          >
            <FaExclamationTriangle className="text-xl mt-0.5" />
            <div>
              <p className="font-semibold">Low Stock Alert</p>
              <p className="text-sm">
                {lowStockProducts.length} product(s) are running low on stock
              </p>
            </div>
          </motion.div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
          {/* Category Filter */}
          <div className="flex space-x-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary-green text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-opacity-90 font-semibold flex items-center space-x-2"
          >
            <FaPlus />
            <span>Add Product</span>
          </button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <div className="h-48 bg-gray-200 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaBox className="text-6xl text-gray-400" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col space-y-2">
                    {product.featured && (
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded flex items-center space-x-1">
                        <FaStar />
                        <span>Featured</span>
                      </span>
                    )}
                    {product.stock_quantity <= product.low_stock_threshold && (
                      <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded">
                        Low Stock
                      </span>
                    )}
                    {product.status === 'out_of_stock' && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-montserrat font-bold text-lg text-dark-text mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary-green">
                      R{product.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Stock: <span className={`font-semibold ${
                        product.stock_quantity <= product.low_stock_threshold
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}>
                        {product.stock_quantity}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      {product.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      product.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center space-x-2"
                    >
                      <FaEdit />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-montserrat font-bold text-dark-text">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes className="text-2xl" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>

                  {/* Category and Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      >
                        <option value="Antioxidants">Antioxidants</option>
                        <option value="Minerals">Minerals</option>
                        <option value="Immune Support">Immune Support</option>
                        <option value="Wellness Packages">Wellness Packages</option>
                        <option value="Digestive Health">Digestive Health</option>
                        <option value="Wellness Accessories">Wellness Accessories</option>
                        <option value="Heart Health">Heart Health</option>
                        <option value="Beauty & Wellness">Beauty & Wellness</option>
                        <option value="Multivitamins">Multivitamins</option>
                        <option value="Nutrition">Nutrition</option>
                        <option value="Brain Health">Brain Health</option>
                        <option value="Reproductive Health">Reproductive Health</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (R) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Shipping Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Cost (R)
                    </label>
                    <input
                      type="number"
                      name="shipping_cost"
                      value={formData.shipping_cost}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave as 0 for free shipping</p>
                  </div>

                  {/* Stock and Threshold */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        name="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={handleInputChange}
                        min="0"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Low Stock Alert
                      </label>
                      <input
                        type="number"
                        name="low_stock_threshold"
                        value={formData.low_stock_threshold}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Image Upload/URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Image
                    </label>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mb-4 relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}

                    {/* Upload Options */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Upload Image File</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Recommended: PNG, JPG, or WebP (max 5MB)</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="text-xs text-gray-500">OR</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Enter Image URL (optional)</label>
                        <input
                          type="text"
                          name="image_url"
                          value={formData.image_url}
                          onChange={handleInputChange}
                          disabled={!!imageFile || !!imagePreview}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="https://example.com/image.jpg"
                        />
                        <p className="text-xs text-gray-500 mt-1">Only needed if adding a new product without uploading a file</p>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Benefits (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="benefits"
                      value={formData.benefits}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      placeholder="Boosts immunity, Increases energy, Supports health"
                    />
                  </div>

                  {/* Package Contents */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Package Contents (What's in the package)
                    </label>
                    <textarea
                      name="package_contents"
                      value={formData.package_contents}
                      onChange={handleInputChange}
                      rows="5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent resize-none"
                      placeholder="List each item on a new line, e.g.:
Oxidation Entero
Hydrolysed Collagen
Oxidation VitaMinerals
Omega 3 (EPA & DHA)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter each ingredient/item on a new line. This will be shown to customers when they click "View Details".</p>
                  </div>

                  {/* Status and Featured */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="featured"
                          checked={formData.featured}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-primary-green focus:ring-primary-green rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Featured Product</span>
                      </label>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-opacity-90 font-semibold flex items-center justify-center space-x-2"
                    >
                      <FaCheckCircle />
                      <span>{editingProduct ? 'Update Product' : 'Add Product'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
};

// Wrapper component
const AdminProducts = () => {
  return (
    <AdminLayout>
      <AdminProductsContent />
    </AdminLayout>
  );
};

export default AdminProducts;
