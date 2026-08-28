import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PackageCard from '../components/PackageCard';
import RecommendedExtraPackages from '../components/RecommendedExtraPackages';
import { supabase } from '../supabaseClient';
import { PackageIcon, RefreshCw, AlertCircle } from 'lucide-react';


const CategoryPackages = () => {
  const { categorySlug } = useParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [pType, setPType] = useState(null);

  const [sectionData, setSectionData] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        let categoryId = null;
        let pType = null;
        let titleStr = '';

        // Check if it's a homepage section
        const { data: sData } = await supabase.from('homepage_sections').select('id, title').eq('section_key', categorySlug).single();
        if (sData) {
          categoryId = sData.id;
          pType = 'homepage_section';
          titleStr = sData.title;
        } else {
          // Check if it's an interest category
          const { data: iData } = await supabase.from('interest_categories').select('id, name').eq('slug', categorySlug).single();
          if (iData) {
            categoryId = iData.id;
            pType = 'interest';
            titleStr = iData.name;
          }
        }

        if (titleStr) {
          setSectionData({ title: titleStr });
          setCategoryId(categoryId);
          setPType(pType);
        }

        if (!categoryId) {
          // If no matching category found, set empty packages and exit
          setPackages([]);
          return;
        }

        const { data, error: fetchErr } = await supabase
          .from('package_placements')
          .select('*, Pakage!inner(*)')
          .eq('placement_type', pType)
          .eq('placement_id', categoryId)
          .eq('Pakage.status', 'active');

        if (fetchErr) throw fetchErr;
        
        // Filter duplicates
        const uniquePkgs = [];
        const seen = new Set();
        if (data) {
          data.forEach(d => {
            if (!seen.has(d.Pakage.id)) {
              seen.add(d.Pakage.id);
              uniquePkgs.push(d.Pakage);
            }
          });
        }
        
        setPackages(uniquePkgs);
      } catch (err) {
        console.error('Error fetching category packages:', err);
        setError('Failed to load packages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      fetchPackages();
    }
  }, [categorySlug]);

  const pageTitle = sectionData?.title || categorySlug?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Packages';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="w-full flex-grow pt-24 pb-12 px-4 md:px-12 lg:px-20 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              {pageTitle}
            </h1>
            <p className="text-gray-500 mt-2">Explore our collection of {pageTitle.toLowerCase()} packages.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <RefreshCw size={32} className="animate-spin mb-3 text-[#01AFD1]" />
              <span className="text-sm font-medium">Loading packages...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
              <AlertCircle size={40} className="mb-3" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <PackageIcon size={48} className="mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No Packages Found</h3>
              <p className="text-sm text-gray-500 max-w-md text-center">
                We couldn't find any active packages for this category right now. Please check back later or explore other trips.
              </p>
              <Link to="/all-departures" className="mt-6 px-6 py-2.5 bg-[#01AFD1] text-white rounded-lg font-medium hover:bg-[#0092b3] transition-colors">
                View All Departures
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {packages.map(pkg => (
                <PackageCard destination={pkg.destination} state={pkg.state}  
                  key={pkg.id}
                  className="w-full h-[360px]"
                  tripTitle={pkg.title}
                  price={pkg.price != null ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : 'Price on request'}
                  duration={pkg.duration || 'Flexible'}
                  description={pkg.short_description || pkg.destination || 'Experience an unforgettable journey.'}
                  bg={pkg.image_url || pkg.banner_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'}
                  link={`/itinerary/${pkg.slug}`}
                  bestSeller={pkg.best_seller}
                />
              ))}
            </div>
          )}

          {categoryId && pType && (
            <RecommendedExtraPackages 
              placementType={pType === 'homepage_section' ? 'recommendation_listing' : `recommendation_${pType}`} 
              placementId={categoryId} 
              excludePackageIds={packages.map(p => p.id)}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPackages;
