import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import {
  Heart, User, Shield, Compass, Star, Smile, Sparkles, Award,
  Home, Building, Users, MapPin, ThumbsUp, CheckCircle, ShieldCheck,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const ICON_MAP = {
  Heart, User, Shield, Compass, Star, Smile, Sparkles, Award,
  Home, Building, Users, MapPin, ThumbsUp, CheckCircle, ShieldCheck
};

const DEFAULT_CARDS = [
  { id: '1', heading: 'Handpicked Stays', description: 'We personally verify every hotel, homestay, and camp to ensure premium comfort and safety.', icon: 'Home', is_active: true },
  { id: '2', heading: 'Certified Guides', description: 'Travel with experienced trip captains who know the mountains like the back of their hand.', icon: 'Shield', is_active: true },
  { id: '3', heading: 'Small Groups', description: 'Intimate group sizes (12-16 pax) ensure personal attention and stronger bonds among travellers.', icon: 'Users', is_active: true },
  { id: '4', heading: 'Local Community', description: 'Start your journey from Delhi with like-minded locals. Pre-trip meetups to break the ice.', icon: 'Sparkles', is_active: true }
];

const DEFAULT_BANNERS = [
  { id: 'pb1', title: 'SOLO TRIPS', subtitle: 'Travel solo. Return with a tribe.', image: '', image_url: '', cta_text: 'Explore Solo Trips', cta_label: 'Explore Solo Trips', cta_link: '/group-trips', cta_url: '/group-trips', active: true, is_active: true, display_order: 1 },
  { id: 'pb2', title: 'WEEKEND ESCAPES', subtitle: 'Quick mountain breaks from Delhi.', image: '', image_url: '', cta_text: 'See Weekend Trips', cta_label: 'See Weekend Trips', cta_link: '/weekend-trips', cta_url: '/weekend-trips', active: true, is_active: true, display_order: 2 },
  { id: 'pb3', title: 'WOMEN-FRIENDLY GROUP TRIPS', subtitle: 'Safer journeys, better memories.', image: '', image_url: '', cta_text: 'View Trips', cta_label: 'View Trips', cta_link: '/group-trips', cta_url: '/group-trips', active: true, is_active: true, display_order: 3 },
  { id: 'pb4', title: 'CUSTOMISED TRIPS', subtitle: 'Your dates. Your people. Your journey.', image: '', image_url: '', cta_text: 'Contact Us', cta_label: 'Contact Us', cta_link: '/contact', cta_url: '/contact', active: true, is_active: true, display_order: 4 }
];

// ─── Promo Banner Normalization Helper ─────────────────────────────────────────
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
    display_order
  };
};

const isExternal = (url) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
};

// ─── Promo Banner Gradient Palettes (fallback when no image) ─────────────────
const BANNER_PALETTES = [
  'from-[#136b8a] to-[#0a3f54]',
  'from-[#1e3a5f] to-[#2d6a4f]',
  'from-[#4a1c40] to-[#8b1a6b]',
  'from-[#2c3e50] to-[#1a252f]',
];

// ─── PromoBannerCarousel Component ────────────────────────────────────────────
function PromoBannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(null);
  const timerRef = useRef(null);

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
    }, 2000);
  }, [total, isPaused, clearTimer]);

  const goTo = useCallback((idx) => {
    setCurrent(((idx % total) + total) % total);
    resetTimer();
  }, [total, resetTimer]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-slide every 2 seconds
  useEffect(() => {
    resetTimer();
    return () => clearTimer();
  }, [resetTimer, clearTimer]);

  // Touch / swipe support
  const handleTouchStart = (e) => { dragStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (dragStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - dragStartX.current;
    if (diff < -40) next();
    else if (diff > 40) prev();
    dragStartX.current = null;
  };

  // Mouse drag support
  const handleMouseDown = (e) => { dragStartX.current = e.clientX; setIsDragging(false); };
  const handleMouseMove = (e) => { if (dragStartX.current !== null && Math.abs(e.clientX - dragStartX.current) > 5) setIsDragging(true); };
  const handleMouseUp = (e) => {
    if (dragStartX.current === null) return;
    const diff = e.clientX - dragStartX.current;
    if (Math.abs(diff) > 40) { diff < 0 ? next() : prev(); }
    dragStartX.current = null;
  };

  if (total === 0) return null;

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ userSelect: 'none' }}
    >
      {/* Slides wrapper */}
      <div
        className="flex"
        style={{
          transform: `translateX(-${current * 100}%)`,
          transition: prefersReduced ? 'none' : 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
          willChange: 'transform'
        }}
      >
        {banners.map((banner, idx) => {
          const palette = BANNER_PALETTES[idx % BANNER_PALETTES.length];
          const hasCta = !!banner.cta_link;
          const isExt = isExternal(banner.cta_link);
          const bannerContent = (
            <>
              {/* Background image (if set) */}
              {banner.image && (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                    style={{ backgroundImage: `url('${banner.image}')` }}
                  />
                  <div className="absolute inset-0 bg-black/45" />
                </>
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col justify-center px-8 py-5 max-w-xl text-left">
                <span className="text-white/70 text-[10px] font-bold uppercase tracking-[0.18em] mb-1">
                  TripoMist Presents
                </span>
                {banner.title && (
                  <h3 className="text-white font-extrabold text-xl md:text-2xl leading-tight mb-1.5 drop-shadow">
                    {banner.title}
                  </h3>
                )}
                {banner.subtitle && (
                  <p className="text-white/85 text-xs md:text-sm leading-relaxed mb-4 max-w-sm">
                    {banner.subtitle}
                  </p>
                )}
                {banner.cta_text && (
                  <span
                    className="inline-flex items-center gap-1.5 bg-white text-[#136b8a] font-bold text-xs px-4 py-2 rounded-full hover:bg-white/90 transition-colors w-fit shadow"
                  >
                    {banner.cta_text}
                    <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </span>
                )}
              </div>

              {/* Decorative right side glow */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
            </>
          );

          const cardClass = `relative flex items-center overflow-hidden rounded-2xl bg-gradient-to-r ${palette} shadow-md w-full select-none`;
          const cardStyle = { height: '190px', maxHeight: '210px' };

          return (
            <div
              key={banner.id}
              className="shrink-0 w-full"
              style={{ minWidth: '100%' }}
            >
              {hasCta ? (
                isExt ? (
                  <a
                    href={banner.cta_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${cardClass} block`}
                    style={cardStyle}
                  >
                    {bannerContent}
                  </a>
                ) : (
                  <Link
                    to={banner.cta_link}
                    className={`${cardClass} block`}
                    style={cardStyle}
                  >
                    {bannerContent}
                  </Link>
                )
              ) : (
                <div className={cardClass} style={cardStyle}>
                  {bannerContent}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full p-1.5 transition-all"
            aria-label="Previous banner"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full p-1.5 transition-all"
            aria-label="Next banner"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`rounded-full transition-all ${idx === current ? 'bg-white w-4 h-1.5' : 'bg-white/50 w-1.5 h-1.5'}`}
              aria-label={`Go to banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BenefitsSection() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function fetchBenefits() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'trust_benefits')
          .single();
        if (data && data.setting_value) {
          setSettings(data.setting_value);
        } else {
          setSettings({
            is_active: true,
            title: 'The TripoMist Experience',
            subtitle: "We don't just organize trips; we curate experiences. Here's why 50,000+ travellers choose us",
            cards: DEFAULT_CARDS,
            promo_banners: []
          });
        }
      } catch (err) {
        setSettings({
          is_active: true,
          title: 'The TripoMist Experience',
          subtitle: "We don't just organize trips; we curate experiences. Here's why 50,000+ travellers choose us",
          cards: DEFAULT_CARDS,
          promo_banners: []
        });
      }
    }
    fetchBenefits();
  }, []);

  if (!settings || settings.is_active === false) {
    return null;
  }

  const title = settings.title ?? 'The TripoMist Experience';
  const subtitle = settings.subtitle ?? "We don't just organize trips; we curate experiences. Here's why 50,000+ travellers choose us";
  const rawCards = settings.cards && settings.cards.length > 0 ? settings.cards : DEFAULT_CARDS;
  const cards = rawCards.filter(c => c.is_active !== false);
  const existingBanners = settings.promo_banners;
  const rawBanners = (!existingBanners || existingBanners.length === 0) ? DEFAULT_BANNERS : existingBanners;
  const promoBanners = rawBanners
    .map((b, idx) => normalizeBanner(b, idx))
    .filter(b => b.active)
    .sort((a, b) => a.display_order - b.display_order);

  if (cards.length === 0 && promoBanners.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 md:py-20 px-4 md:px-12 lg:px-20 bg-slate-50/60 border-t border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h2 className="font-bold text-2xl md:text-3xl lg:text-4xl text-gray-900 tracking-tight mb-3">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Promo Banner Carousel — between heading and feature cards */}
        {promoBanners.length > 0 && (
          <div className="mb-10">
            <PromoBannerCarousel banners={promoBanners} />
          </div>
        )}

        {/* Feature Cards Grid */}
        {cards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, idx) => {
              const IconComponent = ICON_MAP[card.icon] || Heart;
              return (
                <div
                  key={card.id || idx}
                  className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-7 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 flex flex-col items-start"
                >
                  <div className="w-11 h-11 rounded-full bg-[#e8f4f8] text-[#136b8a] flex items-center justify-center mb-5 shrink-0">
                    <IconComponent className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 leading-snug">
                    {card.heading || card.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
