import React, { useRef, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';

export default function ReviewGalleryCarousel({ media, onMediaClick }) {
  const swiperRef = useRef(null);

  const handlePrev = useCallback(() => {
    if (swiperRef.current) swiperRef.current.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    if (swiperRef.current) swiperRef.current.slideNext();
  }, []);

  if (!media || media.length === 0) return null;

  return (
    <div className="w-full relative" style={{ overflow: 'hidden' }}>
      {/* Curved cinematic wrapper */}
      <div
        style={{
          clipPath: 'polygon(0% 0%, 5% 3%, 15% 5%, 30% 5.7%, 50% 6%, 70% 5.7%, 85% 5%, 95% 3%, 100% 0%, 100% 100%, 95% 97%, 85% 95%, 70% 94.3%, 50% 94%, 30% 94.3%, 15% 95%, 5% 97%, 0% 100%)',
          width: '100%',
        }}
      >
        <Swiper
          modules={[Navigation, Autoplay]}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          spaceBetween={5}
          slidesPerView={1.3}
          breakpoints={{
            480: { slidesPerView: 2.2, spaceBetween: 5 },
            640: { slidesPerView: 3, spaceBetween: 5 },
            768: { slidesPerView: 3.5, spaceBetween: 5 },
            1024: { slidesPerView: 4.5, spaceBetween: 5 },
            1280: { slidesPerView: 5.2, spaceBetween: 5 },
            1440: { slidesPerView: 5.5, spaceBetween: 5 },
          }}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          grabCursor={true}
          simulateTouch={true}
          allowTouchMove={true}
          touchStartPreventDefault={false}
          preventClicks={true}
          preventClicksPropagation={true}
          speed={600}
          className="gallery-swiper"
          style={{ overflow: 'visible' }}
        >
          {media.map((item, idx) => (
            <SwiperSlide key={item.id || idx}>
              <div
                style={{
                  aspectRatio: '4 / 5',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: '0px',
                  backgroundColor: '#e5e7eb',
                  userSelect: 'none',
                }}
                onClick={() => onMediaClick && onMediaClick(idx)}
              >
                {item.media_type === 'video' ? (
                  <>
                    <img
                      src={item.thumbnail_url || item.media_url}
                      alt={item.title || 'Gallery video'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        borderRadius: '0px',
                        pointerEvents: 'none',
                      }}
                      draggable={false}
                      loading="lazy"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <Play
                        style={{ color: 'white', fill: 'white', width: 48, height: 48, opacity: 0.85 }}
                      />
                    </div>
                  </>
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.title || 'Gallery image'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      borderRadius: '0px',
                      pointerEvents: 'none',
                    }}
                    draggable={false}
                    loading="lazy"
                  />
                )}

                {/* Bottom gradient */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '35%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
                    pointerEvents: 'none',
                    borderRadius: '0px',
                  }}
                />

                {/* Location capsule */}
                {(item.location || item.title) && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: 20,
                      padding: '4px 10px',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 12, height: 12, flexShrink: 0 }}
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span
                      style={{
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 500,
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.location || item.title}
                    </span>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* LEFT circular arrow — uses direct swiper ref */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous photos"
        style={{
          position: 'absolute',
          left: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 30,
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'none',
          padding: 0,
          outline: 'none',
        }}
      >
        <ChevronLeft size={20} style={{ color: '#01AFD1' }} />
      </button>

      {/* RIGHT circular arrow — uses direct swiper ref */}
      <button
        type="button"
        onClick={handleNext}
        aria-label="Next photos"
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 30,
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'none',
          padding: 0,
          outline: 'none',
        }}
      >
        <ChevronRight size={20} style={{ color: '#01AFD1' }} />
      </button>
    </div>
  );
}
