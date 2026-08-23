import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Star, CheckCircle, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import PremiumPageTemplate from '../components/PremiumPageTemplate';
import ReviewGalleryCarousel from '../components/ReviewGalleryCarousel';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5 inline-block align-middle mr-1" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

const DEMO_GALLERY = [
  { id: 'd1', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', title: 'Ladakh', location: 'Ladakh' },
  { id: 'd2', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80', title: 'Spiti', location: 'Spiti' },
  { id: 'd3', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80', title: 'Kashmir', location: 'Kashmir' },
  { id: 'd4', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', title: 'Himachal', location: 'Himachal' },
  { id: 'd5', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1582654291086-f01b6fa6b5c3?w=800&q=80', title: 'Sikkim', location: 'Sikkim' },
  { id: 'd6', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80', title: 'Uttarakhand', location: 'Uttarakhand' },
  { id: 'd7', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80', title: 'Udaipur', location: 'Udaipur' },
  { id: 'd8', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=800&q=80', title: 'Jibhi', location: 'Jibhi' },
  { id: 'd9', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&q=80', title: 'Manali', location: 'Manali' },
  { id: 'd10', media_type: 'image', media_url: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80', title: 'Meghalaya', location: 'Meghalaya' }
];

const DEMO_REVIEWS = [
  { id: 'r1', customer_name: 'Rahul Sharma', review_text: 'The trip to Manali was extremely well organized. Everything from the hotel to the transport was hassle-free. Highly recommended!', rating: 5, review_date: 'Oct 12, 2023', verified: true, destination: 'Manali, Himachal' },
  { id: 'r2', customer_name: 'Priya Patel', review_text: 'Had an amazing time in Goa. The itinerary was perfectly balanced between relaxation and activities. The local guide was very friendly.', rating: 5, review_date: 'Nov 05, 2023', verified: true, destination: 'Goa' },
  { id: 'r3', customer_name: 'Amit Kumar', review_text: 'Great experience overall. The hotel in Srinagar could have been a bit better, but the houseboat stay made up for it. Would book again.', rating: 4, review_date: 'Dec 22, 2023', verified: true, destination: 'Kashmir' },
  { id: 'r4', customer_name: 'Sneha Gupta', review_text: 'Our family trip to Kerala was beautiful. The houseboat experience in Alleppey was breathtaking. Excellent service by TripoMist team.', rating: 5, review_date: 'Jan 15, 2024', verified: true, destination: 'Kerala' },
  { id: 'r5', customer_name: 'Vikram Singh', review_text: 'Amazing solo trip to Spiti Valley. The driver was very experienced which is necessary for those roads. Unforgettable memories.', rating: 5, review_date: 'Feb 10, 2024', verified: true, destination: 'Spiti Valley' },
  { id: 'r6', customer_name: 'Anjali Desai', review_text: 'The Dubai package was totally worth it. The desert safari was the highlight of our trip. Only wish we had one more day there!', rating: 4, review_date: 'Mar 02, 2024', verified: true, destination: 'Dubai' },
  { id: 'r7', customer_name: 'Rohan Mehta', review_text: 'Very smooth booking process. The team customized our Andaman itinerary exactly how we wanted. Scuba diving was arranged perfectly.', rating: 5, review_date: 'Mar 18, 2024', verified: true, destination: 'Andaman' },
  { id: 'r8', customer_name: 'Kavita Joshi', review_text: 'Beautiful trip to Meghalaya. The living root bridges were amazing. Food options were a bit limited for vegetarians but manageable.', rating: 4, review_date: 'Apr 05, 2024', verified: true, destination: 'Meghalaya' },
  { id: 'r9', customer_name: 'Nitin Verma', review_text: 'Ladakh bike trip was a dream come true. The bikes provided were in excellent condition and the backup vehicle was always there.', rating: 5, review_date: 'May 12, 2024', verified: true, destination: 'Leh Ladakh' },
  { id: 'r10', customer_name: 'Pooja Reddy', review_text: 'Everything was seamless from pickup to drop. We enjoyed our honeymoon in Maldives without worrying about a single detail. Thanks TripoMist!', rating: 5, review_date: 'Jun 20, 2024', verified: true, destination: 'Maldives' }
];

export default function Review() {
  const [pageSettings, setPageSettings] = useState({
    heading: 'Customer Reviews',
    subheading: 'What our travelers say about their journeys with us.',
    banner_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    mobile_banner_url: '',
    show_banner: true,
    gallery_heading: 'Travel Memories Gallery'
  });

  const [testimonialsSettings, setTestimonialsSettings] = useState({
    rating_label: 'EXCELLENT',
    avg_rating: 4.8,
    review_count: '2,154',
    source_name: 'Google',
    show_summary: true
  });

  const [reviews, setReviews] = useState([]);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch reviews_page_settings
        const { data: pageData } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'reviews_page_settings')
          .single();
        if (pageData?.setting_value) {
          setPageSettings(prev => ({ ...prev, ...pageData.setting_value }));
        }

        // 2. Fetch testimonials settings (for trust summary stats)
        const { data: testData } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'testimonials_section')
          .single();
        if (testData?.setting_value) {
          setTestimonialsSettings(prev => ({ ...prev, ...testData.setting_value }));
        }

        // 3. Fetch public reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('is_approved', true)
          .order('display_order', { ascending: true })
          .order('review_date', { ascending: false });
        if (reviewsData && reviewsData.length > 0) {
          setReviews(reviewsData);
        } else {
          setReviews(DEMO_REVIEWS); // Fallback to realistic demo reviews
        }
      } catch (err) {
        console.error('Error loading reviews page data:', err);
      } finally {
        setLoading(false);
      }
    }

    async function loadGallery() {
      try {
        const { data: galleryData } = await supabase
          .from('gallery_media')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (galleryData && galleryData.length > 0) {
          setGalleryMedia(galleryData);
        } else {
          setGalleryMedia(DEMO_GALLERY); // Fallback to demo images
        }
      } catch (err) {
        console.error('Error loading gallery media:', err);
      } finally {
        setMediaLoading(false);
      }
    }

    loadData();
    loadGallery();
  }, []);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') handlePrevMedia(e);
      if (e.key === 'ArrowRight') handleNextMedia(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, galleryMedia.length]);

  const handlePrevMedia = (e) => {
    e.stopPropagation();
    setLightboxIndex(prev => (prev === 0 ? galleryMedia.length - 1 : prev - 1));
  };

  const handleNextMedia = (e) => {
    e.stopPropagation();
    setLightboxIndex(prev => (prev === galleryMedia.length - 1 ? 0 : prev + 1));
  };

  // Trust summary values
  const avgRating = parseFloat(testimonialsSettings.avg_rating || '4.8');
  const filledStars = Math.floor(avgRating);
  const hasHalf = avgRating - filledStars >= 0.5;

  return (
    <PremiumPageTemplate
      title={pageSettings.heading || 'Reviews'}
      subtitle={pageSettings.subheading}
      hero_image_url={pageSettings.show_banner ? pageSettings.banner_url : null}
      mobile_banner_image={pageSettings.show_banner ? pageSettings.mobile_banner_url : null}
      seo_title="Reviews | TripoMist"
      fullWidthLayout={true}
    >
      {/* GALLERY CAROUSEL */}
      {!mediaLoading && galleryMedia && galleryMedia.length > 0 && (
        <section className="w-[96vw] max-w-[1600px] mx-auto mb-8 relative left-1/2 -translate-x-1/2">
          {pageSettings.gallery_heading && (
            <h2 className="text-2xl font-bold text-center mb-5">{pageSettings.gallery_heading}</h2>
          )}
          <ReviewGalleryCarousel media={galleryMedia} onMediaClick={openLightbox} />
        </section>
      )}

      {/* REVIEWS GRID LIST */}
      <section className="text-left">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-8 text-center border border-gray-100 text-gray-500 italic text-sm">
            No reviews published yet.
          </div>
        ) : (
          <div className="w-full relative px-2 md:px-6">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{
                480: { slidesPerView: 1.1, spaceBetween: 15 },
                768: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
              }}
              autoplay={{ delay: 2500, disableOnInteraction: false }}
              loop={reviews.length > 1}
              navigation
              pagination={{ clickable: true }}
              className="!pb-12"
            >
              {reviews.map((review) => {
                const name = review.customer_name || 'Customer';
                const text = review.review_text || '';
                const rating = review.rating || 5;
                const imageUrl = review.customer_image_url || '';
                const reviewDate = review.review_date || '';
                const verified = review.verified !== false;
                const readMoreLink = review.read_more_link || '';

                return (
                  <SwiperSlide key={review.id} className="h-auto">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col justify-between transition-colors h-full">
                    <div>
                      {/* Customer Row */}
                      <div className="flex items-center gap-3 mb-3">
                        {imageUrl ? (
                          <img src={imageUrl} alt={name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-sm">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm leading-tight">{name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{reviewDate || 'Recent'}</span>
                            {verified && (
                              <div className="flex items-center gap-1 text-gray-500 text-xs">
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>Verified</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex gap-0.5 mb-3 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} className={i < rating ? "" : "text-gray-200"} />
                        ))}
                      </div>

                      {/* Review Text */}
                      <p className="text-[13px] text-gray-700 leading-relaxed mb-4">
                        {text}
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
                      {review.destination && (
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          {review.destination}
                        </span>
                      )}

                      {readMoreLink && (
                        <a
                          href={readMoreLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#136b8a] hover:underline"
                        >
                          Read More →
                        </a>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
            </Swiper>
          </div>
        )}
      </section>

      {/* LIGHTBOX OVERLAY */}
      {lightboxIndex !== null && galleryMedia[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
            onClick={closeLightbox}
          >
            <X size={32} />
          </button>

          <div className="absolute top-4 left-4 text-white/70 font-medium text-sm z-10">
            {lightboxIndex + 1} / {galleryMedia.length}
          </div>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
            onClick={handlePrevMedia}
          >
            <ChevronLeft size={48} />
          </button>

          <div
            className="w-full h-full max-w-6xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              const touch = e.changedTouches[0];
              e.currentTarget.dataset.startX = touch.clientX;
            }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0];
              const startX = parseFloat(e.currentTarget.dataset.startX || '0');
              const diff = startX - touch.clientX;
              if (diff > 50) handleNextMedia(e);
              if (diff < -50) handlePrevMedia(e);
            }}
          >
            {galleryMedia[lightboxIndex].media_type === 'video' ? (
              <video
                src={galleryMedia[lightboxIndex].media_url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <img
                src={galleryMedia[lightboxIndex].media_url}
                alt={galleryMedia[lightboxIndex].title || 'Gallery image'}
                className="max-w-full max-h-full object-contain rounded-lg select-none"
                draggable={false}
              />
            )}
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
            onClick={handleNextMedia}
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </PremiumPageTemplate>
  );
}
