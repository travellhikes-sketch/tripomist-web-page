import React from 'react'
import { Link } from 'react-router-dom'
import WishlistButton from './WishlistButton'

const FeaturedTripCard = ({ tripTitle, packagesCount, bg, link, className }) => {
  return (
    <Link 
      to={link} 
      draggable={false}
      className={`rounded-[28px] overflow-hidden group relative flex flex-col justify-end shadow-sm hover:shadow-xl transition-all duration-300 select-none block ${className || 'w-full h-[380px] md:h-[420px]'}`}
    >
      <div className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700 pointer-events-none" style={{ backgroundImage: `url('${bg}')` }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent h-[60%] mt-auto pointer-events-none"></div>

      <div className="relative z-10 p-5 md:p-6 w-full flex justify-between items-end mt-auto">
        <div className="flex flex-col">
          <h3 className="text-white text-[24px] md:text-[28px] font-bold leading-tight drop-shadow-md mb-0.5">{tripTitle}</h3>
          <span className="text-white text-[12px] md:text-[14px] font-bold">{packagesCount} Packages</span>
        </div>
        
        <div className="border border-white/60 text-white text-[12px] px-5 py-2 rounded-full hover:bg-white/20 hover:border-white transition-all backdrop-blur-sm cursor-pointer flex items-center gap-1 font-medium whitespace-nowrap mb-1">
          View All <span className="material-symbols-outlined text-[16px] leading-none">arrow_forward</span>
        </div>
      </div>
      <WishlistButton packageSlug={link?.replace('/itinerary/', '')} />
    </Link>
  )
}

export default FeaturedTripCard
