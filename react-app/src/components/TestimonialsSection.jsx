import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Link } from 'react-router-dom';
import { Star, MessageSquare } from 'lucide-react';

export default function TestimonialsSection() {
  const [settings, setSettings] = useState(null);
  const [reviews, setReviews] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      // Fetch section settings
      const { data: sData } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'testimonials_section')
        .single();
      if (sData) {
        setSettings(sData.setting_value);
      }

      // Fetch reviews
      const { data: rData } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(10);
      if (rData) {
        setReviews(rData);
      }
    }
    fetchData();
  }, []);

  const reviewsToRender = (settings?.cards && settings.cards.length > 0) ? settings.cards : reviews;

  // Autoscroll effect
  useEffect(() => {
    if (!settings?.enable_autoscroll || reviewsToRender.length === 0) return;
    const interval = setInterval(() => {
      if (containerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [settings, reviewsToRender]);

  if (!settings || !settings.is_active || reviewsToRender.length === 0) return null;

  const bgColor = settings.bg_color || '#ffffff';
  const textColor = settings.text_color || '#1f2937';

  return (
    <section
      style={{ backgroundColor: bgColor, color: textColor }}
      className="w-full py-16 px-4 md:px-12 lg:px-20 border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
              {settings.heading || 'Client testimonials'}
            </h2>
            <p className="text-sm opacity-70 max-w-xl leading-relaxed">
              {settings.subtext || 'Real travelers. Real stories. Real opinions to help you make the right choice.'}
            </p>
          </div>

          <Link
            to={settings.see_all_link || '/reviews'}
            className="text-sm font-bold text-[#136b8a] hover:underline whitespace-nowrap self-end mb-1"
          >
            {settings.button_text || 'See all testimonials'} &rarr;
          </Link>
        </div>

        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 scroll-smooth snap-x snap-mandatory"
        >
          {reviewsToRender.map((review) => (
            <div
              key={review.id}
              className="w-[280px] md:w-[350px] shrink-0 bg-gray-50 border border-gray-100 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow snap-start"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < (review.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>

                <p className="text-sm text-gray-700 italic leading-relaxed mb-6 font-medium">
                  "{review.review_text}"
                </p>
              </div>

              <div className="flex items-center gap-3 mt-auto border-t border-gray-200/50 pt-4">
                {review.customer_image_url ? (
                  <img
                    src={review.customer_image_url}
                    alt={review.customer_name}
                    className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {review.customer_name ? review.customer_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{review.customer_name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                    {review.destination && (
                      <span>Travelled to <span className="font-semibold">{review.destination}</span></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
