import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Link } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

// Google G logo SVG
const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function TestimonialsSection() {
  const [settings, setSettings] = useState(null);
  const [reviews, setReviews] = useState([]);
  const containerRef = useRef(null);
  const autoScrollRef = useRef(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    async function fetchData() {
      const { data: sData } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'testimonials_section')
        .single();
      if (sData) setSettings(sData.setting_value);

      const { data: rData } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .order('review_date', { ascending: false })
        .limit(20);
      if (rData) setReviews(rData);
    }
    fetchData();
  }, []);

  const reviewsToRender = reviews;

  const scrollBy = useCallback((direction) => {
    if (!containerRef.current) return;
    const cardWidth = 316; // approx card width + gap
    containerRef.current.scrollBy({ left: direction === 'next' ? cardWidth : -cardWidth, behavior: 'smooth' });
  }, []);

  const startAutoScroll = useCallback(() => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    const speed = settings?.autoplay_speed || 4000;
    autoScrollRef.current = setInterval(() => {
      if (isPausedRef.current || !containerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      }
    }, speed);
  }, [settings]);

  useEffect(() => {
    if (!settings?.enable_autoscroll || reviewsToRender.length === 0) return;
    startAutoScroll();
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [settings, reviewsToRender, startAutoScroll]);

  if (!settings || !settings.is_active || reviewsToRender.length === 0) return null;

  const bgColor = settings.bg_color || '#ffffff';
  const textColor = settings.text_color || '#1f2937';

  // Trust summary values
  const ratingLabel = settings.rating_label || 'EXCELLENT';
  const avgRating = parseFloat(settings.avg_rating || '4.5');
  const reviewCount = settings.review_count || '';
  const sourceName = settings.source_name || 'Google';
  const showSource = !!sourceName;

  const filledStars = Math.floor(avgRating);
  const hasHalf = avgRating - filledStars >= 0.5;

  return (
    <section
      style={{ backgroundColor: bgColor, color: textColor }}
      className="w-full py-16 px-4 md:px-12 lg:px-20 border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header row: left heading/subtext, right "See all" link */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-10">
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: textColor }}>
              {settings.heading || 'Client testimonials'}
            </h2>
            <p className="text-sm max-w-xl leading-relaxed" style={{ color: textColor, opacity: 0.7 }}>
              {settings.subtext || 'Real travelers. Real stories. Real opinions to help you make the right choice.'}
            </p>
          </div>

          <Link
            to={settings.see_all_link || '/reviews'}
            className="text-sm font-bold text-[#136b8a] hover:underline whitespace-nowrap self-start sm:self-center mt-1"
          >
            {settings.button_text || 'See all testimonials'} →
          </Link>
        </div>

        {/* Body: trust summary left + carousel right */}
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* LEFT: Trust summary */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center md:items-start gap-2 min-w-[160px] md:min-w-[180px] md:pt-4">
            <span className="text-lg font-black tracking-widest uppercase" style={{ color: textColor }}>
              {ratingLabel}
            </span>

            {/* Stars */}
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < filledStars
                      ? 'text-amber-400 fill-amber-400'
                      : i === filledStars && hasHalf
                      ? 'text-amber-400 fill-amber-200'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>

            {reviewCount && (
              <p className="text-sm font-semibold" style={{ color: textColor }}>
                Based on <span className="font-extrabold">{reviewCount}</span> reviews
              </p>
            )}

            {showSource && (
              <div className="flex items-center gap-1.5 mt-1">
                {sourceName === 'Google' ? (
                  <>
                    <GoogleLogo />
                    <span className="text-base font-bold text-gray-700">Google</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-gray-600">{sourceName}</span>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Carousel with arrow controls */}
          <div className="flex-1 min-w-0 relative px-5">
            {/* Prev arrow */}
            <button
              aria-label="Previous testimonial"
              onClick={() => scrollBy('prev')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Scrollable cards */}
            <div
              ref={containerRef}
              className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 scroll-smooth snap-x snap-mandatory px-2"
              onMouseEnter={() => { isPausedRef.current = true; }}
              onMouseLeave={() => { isPausedRef.current = false; }}
              onTouchStart={() => { isPausedRef.current = true; }}
              onTouchEnd={() => { isPausedRef.current = false; }}
            >
              {reviewsToRender.map((review, idx) => {
                const name = review.customer_name || review.reviewer_name || 'Customer';
                const text = review.review_text || '';
                const rating = review.rating || 5;
                const imageUrl = review.customer_image_url || review.avatar || '';
                const reviewAge = review.review_age || review.review_date || '';
                const source = review.source || '';
                const verified = review.verified !== false;
                const readMoreLink = review.read_more_link || '';
                const isGoogle = source === 'Google' || !source;

                return (
                  <div
                    key={review.id || idx}
                    className="w-[280px] md:w-[300px] shrink-0 bg-white border border-gray-100 p-5 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow snap-start"
                  >
                    {/* Top row: avatar + name/age + source icon */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{name}</p>
                          {reviewAge && (
                            <p className="text-xs text-gray-400 mt-0.5">{reviewAge}</p>
                          )}
                        </div>
                      </div>
                      {isGoogle && <GoogleLogo />}
                    </div>

                    {/* Stars + verified */}
                    <div className="flex items-center gap-1.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                        />
                      ))}
                      {verified && (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500 ml-1" />
                      )}
                    </div>

                    {/* Review text */}
                    <p className="text-sm text-gray-700 leading-relaxed flex-grow line-clamp-4">
                      {text}
                    </p>

                    {/* Read more */}
                    {readMoreLink && (
                      <a
                        href={readMoreLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#136b8a] font-semibold mt-2 hover:underline block"
                      >
                        Read more
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next arrow */}
            <button
              aria-label="Next testimonial"
              onClick={() => scrollBy('next')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
