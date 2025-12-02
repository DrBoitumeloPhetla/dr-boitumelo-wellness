import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FaStar, FaQuoteLeft, FaChevronLeft, FaChevronRight, FaPen } from 'react-icons/fa';
import BookingModal from '../ui/BookingModal';
import ReviewModal from '../ui/ReviewModal';
import { getApprovedReviews } from '../../lib/supabase';

const Testimonials = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hardcoded testimonials as fallback
  const fallbackTestimonials = [
    {
      id: 1,
      name: 'Sarah Thompson',
      role: 'Busy Professional',
      rating: 5,
      text: "Dr. Boitumelo's holistic approach transformed my health completely. After struggling with chronic fatigue for years, her personalized supplement plan and guidance helped me regain my energy and vitality. I can't recommend her enough!",
      condition: 'Chronic Fatigue',
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Fitness Enthusiast',
      rating: 5,
      text: "The quality of the supplements and the expertise Dr. Boitumelo provides is unmatched. Her nutrition coaching helped me optimize my performance and recovery. I've seen incredible results in just three months!",
      condition: 'Athletic Performance',
    },
    {
      id: 3,
      name: 'Jennifer Martinez',
      role: 'Mother of Three',
      rating: 5,
      text: "As a busy mom, I needed solutions that actually worked. Dr. Boitumelo's wellness program gave me the tools and support to prioritize my health. The supplements are top-quality and I feel better than I have in years.",
      condition: 'Stress Management',
    },
    {
      id: 4,
      name: 'David Okonkwo',
      role: 'Corporate Executive',
      rating: 5,
      text: "Working with Dr. Boitumelo has been life-changing. Her integrative approach addressed my digestive issues naturally, and I've experienced significant improvement. The virtual consultations made it easy to fit into my schedule.",
      condition: 'Digestive Health',
    },
    {
      id: 5,
      name: 'Emily Richards',
      role: 'Yoga Instructor',
      rating: 5,
      text: "The Collagen and Omega-3 supplements are phenomenal! Combined with Dr. Boitumelo's guidance, my skin, joints, and overall wellness have improved dramatically. Her knowledge and care for her clients is evident in everything she does.",
      condition: 'Joint Health & Beauty',
    },
    {
      id: 6,
      name: 'James Wilson',
      role: 'Retired Teacher',
      rating: 5,
      text: "At 65, I thought feeling tired was just part of aging. Dr. Boitumelo proved me wrong! Her supplement recommendations and nutrition advice have given me more energy than I had in my 50s. Truly grateful for her expertise.",
      condition: 'Healthy Aging',
    },
  ];

  // Fetch reviews from database
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const approvedReviews = await getApprovedReviews();

        // Transform database reviews to match testimonial format
        const transformedReviews = approvedReviews.map(review => ({
          id: review.id,
          name: review.name,
          role: review.role || 'Customer',
          rating: review.rating,
          text: review.review_text,
          condition: review.condition || 'Wellness',
          media_type: review.media_type,
          media_url: review.media_url
        }));

        // Use fetched reviews if available, otherwise use fallback
        if (transformedReviews.length > 0) {
          setTestimonials(transformedReviews);
        } else {
          setTestimonials(fallbackTestimonials);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setTestimonials(fallbackTestimonials);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Show loading state
  if (loading) {
    return (
      <section id="testimonials" className="section-padding bg-cream">
        <div className="container-custom">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary-green"></div>
            <p className="mt-4 text-gray-600">Loading testimonials...</p>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no testimonials
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section id="testimonials" className="section-padding bg-cream" ref={ref}>
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="heading-secondary text-primary-green mb-4">
            Client Success Stories
          </h2>
          <div className="w-20 h-1 bg-gold mx-auto mb-6" />
          <p className="text-body max-w-3xl mx-auto">
            Real transformations from real people. Discover how our holistic
            approach has helped clients achieve their wellness goals.
          </p>
        </motion.div>

        {/* Featured Testimonial Carousel */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden"
              >
                {/* Quote Icon */}
                <div className="absolute top-8 right-8 text-sage text-6xl opacity-50">
                  <FaQuoteLeft />
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <FaStar key={i} className="text-gold text-xl" />
                  ))}
                </div>

                {/* Condition Badge */}
                <div className="inline-block bg-sage px-4 py-1 rounded-full text-sm font-montserrat text-primary-green mb-6">
                  {testimonials[currentIndex].condition}
                </div>

                {/* Testimonial Text */}
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 relative z-10">
                  "{testimonials[currentIndex].text}"
                </p>

                {/* Media (Image or Video) */}
                {testimonials[currentIndex].media_url && (
                  <div className="mb-8">
                    {testimonials[currentIndex].media_type === 'image' ? (
                      <img
                        src={testimonials[currentIndex].media_url}
                        alt={`${testimonials[currentIndex].name}'s review`}
                        className="w-full max-h-96 object-cover rounded-2xl shadow-lg"
                      />
                    ) : testimonials[currentIndex].media_type === 'video' ? (
                      <video
                        src={testimonials[currentIndex].media_url}
                        controls
                        className="w-full max-h-96 rounded-2xl shadow-lg"
                      />
                    ) : null}
                  </div>
                )}

                {/* Client Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-green to-green-dark rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {testimonials[currentIndex].name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-montserrat font-bold text-dark-text">
                      {testimonials[currentIndex].name}
                    </h4>
                    <p className="text-gray-600">{testimonials[currentIndex].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 bg-white rounded-full p-4 shadow-lg hover:bg-primary-green hover:text-white transition-all"
            >
              <FaChevronLeft className="text-xl" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 bg-white rounded-full p-4 shadow-lg hover:bg-primary-green hover:text-white transition-all"
            >
              <FaChevronRight className="text-xl" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-primary-green'
                    : 'w-2 bg-gray-300 hover:bg-primary-green'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Rating */}
              <div className="flex items-center space-x-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FaStar key={i} className="text-gold" />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-700 mb-4 line-clamp-4">
                "{testimonial.text}"
              </p>

              {/* Client */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-green to-green-dark rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h5 className="font-montserrat font-semibold text-dark-text">
                    {testimonial.name}
                  </h5>
                  <p className="text-xs text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-xl font-raleway text-gray-700 mb-6">
            Ready to start your wellness journey?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="btn-primary min-w-[220px]"
            >
              Book Your Consultation
            </button>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="btn-secondary min-w-[220px] flex items-center justify-center space-x-2"
            >
              <FaPen />
              <span>Leave a Review</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </section>
  );
};

export default Testimonials;
