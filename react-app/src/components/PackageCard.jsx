import React from 'react'
import { Link } from 'react-router-dom'
import WishlistButton from './WishlistButton'
import { formatSlugToTitle } from '../utils/formatters'

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
  className,
  secondaryBadgeText,
  showSecondaryBadge,
  isClickable = true,
  cardCtaText = 'Click',
  cardCtaAction = 'open_package',
  cardCtaUrl = ''
}) => {
  const displayPrice = price ? (typeof price === 'string' && !price.includes('/-') ? `${price}/-` : price) : null;
  const displayOriginalPrice = originalPrice ? (typeof originalPrice === 'string' && !originalPrice.includes('/-') ? `${originalPrice}/-` : originalPrice) : null;
  
  let finalLink = link;
  let finalIsClickable = isClickable;
  let displayCtaText = cardCtaText || 'Click';

  if (cardCtaAction === 'coming_soon') {
      finalIsClickable = false;
      displayCtaText = cardCtaText && cardCtaText !== 'Click' ? cardCtaText : 'Coming Soon';
  } else if (cardCtaAction === 'custom_url' && cardCtaUrl) {
      finalLink = cardCtaUrl;
  }

  const hasValidLink = finalLink && finalLink !== '#';
  const shouldBeClickable = finalIsClickable && hasValidLink;
  
  let finalSecondaryBadge = (showSecondaryBadge && secondaryBadgeText) ? secondaryBadgeText : null;

  const CardWrapper = shouldBeClickable ? Link : 'div';
  const wrapperProps = shouldBeClickable ? { to: finalLink || '#' } : {};

  return (
    <CardWrapper 
      {...wrapperProps}
      draggable={false}
      className={`rounded-3xl overflow-hidden group relative flex flex-col shadow-sm transition-all duration-300 select-none block bg-[#cdeae7] border border-gray-100 ${shouldBeClickable ? 'hover:shadow-xl' : 'opacity-95'} ${className || 'w-full h-[360px]'}`}
    >
      {/* Top Image Section */}
      <div className="relative w-full h-[55%] overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url('${bg}')` }}></div>
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="absolute top-4 left-4 right-4 flex justify-end items-start gap-2 z-10 pointer-events-none">

          {/* Secondary Badges/Discount in Lime Green */}
          <div className="flex flex-col items-end gap-2">
            {finalSecondaryBadge && (
              <div className={
                finalSecondaryBadge.toLowerCase() === 'coming soon' 
                  ? "bg-white/30 backdrop-blur-md text-black font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-white/50" 
                  : "bg-white/30 backdrop-blur-md text-[#136b8a] font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-[#136b8a]/30"
              }>
                {finalSecondaryBadge}
              </div>
            )}
            {discountText && !finalSecondaryBadge && (
              <div className="bg-white/30 backdrop-blur-md text-[#136b8a] font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-[#136b8a]/30">
                {discountText}
              </div>
            )}
          </div>
        </div>


      </div>

      {/* Bottom Content Section */}
      <div className="flex flex-col p-5 h-[45%] justify-between">
        <div>
          <h3 className="text-gray-900 text-[20px] md:text-[22px] font-extrabold leading-[1.2] mb-2 line-clamp-2 min-h-[48px] md:min-h-[53px]">{tripTitle}</h3>
          
          <div className="flex items-center gap-1.5 text-gray-500">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span className="text-[12px] font-medium tracking-wide">{duration}</span>
          </div>
        </div>

        <div className="flex items-end justify-between w-full mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Price</span>
            <div className="flex items-center gap-2">
              <span className="text-[#136b8a] font-extrabold text-[22px] leading-none">
                {displayPrice}
              </span>
            </div>
          </div>
          
          {/* Animated View Detail Arrow or Coming Soon */}
          <div className={`relative overflow-hidden group/btn bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100 flex items-center transition-all ${shouldBeClickable ? 'cursor-pointer' : 'cursor-default'}`}>
            {shouldBeClickable && <div className="absolute inset-0 w-0 bg-[#136b8a] transition-all duration-300 ease-out group-hover/btn:w-full z-0"></div>}
            <div className={`relative z-10 flex items-center font-bold text-[12px] whitespace-nowrap transition-colors duration-300 ${shouldBeClickable ? 'text-gray-900 group-hover/btn:text-white' : 'text-gray-400'}`}>
              <span className={shouldBeClickable ? "mr-1" : ""}>{displayCtaText}</span>
              {shouldBeClickable && <span className="material-symbols-outlined text-[16px]">arrow_outward</span>}
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  )
}

export default PackageCard
