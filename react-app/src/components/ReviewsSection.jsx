import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Star, MessageSquare } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const ReviewsSection = ({ packageId = null, featuredOnly = false }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [packageId, featuredOnly]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (featuredOnly) {
        query = query.eq('is_featured', true);
      }

      if (packageId) {
        // Fetch package specific reviews first
        const { data: pkgReviews, error: pkgErr } = await query.eq('package_id', packageId);
        if (pkgErr) throw pkgErr;

        if (pkgReviews && pkgReviews.length > 0) {
          setReviews(pkgReviews);
          setLoading(false);
          return;
        }
        
        // Fallback: fetch general reviews (where package_id is null)
        let fallbackQuery = supabase
          .from('reviews')
          .select('*')
          .eq('is_approved', true)
          .is('package_id', null)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });
          
        if (featuredOnly) fallbackQuery = fallbackQuery.eq('is_featured', true);
        
        const { data: genReviews, error: genErr } = await fallbackQuery;
        if (genErr) throw genErr;
        setReviews(genReviews || []);
      } else {
        // Fetch all based on constraints
        const { data, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;
        setReviews(data || []);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1 text-yellow-400 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} fill={i < rating ? "currentColor" : "none"} className={i < rating ? "" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01AFD1]"></div>
      </div>
    );
  }

  if (error || reviews.length === 0) {
    // Silently hide the reviews section if there are no reviews to preserve clean UI
    return null;
  }

  return (
    <section className="w-full py-12 px-4 md:px-12 lg:px-20 bg-surface-container-lowest border-t border-gray-50">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>

          <h2 className="text-3xl md:text-4xl text-on-surface font-bold">
            What Travelers Say
          </h2>
        </div>
      </div>

      <div className="w-full relative pb-12">
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          pagination={{ clickable: true, dynamicBullets: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="reviews-swiper !pb-12"
        >
          {reviews.map((review) => (
            <SwiperSlide key={review.id} className="h-auto">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
                {renderStars(review.rating)}
                
                <p className="text-gray-700 italic text-base md:text-lg mb-6 flex-grow leading-relaxed">
                  "{review.review_text}"
                </p>
                
                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-50">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-blue-100">
                    {review.customer_image_url ? (
                      <img src={review.customer_image_url} alt={review.customer_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-blue-600 font-bold text-lg">
                        {review.customer_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{review.customer_name}</h4>
                    <p className="text-xs text-gray-500 font-medium">
                      {review.destination || review.package_title || 'TripoMist Traveler'}
                    </p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .reviews-swiper .swiper-pagination-bullet {
          background: #01AFD1;
          opacity: 0.2;
        }
        .reviews-swiper .swiper-pagination-bullet-active {
          opacity: 1;
        }
      `}} />
    </section>
  );
};

export default ReviewsSection;
