import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import PackageCard from './PackageCard';

const RecommendedExtraPackages = ({ placementType, placementId, excludePackageIds = [] }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!placementType || !placementId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('package_placements')
          .select('*, Pakage!inner(*)')
          .eq('placement_type', placementType)
          .eq('placement_id', placementId)
          .eq('Pakage.status', 'active');

        if (error) throw error;

        const uniquePkgs = [];
        const seen = new Set();
        if (data) {
          data.forEach(d => {
            if (!seen.has(d.Pakage.id) && !excludePackageIds.includes(d.Pakage.id)) {
              seen.add(d.Pakage.id);
              uniquePkgs.push(d.Pakage);
            }
          });
        }
        
        setPackages(uniquePkgs);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [placementType, placementId]);

  const rowRef = React.useRef(null);
  const scrollRow = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const card = el.firstElementChild;
    const amount = card ? card.getBoundingClientRect().width + 16 : 300;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (loading || packages.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore More Trips</h2>
      <div className="relative group/row">
        {/* Left Arrow */}
        <button
          type="button"
          onClick={() => scrollRow('left')}
          className="flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#136b8a] border border-gray-100 items-center justify-center transition-colors shadow-md cursor-pointer opacity-0 group-hover/row:opacity-100 disabled:opacity-0"
          aria-label="Scroll left"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>
        
        {/* Right Arrow */}
        <button
          type="button"
          onClick={() => scrollRow('right')}
          className="flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#136b8a] border border-gray-100 items-center justify-center transition-colors shadow-md cursor-pointer opacity-0 group-hover/row:opacity-100 disabled:opacity-0"
          aria-label="Scroll right"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>

        <div ref={rowRef} className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
          {packages.map(pkg => (
            <PackageCard 
              key={pkg.id}
              destination={pkg.destination} 
              state={pkg.state}  
              className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0"
              tripTitle={pkg.title}
              price={pkg.price != null ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : 'Price on request'}
              duration={pkg.duration || 'Flexible'}
              description={pkg.short_description || pkg.destination || 'Experience an unforgettable journey.'}
              bg={pkg.image_url || pkg.banner_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'}
              link={`/itinerary/${pkg.slug}`}
              bestSeller={pkg.best_seller}
              listingCategories={pkg.listing_categories || []}
              isUpcoming={pkg.is_upcoming || false}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendedExtraPackages;
