import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import PackageCard from '../components/PackageCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function PromoPage() {
  const { slug } = useParams();
  const [promo, setPromo] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    const fetchPromoData = async () => {
      setLoading(true);
      try {
        // Fetch promo
        const { data: promoData, error: promoError } = await supabase
          .from('promotional_banners')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (promoError || !promoData) {
          setPromo(null);
          return;
        }
        setPromo(promoData);

        // Fetch packages
        const { data: placements, error: placeErr } = await supabase
          .from('package_placements')
          .select('package_id')
          .eq('placement_type', 'promo_strip')
          .eq('placement_id', promoData.id);

        if (placements && placements.length > 0) {
          const packageIds = placements.map(p => p.package_id);
          const { data: pkgData, error: pkgErr } = await supabase
            .from('Pakage')
            .select('*')
            .in('id', packageIds)
            .eq('status', 'active');
          
          if (pkgData) {
            setPackages(pkgData);
          }
        } else {
          setPackages([]);
        }
      } catch (error) {
        console.error('Error fetching promo page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromoData();
  }, [slug]);

  useEffect(() => {
    if (promo) {
      document.title = `${promo.page_title || promo.title || promo.internal_name} - TripoMist`;
    }
  }, [promo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Promo Not Found</h1>
        <p className="text-gray-600 mb-8">The promotion you are looking for does not exist or has expired.</p>
        <Link to="/" className="bg-[#136b8a] text-white px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow pb-20">
        {/* Hero Section */}
      {(promo.desktop_image || promo.mobile_image) && (
        <div className="relative w-full h-[40vh] md:h-[50vh] lg:h-[60vh] overflow-hidden">
          <picture>
            {promo.mobile_image && <source media="(max-width: 768px)" srcSet={promo.mobile_image} />}
            <img 
              src={promo.desktop_image || promo.mobile_image} 
              alt={promo.page_title || promo.title} 
              className="w-full h-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center uppercase tracking-wide">
              {promo.page_title || promo.title}
            </h1>
            {(promo.page_subtitle || promo.subtitle) && (
              <p className="text-white/90 text-lg md:text-xl mt-4 text-center max-w-2xl">
                {promo.page_subtitle || promo.subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Title if no Hero */}
      {!(promo.desktop_image || promo.mobile_image) && (
        <div className="bg-[#136b8a] py-12 md:py-20 text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-wide">
            {promo.page_title || promo.title}
          </h1>
          {(promo.page_subtitle || promo.subtitle) && (
            <p className="text-white/90 text-lg mt-4 max-w-2xl mx-auto">
              {promo.page_subtitle || promo.subtitle}
            </p>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        {/* About Section */}
        {(promo.content || promo.full_description) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Promotion</h2>
            <div className="text-gray-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
              {showFullDesc ? (promo.content || promo.full_description) : (promo.content || promo.full_description).slice(0, 300) + ((promo.content || promo.full_description).length > 300 ? '...' : '')}
            </div>
            {(promo.content || promo.full_description).length > 300 && (
              <button 
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-3 text-[#136b8a] font-semibold hover:underline"
              >
                {showFullDesc ? 'Read Less' : 'Read More'}
              </button>
            )}
            
            {promo.cta_link && (
               <div className="mt-8">
                 <a href={promo.cta_link} className="inline-block bg-[#136b8a] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#0f556e] transition shadow-md">
                   {promo.cta_text || 'View Offer'}
                 </a>
               </div>
            )}
          </div>
        )}

        {/* Packages Grid */}
        {packages.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Eligible Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {packages.map(pkg => (
                <PackageCard destination={pkg.destination} state={pkg.state}  key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-lg">No packages currently available for this promotion.</p>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
}

export default PromoPage;
