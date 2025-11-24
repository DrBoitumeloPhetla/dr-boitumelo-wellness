import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaNewspaper,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaTimes,
  FaImage
} from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import {
  getAllBlogArticles,
  createBlogArticle,
  updateBlogArticle,
  deleteBlogArticle,
  uploadBlogImage
} from '../../lib/supabase';

const AdminBlog = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    category: 'Wellness',
    author: 'Dr. Boitumelo Phetla',
    status: 'draft'
  });

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, filterStatus]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await getAllBlogArticles();
      setArticles(data);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(article => article.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Auto-generate slug from title
      if (name === 'title') {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;

    try {
      setUploading(true);
      const imageUrl = await uploadBlogImage(imageFile);
      setFormData(prev => ({ ...prev, featuredImage: imageUrl }));
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingArticle(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      category: 'Wellness',
      author: 'Dr. Boitumelo Phetla',
      status: 'draft'
    });
    setShowModal(true);
  };

  const openEditModal = (article) => {
    setEditingArticle(article);
    setImageFile(null);
    setImagePreview(article.featured_image || '');
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      featuredImage: article.featured_image || '',
      category: article.category,
      author: article.author,
      status: article.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.excerpt) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Create a copy of formData to modify
      let dataToSave = { ...formData };

      // Upload image first if there's a new image file
      if (imageFile) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) {
          alert('Failed to upload image. Please try again.');
          setSaving(false);
          return;
        }
        // Update the data to save with the uploaded image URL
        dataToSave.featuredImage = uploadedUrl;
      }

      if (editingArticle) {
        await updateBlogArticle(editingArticle.id, dataToSave);
      } else {
        await createBlogArticle(dataToSave);
      }

      await loadArticles();
      setShowModal(false);
      setImageFile(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await deleteBlogArticle(articleId);
      await loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article. Please try again.');
    }
  };

  const togglePublishStatus = async (article) => {
    try {
      const newStatus = article.status === 'published' ? 'draft' : 'published';
      await updateBlogArticle(article.id, {
        ...article,
        featuredImage: article.featured_image,
        status: newStatus
      });
      await loadArticles();
    } catch (error) {
      console.error('Error updating article status:', error);
      alert('Failed to update article status. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-montserrat font-bold text-dark-text mb-2 flex items-center">
                <FaNewspaper className="mr-3 text-primary-green" />
                Blog Management
              </h1>
              <p className="text-gray-600">Create and manage blog articles</p>
            </div>
            <button
              onClick={openAddModal}
              className="mt-4 sm:mt-0 btn-primary flex items-center space-x-2"
            >
              <FaPlus />
              <span>New Article</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaNewspaper className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No articles found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by creating your first blog article'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button onClick={openAddModal} className="btn-primary">
                <FaPlus className="inline mr-2" />
                Create First Article
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredArticles.map((article) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="md:flex">
                  {/* Featured Image */}
                  <div className="md:w-64 h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                    {article.featured_image ? (
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaImage className="text-6xl text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              article.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {article.status}
                          </span>
                          <span className="text-sm text-gray-500">{article.category}</span>
                        </div>
                        <h3 className="text-xl font-playfair font-bold text-dark-text mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>By {article.author}</span>
                          <span>•</span>
                          <span>Created: {formatDate(article.created_at)}</span>
                          {article.published_at && (
                            <>
                              <span>•</span>
                              <span>Published: {formatDate(article.published_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => togglePublishStatus(article)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          article.status === 'published'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {article.status === 'published' ? (
                          <>
                            <FaEyeSlash className="inline mr-1" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <FaEye className="inline mr-1" />
                            Publish
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(article)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors"
                      >
                        <FaEdit className="inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                      >
                        <FaTrash className="inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => !saving && setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-dark-text">
                    {editingArticle ? 'Edit Article' : 'New Article'}
                  </h2>
                  <button
                    onClick={() => !saving && setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={saving}
                  >
                    <FaTimes className="text-2xl" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      placeholder="Enter article title"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug (URL) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      placeholder="article-url-slug"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-generated from title. Can be edited manually.
                    </p>
                  </div>

                  {/* Category & Author */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      >
                        <option value="Wellness">Wellness</option>
                        <option value="Nutrition">Nutrition</option>
                        <option value="Health Tips">Health Tips</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Natural Remedies">Natural Remedies</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author
                      </label>
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Featured Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Featured Image
                    </label>
                    <div className="space-y-3">
                      {/* File Input */}
                      <div className="flex items-center space-x-3">
                        <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                          <FaImage />
                          <span>Choose Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                        {imageFile && (
                          <span className="text-sm text-gray-600">
                            {imageFile.name}
                          </span>
                        )}
                      </div>

                      {/* Image Preview */}
                      {(imagePreview || formData.featuredImage) && (
                        <div className="relative">
                          <img
                            src={imagePreview || formData.featuredImage}
                            alt="Preview"
                            className="h-48 w-auto object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                              <div className="text-white">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                <p className="text-sm">Uploading...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Recommended: 800x600px or larger. Max file size: 5MB
                      </p>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excerpt <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      placeholder="Brief summary of the article (shown in article list)"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      required
                      rows="12"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent font-mono text-sm"
                      placeholder="Write your article content here... (supports HTML)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You can use HTML tags for formatting (e.g., &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;)
                    </p>
                  </div>

                  {/* Status */}
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
                      <option value="draft">Draft (not visible to public)</option>
                      <option value="published">Published (visible to public)</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-green text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : editingArticle ? 'Update Article' : 'Create Article'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
