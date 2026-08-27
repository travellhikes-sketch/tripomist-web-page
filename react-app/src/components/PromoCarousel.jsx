import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_PROMO_BANNERS = [
  { id: 'pb1', title: 'VALLEY OF FLOWERS', subtitle: 'Explore the Himalayan Bloom', image: 'https://res.cloudinary.com/yefluulb/image/upload/v1784911022/file_000000008360820babc664eada874536_if2ae0.png', image_url: 'https://res.cloudinary.com/yefluulb/image/upload/v1784911022/file_000000008360820babc664eada874536_if2ae0.png', cta_text: 'Explore Trip', cta_label: 'Explore Trip', cta_link: '/itinerary/valley-of-flowers-with-hemkund-sahib', cta_url: '/itinerary/valley-of-flowers-with-hemkund-sahib', active: true, is_active: true, display_order: 1, clickable: true },
  { id: 'pb2', title: 'KEDARNATH', subtitle: 'Journey to the Sacred Himalayas', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200', cta_text: 'Explore Trip', cta_label: 'Explore Trip', cta_link: '/destinations/uttarakhand', cta_url: '/destinations/uttarakhand', active: true, is_active: true, display_order: 2, clickable: true },
  { id: 'pb3', title: 'HAMPTA PASS', subtitle: 'Cross Into Another World', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200', cta_text: 'Explore Trek', cta_label: 'Explore Trek', cta_link: '/itinerary/hampta-pass-trek', cta_url: '/itinerary/hampta-pass-trek', active: true, is_active: true, display_order: 3, clickable: true },
  { id: 'pb4', title: 'LADAKH', subtitle: 'Ride Beyond the Ordinary', image: 'https://images.unsplash.com/photo-1581793746485-04698e79a4e8?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1581793746485-04698e79a4e8?q=80&w=1200', cta_text: 'Explore Tour', cta_label: 'Explore Tour', cta_link: '/destinations/ladakh', cta_url: '/destinations/ladakh', active: true, is_active: true, display_order: 4, clickable: true }
];

const DEFAULT_TRUST_BANNERS = [
  { id: 'tb1', title: 'Best for Solo Travelers', subtitle: 'Travel solo. Return with a tribe. Intimate group sizes ensure personal attention and stronger bonds.', image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1200', active: true, is_active: true, display_order: 1, clickable: false },
  { id: 'tb2', title: 'Safe for Girls', subtitle: 'Our group trips have a 60:40 gender ratio with certified female and male trip captains.', image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=1200', active: true, is_active: true, display_order: 2, clickable: false },
  { id: 'tb3', title: 'Experienced Trip Captains', subtitle: 'Certified mountaineers and local guides who know the terrain, safety protocols, and cultures.', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200', active: true, is_active: true, display_order: 3, clickable: false }
];

const BANNER_PALETTES = [
  'from-[#136b8a] to-[#0a3f54]',
  'from-[#1e3a5f] to-[#2d6a4f]',
  'from-[#4a1c40] to-[#8b1a6b]',
  'from-[#2c3e50] to-[#1a252f]'
];

const normalizeBanner = (banner, index) => {
  if (!banner) return null;
  const id = banner.id || `pb_${index}_${Date.now()}`;
  const image = banner.image || banner.image_url || '';
  const title = banner.title || '';
  const subtitle = banner.subtitle || '';
  const cta_text = banner.cta_text || banner.cta_label || '';
  const cta_link = banner.cta_link || banner.cta_url || '';
  const active = banner.active !== undefined ? banner.active : (banner.is_active !== undefined ? banner.is_active : true);
  const display_order = banner.display_order !== undefined ? parseInt(banner.display_order, 10) : (index + 1);
  const clickable = banner.clickable !== undefined ? banner.clickable : (banner.is_clickable !== undefined ? banner.is_clickable : true);
  return {
    id,
    image,
    image_url: image,
    title,
    subtitle,
    cta_text,
    cta_label: cta_text,
    cta_link,
    cta_url: cta_link,
    active,
    is_active: active,
    display_order,
    clickable,
    is_clickable: clickable
  };
};

const isExternal = (url) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
};

export default function PromoCarousel({ settingKey = "homepage_promo_banners", size = "large", showTitle = true }) {
  const [banners, setBanners] = useState([]);
  const [title, setTitle] = useState('');
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dragStartX = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', settingKey)
          .single();

        if (data && data.setting_value) {
          if (settingKey === 'why_choose_us_banners') {
            setTitle(data.setting_value.title || 'Why Choose Us');
            const list = Array.isArray(data.setting_value.banners) ? data.setting_value.banners : [];
            const normalized = list
              .map((b, idx) => normalizeBanner(b, idx))
              .filter(b => b.active)
              .sort((a, b) => a.display_order - b.display_order);
            setBanners(normalized.length > 0 ? normalized : DEFAULT_TRUST_BANNERS);
          } else {
            const list = Array.isArray(data.setting_value.banners) ? data.setting_value.banners : [];
            const normalized = list
              .map((b, idx) => normalizeBanner(b, idx))
              .filter(b => b.active)
              .sort((a, b) => a.display_order - b.display_order);
            setBanners(normalized.length > 0 ? normalized : DEFAULT_PROMO_BANNERS);
          }
        } else {
          if (settingKey === 'why_choose_us_banners') {
            setTitle('Why Choose Us');
            setBanners(DEFAULT_TRUST_BANNERS);
          } else {
            setBanners(DEFAULT_PROMO_BANNERS);
          }
        }
      } catch (err) {
        console.error(`Error loading promo banners for key ${settingKey}:`, err);
        if (settingKey === 'why_choose_us_banners') {
          setTitle('Why Choose Us');
          setBanners(DEFAULT_TRUST_BANNERS);
        } else {
          setBanners(DEFAULT_PROMO_BANNERS);
        }
      }
    }
    fetchBanners();
  }, [settingKey]);

  const total = banners.length;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearTimer();
    if (total <= 1 || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 2500);
  }, [total, isPaused, clearTimer]);

  const goTo = useCallback((idx) => {
    setCurrent(((idx % total) + total) % total);
    resetTimer();
  }, [total, resetTimer]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    resetTimer();
    return () => clearTimer();
  }, [resetTimer, clearTimer]);

  const handleTouchStart = (e) => { dragStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (dragStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - dragStartX.current;
    if (diff < -40) next();
    else if (diff > 40) prev();
    dragStartX.current = null;
  };

  const handleMouseDown = (e) => { dragStartX.current = e.clientX; };
  const handleMouseUp = (e) => {
    if (dragStartX.current === null) return;
    const diff = e.clientX - dragStartX.current;
    if (Math.abs(diff) > 40) { diff < 0 ? next() : prev(); }
    dragStartX.current = null;
  };

  if (total === 0) return null;

  const isLarge = size === "large";
  const containerClass = "relative max-w-[1550px] w-[94vw] mx-auto my-6 md:my-8 px-0";

  const heightClass = isLarge 
    ? "h-[200px] sm:h-[300px] md:h-[400px] lg:h-[450px]" 
    : "h-[160px] sm:h-[180px] md:h-[190px] lg:h-[200px]";

  const textOverlayClass = isLarge
    ? "relative z-10 flex flex-col justify-center px-8 sm:px-16 md:px-20 lg:px-24 py-6 max-w-3xl text-left select-none"
    : "relative z-10 flex flex-col justify-center px-8 sm:px-16 md:px-20 lg:px-24 py-4 max-w-3xl text-left select-none";

  const titleClass = isLarge
    ? "text-white font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight mb-2 md:mb-3 drop-shadow-sm"
    : "text-white font-extrabold text-lg sm:text-xl md:text-2xl leading-tight mb-1.5 drop-shadow-sm";

  const subtitleClass = isLarge
    ? "text-white/90 text-xs sm:text-sm md:text-lg lg:text-xl leading-relaxed mb-4 md:mb-6 max-w-lg sm:max-w-xl"
    : "text-white/90 text-[11px] sm:text-xs md:text-sm leading-relaxed mb-3 max-w-md sm:max-w-xl";

  const ctaBtnClass = isLarge
    ? "inline-flex items-center gap-1.5 bg-white text-[#136b8a] font-bold text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-full hover:bg-white/90 transition-colors w-fit shadow-sm"
    : "inline-flex items-center gap-1.5 bg-white text-[#136b8a] font-bold text-[10px] md:text-xs px-3.5 py-1.5 md:px-4.5 md:py-2 rounded-full hover:bg-white/90 transition-colors w-fit shadow-sm";

  return (
    <div className="w-full">
      {/* Centered Why Choose Us Title if present */}
      {settingKey === 'why_choose_us_banners' && showTitle && title && (
        <div className="text-center mt-10 mb-4 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            {title}
          </h2>
        </div>
      )}

      <div className={containerClass}>
        <div
          className="relative w-full"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {/* Slides container */}
          <div className="overflow-hidden rounded-lg w-full bg-slate-50 border border-gray-100/50 shadow-none">
            <div
              className="flex"
              style={{
                transform: `translateX(-${current * 100}%)`,
                transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'transform'
              }}
            >
              {banners.map((banner, idx) => {
                const palette = BANNER_PALETTES[idx % BANNER_PALETTES.length];
                const hasCta = banner.clickable && !!banner.cta_link;
                const isExt = isExternal(banner.cta_link);

                const isVideo = banner.image && (
                  banner.image.toLowerCase().endsWith('.mp4') || 
                  banner.image.toLowerCase().endsWith('.webm') ||
                  banner.image.toLowerCase().includes('/video/upload/')
                );

                const contentMarkup = (
                  <div className={`relative flex items-center overflow-hidden w-full bg-gradient-to-r ${palette} ${heightClass} ${!banner.clickable ? 'cursor-default' : 'cursor-pointer'}`}>
                    {banner.image && (
                      isVideo ? (
                        <video
                          src={banner.image}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-102"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-102"
                          style={{ backgroundImage: `url('${banner.image}')` }}
                        />
                      )
                    )}

                    {/* Text Overlay */}
                    <div className={textOverlayClass}>
                      {banner.title && (
                        <h3 className={titleClass}>
                          {banner.title}
                        </h3>
                      )}
                      {banner.subtitle && (
                        <p className={subtitleClass}>
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.cta_text && banner.clickable && (
                        <span className={ctaBtnClass}>
                          {banner.cta_text}
                          <span className="material-symbols-outlined text-[13px] md:text-[15px]">arrow_outward</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                  </div>
                );

                return (
                  <div key={banner.id} className="shrink-0 w-full" style={{ minWidth: '100%' }}>
                    {hasCta ? (
                      isExt ? (
                        <a href={banner.cta_link} target="_blank" rel="noopener noreferrer" className="block w-full h-full select-none">
                          {contentMarkup}
                        </a>
                      ) : (
                        <Link to={banner.cta_link} className="block w-full h-full select-none">
                          {contentMarkup}
                        </Link>
                      )
                    ) : (
                      <div className="w-full h-full select-none">
                        {contentMarkup}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Small Navigation Arrows */}
          {total > 1 && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); prev(); }}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#136b8a] border border-gray-100 flex items-center justify-center transition-colors shadow-sm"
                aria-label="Previous banner"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); next(); }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#136b8a] border border-gray-100 flex items-center justify-center transition-colors shadow-sm"
                aria-label="Next banner"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        {/* Tiny indicators directly below */}
        {total > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === current ? 'bg-[#136b8a] w-5' : 'bg-gray-200 hover:bg-gray-300 w-1.5'}`}
                aria-label={`Go to banner ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
