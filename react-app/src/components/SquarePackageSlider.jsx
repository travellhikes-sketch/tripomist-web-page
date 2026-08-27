import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';

const SquarePackageSlider = ({ packages, showCta, ctaText, hideNavigation }) => {
  const navigate = useNavigate();
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  if (!packages || packages.length === 0) return null;

  return (
    <div className="w-full relative py-4 group">
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={20}
        slidesPerView={1.2}
        breakpoints={{
          480: { slidesPerView: 1.5, spaceBetween: 20 },
          640: { slidesPerView: 2.2, spaceBetween: 24 },
          768: { slidesPerView: 2.5, spaceBetween: 24 },
          1024: { slidesPerView: 3.5, spaceBetween: 24 },
          1280: { slidesPerView: 4.5, spaceBetween: 32 },
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={packages.length > 4}
        className="w-full overflow-hidden"
      >
        {packages.map((pkg, index) => {
          const bg = pkg.image_url || pkg.banner_image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80";
          const priceStr = pkg.price != null && pkg.price !== '' ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : 'Price on request';
          const isClickable = pkg.is_clickable ?? true;
          const displayCta = showCta !== false;
          
          return (
            <SwiperSlide key={pkg.id || index} className="pb-4">
              <div 
                onClick={() => {
                  if (isClickable && pkg.slug) {
                    navigate(`/itinerary/${pkg.slug}`);
                  }
                }}
                className={`relative aspect-square w-full rounded-[24px] overflow-hidden group/card shadow-sm hover:shadow-xl transition-all duration-300 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/card:scale-105"
                  style={{ backgroundImage: `url('${bg}')` }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                  {pkg.show_primary_badge && pkg.primary_badge_text && (
                    <span className="bg-white/90 backdrop-blur text-[#136b8a] text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">
                      {pkg.primary_badge_text}
                    </span>
                  )}
                  {pkg.show_secondary_badge && pkg.secondary_badge_text && (
                    <span className="bg-white/90 backdrop-blur text-emerald-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider ml-auto">
                      {pkg.secondary_badge_text}
                    </span>
                  )}
                </div>

                {/* Content at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-col justify-end">
                  <h3 className="text-white font-bold text-lg md:text-xl leading-tight mb-1 drop-shadow-md line-clamp-2">
                    {pkg.title}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-white/90 mb-3 drop-shadow-sm">
                     <span className="material-symbols-outlined text-[14px]">schedule</span>
                     <span className="text-xs font-semibold">{pkg.duration || 'Flexible'}</span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">Starting From</p>
                      <p className="text-white font-extrabold text-lg drop-shadow-sm leading-none">{priceStr}</p>
                    </div>

                    {displayCta && (
                      <div className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all ${isClickable ? 'group-hover/card:bg-white group-hover/card:text-[#136b8a] text-white' : 'opacity-50 text-white/50'}`}>
                        <span className="material-symbols-outlined text-[18px]">
                           {isClickable ? 'arrow_outward' : 'lock'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Custom Navigation Arrows */}
      {!hideNavigation && (
        <>
          <div ref={prevRef} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#136b8a] cursor-pointer transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0 hidden md:flex">
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </div>
          <div ref={nextRef} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#136b8a] cursor-pointer transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0 hidden md:flex">
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </div>
        </>
      )}
    </div>
  );
};

export default SquarePackageSlider;
