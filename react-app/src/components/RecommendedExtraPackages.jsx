import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import PackageCard from './PackageCard';
import SquarePackageSlider from './SquarePackageSlider';
import { CoverflowCarousel } from './ui/coverflow-carousel';

const RecommendedExtraPackages = ({ placementType, placementId, excludePackageIds = [] }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exploreStyle, setExploreStyle] = useState('normal');
  const [exploreHeading, setExploreHeading] = useState('Explore More Trips');
  const rowRef = React.useRef(null);

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
        
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['recommended_packages_display_style', 'recommended_packages_heading']);
          
        if (settingsData && settingsData.length > 0) {
          const style = settingsData.find(s => s.setting_key === 'recommended_packages_display_style');
          if (style) setExploreStyle(style.setting_value);
          
          const heading = settingsData.find(s => s.setting_key === 'recommended_packages_heading');
          if (heading && heading.setting_value) setExploreHeading(heading.setting_value);
        } else {
          setExploreStyle('normal');
        }
      } catch (err) {
        if (err.code !== 'PGRST116') {
          console.error('Error fetching recommendations:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [placementType, placementId, excludePackageIds]);

  if (loading || packages.length === 0) return null;

  const scrollRow = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const card = el.firstElementChild;
    const amount = card ? card.getBoundingClientRect().width + 16 : 300;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const mappedPackages = packages.map(pkg => ({
    id: pkg.id,
    destination: pkg.destination,
    state: pkg.state,
    title: pkg.title,
    tripTitle: pkg.title,
    price: pkg.price != null ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : 'Price on request',
    duration: pkg.duration || 'Flexible',
    description: pkg.short_description || pkg.destination || 'Experience an unforgettable journey.',
    image_url: pkg.image_url || pkg.banner_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    bg: pkg.image_url || pkg.banner_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    link: `/itinerary/${pkg.slug}`,
    slug: pkg.slug,
    best_seller: pkg.best_seller,
    listing_categories: pkg.listing_categories || [],
    is_upcoming: pkg.is_upcoming || false,
    bestSeller: pkg.best_seller,
    listingCategories: pkg.listing_categories || [],
    isUpcoming: pkg.is_upcoming || false,
  }));

  return (
    <div className="w-full relative group/row mt-8 pb-12 border-t border-gray-200 pt-2">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 tracking-tight">{exploreHeading}</h2>
      
      {exploreStyle === 'advanced_3d' && (
        <CoverflowCarousel
          showCaption={false}
          showNavigation={false}
          showPagination={true}
          loop={true}
          slides={packages.map(pkg => ({
            src: pkg.image_url || pkg.banner_image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
            alt: pkg.title || pkg.destination || 'Package Image',
            title: pkg.title,
            subtitle: pkg.duration ? `${pkg.duration}` : 'Flexible',
            meta: [{ label: "Starting from", value: pkg.price != null && pkg.price !== '' ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : 'Price on request' }],
            link: `/itinerary/${pkg.slug}`
          }))}
        />
      )}

      {(exploreStyle === 'advanced_1_1' || exploreStyle === 'square') && (
        <SquarePackageSlider 
          packages={packages}
          showCta={true}
          ctaText="Explore Trip"
          hideNavigation={true}
        />
      )}

      {exploreStyle === 'normal' && (
          <div className="relative group/row mt-0">
          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => scrollRow('left')}
            className="flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-[#136b8a] transition-all cursor-pointer opacity-0 group-hover/row:opacity-100 disabled:opacity-0 hidden md:flex hover:bg-gray-50 hover:scale-105"
            aria-label="Scroll left"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          
          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => scrollRow('right')}
            className="flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-[#136b8a] transition-all cursor-pointer opacity-0 group-hover/row:opacity-100 disabled:opacity-0 hidden md:flex hover:bg-gray-50 hover:scale-105"
            aria-label="Scroll right"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>

          <div ref={rowRef} className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            {mappedPackages.map(pkg => (
              <PackageCard 
                key={pkg.id}
                destination={pkg.destination} 
                state={pkg.state}  
                className="w-[85vw] sm:w-[280px] md:w-[320px] h-[360px] md:h-[400px] snap-center shrink-0"
                tripTitle={pkg.title}
                price={pkg.price}
                duration={pkg.duration}
                description={pkg.description}
                bg={pkg.bg}
                link={pkg.link}
                bestSeller={pkg.bestSeller}
                listingCategories={pkg.listingCategories}
                isUpcoming={pkg.isUpcoming}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendedExtraPackages;
