import React from 'react';
import { useNavigate } from 'react-router-dom';

const SquarePackageCard = ({ pkg, showCta = true }) => {
  const navigate = useNavigate();
  if (!pkg) return null;

  const bg = pkg.image_url || pkg.banner_image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80";
  const priceStr = pkg.price != null && pkg.price !== '' ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : 'Price on request';
  const isClickable = pkg.is_clickable ?? true;

  return (
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
          <span className="bg-white/90 backdrop-blur text-[#01AFD1] text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">
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

          {showCta && (
            <div className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all ${isClickable ? 'group-hover/card:bg-white group-hover/card:text-[#01AFD1] text-white' : 'opacity-50 text-white/50'}`}>
              <span className="material-symbols-outlined text-[18px]">
                 {isClickable ? 'arrow_outward' : 'lock'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SquarePackageCard;
