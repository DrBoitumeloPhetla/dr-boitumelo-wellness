import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaUser, FaTag } from 'react-icons/fa';
import { getBlogArticleById } from '../lib/supabase';

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      // We need to get articles by slug, but our function gets by ID
      // So we'll need to add a new function to get by slug
      // For now, we'll get all published articles and find the matching slug
      const { getPublishedBlogArticles } = await import('../lib/supabase');
      const articles = await getPublishedBlogArticles();
      const foundArticle = articles.find(a => a.slug === slug);

      if (!foundArticle) {
        setError('Article not found');
        setArticle(null);
      } else {
        setArticle(foundArticle);
      }
    } catch (error) {
      console.error('Error loading article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-light-bg pt-24">
        <div className="container-custom px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-playfair font-bold text-dark-text mb-4">
              Article Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/blog"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <FaArrowLeft />
              <span>Back to Blog</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg pt-24">
      {/* Article Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white border-b border-gray-200"
      >
        <div className="container-custom px-6 py-12">
          {/* Back Button */}
          <Link
            to="/blog"
            className="inline-flex items-center space-x-2 text-primary-green hover:text-opacity-80 mb-6 transition-colors"
          >
            <FaArrowLeft />
            <span>Back to Blog</span>
          </Link>

          {/* Article Meta */}
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <span className="bg-primary-green/10 text-primary-green px-3 py-1 rounded-full font-medium">
                {article.category}
              </span>
              <div className="flex items-center space-x-1">
                <FaCalendar className="text-xs" />
                <span>{formatDate(article.published_at || article.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FaUser className="text-xs" />
                <span>{article.author}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-dark-text mb-6">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-gray-600 font-montserrat leading-relaxed">
              {article.excerpt}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Featured Image */}
      {article.featured_image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="container-custom px-6 py-8"
        >
          <div className="max-w-4xl mx-auto">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-auto rounded-2xl shadow-lg object-cover"
              style={{ maxHeight: '600px' }}
            />
          </div>
        </motion.div>
      )}

      {/* Article Content */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="container-custom px-6 py-8 pb-16"
      >
        <div className="max-w-4xl mx-auto">
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-playfair prose-headings:font-bold prose-headings:text-dark-text
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:font-montserrat
              prose-a:text-primary-green prose-a:no-underline hover:prose-a:underline
              prose-strong:text-dark-text prose-strong:font-semibold
              prose-ul:list-disc prose-ul:pl-6 prose-ul:text-gray-700
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-gray-700
              prose-li:my-2
              prose-img:rounded-lg prose-img:shadow-md
              prose-blockquote:border-l-4 prose-blockquote:border-primary-green prose-blockquote:pl-4 prose-blockquote:italic
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </motion.article>

      {/* Article Footer */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="container-custom px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <Link
              to="/blog"
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <FaArrowLeft />
              <span>Read More Articles</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogArticle;
