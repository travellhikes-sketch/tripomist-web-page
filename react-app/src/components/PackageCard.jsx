import React from 'react'
import { Link } from 'react-router-dom'

const PackageCard = ({ 
  tripTitle, 
  price, 
  originalPrice,
  discountText,
  duration, 
  bg, 
  link, 
  label, 
  bestSeller,
  badge,
  className 
}) => {
  const displayPrice = price ? (typeof price === 'string' && !price.includes('/-') ? `${price}/-` : price) : null;
  const displayOriginalPrice = originalPrice ? (typeof originalPrice === 'string' && !originalPrice.includes('/-') ? `${originalPrice}/-` : originalPrice) : null;
  
  const isClickable = link && link !== '#';
  const showBadge = bestSeller ? 'Best Seller' : badge;

  return (
    <Link 
      to={link || '#'} 
      onClick={(e) => { if (!isClickable) e.preventDefault() }}
      draggable={false}
      className={`rounded-3xl overflow-hidden group relative flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 select-none block bg-white border border-gray-100 ${className || 'w-full h-[360px]'}`}
    >
      {/* Top Image Section */}
      <div className="relative w-full h-[55%] overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url('${bg}')` }}></div>
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
          {/* Label (e.g., MOUNTAINS or other category) */}
          <div className="bg-black/50 backdrop-blur-md text-white font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined text-[12px]">location_on</span>
            {label && label.toLowerCase() !== 'international' ? label : 'DESTINATION'}
          </div>

          {/* Badges/Discount in Lime Green */}
          <div className="flex flex-col items-end gap-2">
            {showBadge && (
              <div className="bg-[#ccff00] text-black font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                {showBadge}
              </div>
            )}
            {discountText && !showBadge && (
              <div className="bg-[#ccff00] text-black font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                {discountText}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Content Section */}
      <div className="flex flex-col p-5 h-[45%] justify-between">
        <div>
          <h3 className="text-gray-900 text-[20px] md:text-[22px] font-extrabold leading-[1.2] mb-2 line-clamp-2">{tripTitle}</h3>
          
          <div className="flex items-center gap-1.5 text-gray-500">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span className="text-[12px] font-medium tracking-wide">{duration}</span>
          </div>
        </div>

        <div className="flex items-end justify-between w-full mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">From</span>
            <div className="flex items-center gap-2">
              <span className="text-[#136b8a] font-extrabold text-[22px] leading-none">
                {displayPrice}
              </span>
              {displayOriginalPrice && (
                <span className="text-gray-400 text-[13px] line-through font-medium leading-none">
                  {displayOriginalPrice}
                </span>
              )}
            </div>
          </div>
          
          {/* Animated View Detail Arrow or Discount % */}
          <div className={`relative overflow-hidden group/btn bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100 flex items-center transition-all ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}>
            {isClickable && <div className="absolute inset-0 w-0 bg-[#136b8a] transition-all duration-300 ease-out group-hover/btn:w-full z-0"></div>}
            <div className={`relative z-10 flex items-center font-bold text-[12px] whitespace-nowrap transition-colors duration-300 ${isClickable ? 'text-gray-900 group-hover/btn:text-white' : 'text-gray-400'}`}>
              {discountText && showBadge && <span className="mr-1">{discountText}</span>}
              {!discountText && <span className="mr-1">View</span>}
              <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default PackageCard
