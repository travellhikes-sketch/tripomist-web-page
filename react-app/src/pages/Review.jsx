import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';
import { Star, CheckCircle, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5 inline-block align-middle mr-1" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

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
        if (reviewsData) setReviews(reviewsData);
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
        if (galleryData) setGalleryMedia(galleryData);
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
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Navbar />

      {/* TOP BANNER */}
      {pageSettings.show_banner && (
        <section className="relative w-full h-[35vh] md:h-[45vh] min-h-[260px] overflow-hidden px-4 md:px-12 lg:px-20 pt-4">
          <div className="w-full h-full rounded-[24px] overflow-hidden relative shadow-md">
            <picture>
              {pageSettings.mobile_banner_url && (
                <source media="(max-width: 640px)" srcSet={pageSettings.mobile_banner_url} />
              )}
              <img
                src={pageSettings.banner_url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80"}
                alt={pageSettings.heading}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 select-none">
                {pageSettings.heading || 'Customer Reviews'}
              </h1>
              {pageSettings.subheading && (
                <p className="text-sm md:text-lg max-w-xl opacity-90 select-none">
                  {pageSettings.subheading}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* PHOTO + VIDEO GALLERY */}
      {galleryMedia.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 md:px-12 lg:px-20 pt-12 pb-6">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6 tracking-tight">
            {pageSettings.gallery_heading || 'Travel Memories Gallery'}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryMedia.map((media, idx) => (
              <div
                key={media.id}
                className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-gray-100 shadow-sm bg-white"
                onClick={() => media.media_type === 'video' ? setActiveVideoUrl(media.media_url) : openLightbox(idx)}
              >
                <img
                  src={media.thumbnail_url || media.media_url}
                  alt={media.title || 'Gallery Media'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {media.media_type === 'video' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center text-primary shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-1" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                )}

                {media.title && (
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    {media.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TRUST SUMMARY */}
      {testimonialsSettings.show_summary !== false && (
        <section className="w-full max-w-7xl mx-auto px-4 md:px-12 lg:px-20 py-8">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="text-sm font-black uppercase tracking-widest text-[#136b8a]">
                {testimonialsSettings.rating_label || 'EXCELLENT'}
              </span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < filledStars
                        ? 'text-amber-400 fill-amber-400'
                        : i === filledStars && hasHalf
                        ? 'text-amber-400 fill-amber-200'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
                <span className="ml-2 font-bold text-gray-900">{avgRating.toFixed(1)} / 5.0</span>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Based on <span className="font-bold text-gray-800">{testimonialsSettings.review_count || '0'}</span> verified customer reviews
              </p>
            </div>

            {testimonialsSettings.source_name && (
              <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8">
                {testimonialsSettings.source_name === 'Google' ? (
                  <div className="flex items-center">
                    <GoogleLogo />
                    <span className="text-lg font-bold text-gray-800">Google Review Partner</span>
                  </div>
                ) : (
                  <span className="text-base font-bold text-gray-700">{testimonialsSettings.source_name}</span>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* REVIEWS GRID LIST */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-12 lg:px-20 pb-36">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6 tracking-tight">
          What Our Travelers Say
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm text-gray-500">
            No reviews published yet.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, visibleCount).map((review) => {
                const name = review.customer_name || 'Customer';
                const text = review.review_text || '';
                const rating = review.rating || 5;
                const imageUrl = review.customer_image_url || '';
                const reviewDate = review.review_date || '';
                const source = review.source || '';
                const verified = review.verified !== false;
                const readMoreLink = review.read_more_link || '';

                return (
                  <div key={review.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      {/* Customer Row */}
                      <div className="flex items-center gap-3 mb-4">
                        {imageUrl ? (
                          <img src={imageUrl} alt={name} className="w-11 h-11 rounded-full object-cover border border-gray-100" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight">{name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-400">{reviewDate || 'Recent'}</span>
                            {verified && (
                              <div className="flex items-center gap-0.5 text-blue-500 text-[10px] font-bold bg-blue-50 px-1.5 py-0.5 rounded-full">
                                <CheckCircle className="w-2.5 h-2.5 fill-current" />
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
                      <p className="text-sm text-gray-600 leading-relaxed italic mb-4">
                        "{text}"
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-auto">
                      {review.destination && (
                        <span className="text-xs font-semibold text-[#136b8a] bg-blue-50/50 px-2.5 py-1 rounded-lg">
                          📍 {review.destination}
                        </span>
                      )}

                      {readMoreLink && (
                        <a
                          href={readMoreLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Read More →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {visibleCount < reviews.length && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  className="bg-white border border-gray-200 text-gray-700 font-bold px-8 py-3 rounded-full hover:bg-gray-50 shadow-sm transition-all text-sm cursor-pointer"
                >
                  Load More Reviews
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* LIGHTBOX FOR PHOTO GALLERY */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeLightbox}>
          <button className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors" onClick={closeLightbox}>
            <X className="w-8 h-8" />
          </button>

          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors" onClick={handlePrevMedia}>
            <ChevronLeft className="w-10 h-10" />
          </button>

          <div className="max-w-4xl max-h-[80vh] relative flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <img
              src={galleryMedia[lightboxIndex]?.media_url}
              alt={galleryMedia[lightboxIndex]?.title || 'Lightbox'}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
            {galleryMedia[lightboxIndex]?.title && (
              <p className="text-white text-sm font-semibold mt-4 text-center">
                {galleryMedia[lightboxIndex].title}
              </p>
            )}
          </div>

          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors" onClick={handleNextMedia}>
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}

      {/* VIDEO PLAYER MODAL */}
      {activeVideoUrl && (
        <div className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setActiveVideoUrl(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors" onClick={() => setActiveVideoUrl(null)}>
            <X className="w-8 h-8" />
          </button>

          <div className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <video src={activeVideoUrl} controls autoPlay className="w-full h-full" />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
