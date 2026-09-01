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
  primaryBadgeText,
  showPrimaryBadge = true,
  secondaryBadgeText,
  showSecondaryBadge,
  isClickable = true,
  cardCtaText = 'Click',
  cardCtaAction = 'open_package',
  cardCtaUrl = '',
  departureDates = [],
  listingCategories = []
}) => {
  const isUpcoming = false; // Standardized layout
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
  
  let finalSecondaryBadge = (showSecondaryBadge && secondaryBadgeText) ? secondaryBadgeText.replace(/saller/i, 'Seller') : null;

  const CardWrapper = shouldBeClickable ? Link : 'div';
  const wrapperProps = shouldBeClickable ? { to: finalLink || '#' } : {};

  // ── MONTH-WISE date logic ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingDates = (departureDates || [])
    .filter(d => new Date(d) >= today)
    .sort();

  // Group by nearest month that has dates
  let previewDates = [];
  let extraCount = 0;

  if (upcomingDates.length > 0) {
    const firstDate = new Date(upcomingDates[0]);
    const targetMonth = firstDate.getMonth();
    const targetYear = firstDate.getFullYear();

    // Filter only dates from that same month+year
    const sameMonthDates = upcomingDates.filter(d => {
      const dt = new Date(d);
      return dt.getMonth() === targetMonth && dt.getFullYear() === targetYear;
    });

    previewDates = sameMonthDates.slice(0, 2);
    extraCount = sameMonthDates.length - 2;
  }

  // ── UPCOMING VARIANT (image-focused, minimal) ──
  if (isUpcoming) {
    return (
      <CardWrapper
        {...wrapperProps}
        className={`rounded-xl overflow-hidden group relative flex flex-col transition-all duration-300 select-none block border border-gray-200/60 ${shouldBeClickable ? 'hover:border-gray-300 cursor-pointer' : 'opacity-95'} ${className || 'w-full h-[340px]'}`}
      >
        {/* Full-bleed background image */}
        <div className="absolute inset-0 bg-cover bg-center group-hover:scale-[1.03] transition-transform duration-700" style={{ backgroundImage: `url('${bg}')` }}></div>

        {/* Subtle gradient at bottom only */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Bottom: Title + Starting Price */}
        <div className="relative z-10 p-4 pb-5 flex flex-col items-center text-center">
          <h3 className="text-white text-base md:text-lg font-bold leading-[1.2] line-clamp-2 drop-shadow-sm tracking-wide">
            {tripTitle}
          </h3>
          {displayPrice && (
            <p className="text-white/80 text-xs md:text-sm font-medium mt-1.5 drop-shadow-sm">
              Starting Price <span className="text-white font-bold">{displayPrice}</span>
            </p>
          )}
        </div>
      </CardWrapper>
    );
  }

  // ── DEFAULT VARIANT (full detail card) ──
  return (
    <CardWrapper 
      {...wrapperProps}
      draggable={false}
      className={`rounded-xl overflow-hidden group relative flex flex-col transition-all duration-300 select-none block border border-gray-200/60 ${shouldBeClickable ? 'hover:border-gray-300' : 'opacity-95'} ${className || 'w-full h-[340px]'}`}
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0 bg-cover bg-center group-hover:scale-[1.03] transition-transform duration-700" style={{ backgroundImage: `url('${bg}')` }}></div>

      {/* Gradient overlay — stronger at bottom for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>

      {/* Top badges area */}
      <div className="relative z-10 flex justify-between items-start p-3">
        {/* Left: Best Seller badge & Primary badge — capsule/pill style */}
        <div className="flex flex-col gap-1.5 items-start">
          {showPrimaryBadge !== false && primaryBadgeText && (
            <div className="bg-white/85 backdrop-blur-sm text-cyan-700 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
              {primaryBadgeText}
            </div>
          )}
          {bestSeller && (
            <div className="bg-white/85 backdrop-blur-sm text-cyan-700 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
              Best Seller
            </div>
          )}
        </div>

        {/* Right: Secondary badge / Discount — capsule/pill style */}
        <div className="flex flex-col items-end gap-1.5">
          {finalSecondaryBadge && (
            <div className={
              finalSecondaryBadge.toLowerCase() === 'coming soon' 
                ? "bg-white/85 backdrop-blur-sm text-gray-800 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider" 
                : "bg-white/85 backdrop-blur-sm text-cyan-700 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider"
            }>
              {finalSecondaryBadge}
            </div>
          )}
          {discountText && !finalSecondaryBadge && (
            <div className="bg-white/85 backdrop-blur-sm text-cyan-700 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
              {discountText}
            </div>
          )}
        </div>
      </div>

      {/* Spacer to push content to bottom */}
      <div className="flex-1"></div>

      {/* Bottom content — over image with gradient behind */}
      <div className="relative z-10 flex flex-col p-3.5 pt-2 gap-1.5">
        {/* Title */}
        <h3 className="text-white text-base font-bold leading-[1.25] line-clamp-2 drop-shadow-sm">{tripTitle}</h3>
        
        {/* Duration + Dates Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Duration — LEFT */}
          <div className="flex items-center gap-1 text-white/80 shrink-0">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span className="text-[10px] font-semibold tracking-wide">{duration}</span>
          </div>

          {/* Date capsules — RIGHT (red/pink accent) */}
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {previewDates.length > 0 ? (
              <>
                {previewDates.map((d, idx) => (
                  <div
                    key={idx}
                    className="shrink-0 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  >
                    {new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </div>
                ))}
                {extraCount > 0 && (
                  <div className="shrink-0 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    +{extraCount} More
                  </div>
                )}
              </>
            ) : (
              <div className="text-[9px] font-semibold text-white/60 italic">Dates Coming Soon</div>
            )}
          </div>
        </div>

        {/* Price and CTA Row */}
        <div className="flex items-end justify-between w-full mt-0.5">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Price</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold text-[18px] leading-none drop-shadow-sm">
                {displayPrice}
              </span>
            </div>
          </div>
          
          {/* CTA Button */}
          <div className={`relative overflow-hidden group/btn bg-white/15 backdrop-blur-sm rounded-[5px] px-3 py-1.5 border border-white/25 flex items-center transition-all ${shouldBeClickable ? 'cursor-pointer hover:bg-white/25' : 'cursor-default'}`}>
            <div className={`relative z-10 flex items-center font-bold text-[11px] whitespace-nowrap transition-colors duration-300 ${shouldBeClickable ? 'text-white' : 'text-white/50'}`}>
              <span className={shouldBeClickable ? "mr-1" : ""}>{displayCtaText}</span>
              {shouldBeClickable && <span className="material-symbols-outlined text-[14px]">arrow_outward</span>}
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  )
}

export default PackageCard
