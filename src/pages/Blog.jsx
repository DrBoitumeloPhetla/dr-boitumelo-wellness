import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaNewspaper, FaCalendar, FaUser, FaArrowRight } from 'react-icons/fa';
import { getPublishedBlogArticles } from '../lib/supabase';

const Blog = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await getPublishedBlogArticles();

      // Transform data to match component format
      const transformedArticles = data.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        image: article.featured_image,
        category: article.category,
        author: article.author,
        date: new Date(article.published_at || article.created_at).toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }));

      setArticles(transformedArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg pt-24">
      {/* Blog Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-primary-green to-emerald-700 text-white py-20 md:py-28"
      >
        <div className="container-custom px-6">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                <FaNewspaper className="text-5xl" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold mb-6">
              Wellness Insights & Articles
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-montserrat">
              Discover expert advice, holistic health tips, and the latest in nutritional wellness
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content Section */}
      <section className="py-16 md:py-24">
        <div className="container-custom px-6">
          {loading ? (
            // Loading State
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            // Coming Soon Message
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="bg-white rounded-2xl shadow-lg p-12 md:p-16 border border-gray-100">
                <div className="bg-primary-green/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                  <FaNewspaper className="text-5xl text-primary-green" />
                </div>
                <h2 className="text-3xl md:text-4xl font-playfair font-bold text-dark-text mb-6">
                  Coming Soon
                </h2>
                <p className="text-lg text-gray-600 font-montserrat mb-8 leading-relaxed">
                  We're preparing insightful articles about holistic wellness, nutrition, and healthy living.
                  Check back soon for expert guidance and practical tips to support your wellness journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="btn-primary flex items-center justify-center space-x-2">
                    <span>Subscribe for Updates</span>
                    <FaArrowRight />
                  </button>
                  <button className="btn-secondary flex items-center justify-center space-x-2">
                    <span>Explore Products</span>
                  </button>
                </div>
              </div>

              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <div className="bg-primary-green/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <FaNewspaper className="text-2xl text-primary-green" />
                  </div>
                  <h3 className="font-playfair font-bold text-lg text-dark-text mb-2">
                    Expert Articles
                  </h3>
                  <p className="text-gray-600 text-sm">
                    In-depth wellness guides written by Dr. Boitumelo
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <div className="bg-gold/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <FaCalendar className="text-2xl text-gold" />
                  </div>
                  <h3 className="font-playfair font-bold text-lg text-dark-text mb-2">
                    Regular Updates
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Fresh content added regularly to support your journey
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <FaUser className="text-2xl text-emerald-600" />
                  </div>
                  <h3 className="font-playfair font-bold text-lg text-dark-text mb-2">
                    Practical Tips
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Actionable advice you can apply to your daily life
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            // Articles Grid - will be used when articles are added
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/blog/${article.slug}`}
                >
                  <motion.article
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.6 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group cursor-pointer h-full"
                  >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary-green text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                      <div className="flex items-center space-x-1">
                        <FaCalendar className="text-xs" />
                        <span>{article.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaUser className="text-xs" />
                        <span>{article.author}</span>
                      </div>
                    </div>
                    <h3 className="font-playfair font-bold text-xl text-dark-text mb-3 group-hover:text-primary-green transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="text-primary-green font-semibold flex items-center space-x-2 group-hover:space-x-3 transition-all">
                      <span>Read More</span>
                      <FaArrowRight />
                    </div>
                  </div>
                </motion.article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Blog;
