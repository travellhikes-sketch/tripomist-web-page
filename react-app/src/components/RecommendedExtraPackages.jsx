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

  if (loading || packages.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore More Trips</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {packages.map(pkg => (
          <PackageCard 
            key={pkg.id}
            destination={pkg.destination} 
            state={pkg.state}  
            className="w-full h-[360px]"
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
  );
};

export default RecommendedExtraPackages;
