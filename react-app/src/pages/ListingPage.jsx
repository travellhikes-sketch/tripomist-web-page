import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PackageCard from '../components/PackageCard'
import RecommendedExtraPackages from '../components/RecommendedExtraPackages'
import { supabase } from '../supabaseClient'
import { PackageIcon, RefreshCw, AlertCircle, Volume2, VolumeX } from 'lucide-react'

export default function ListingPage() {
  const location = useLocation()
  const path = location.pathname

  const [pageData, setPageData] = useState(null)
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isAboutExpanded, setIsAboutExpanded] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        let foundPage = null;
        let pkgs = [];

        // 1. Check Homepage Sections by view_all_route
        const { data: secData } = await supabase.from('homepage_sections').select('*').eq('view_all_route', path).single();
        if (secData) {
          foundPage = {
            title: secData.title,
            subtitle: secData.subtitle || "",
            hero: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
            type: 'homepage_section',
            id: secData.id
          };
        }

        // 2. Check Interest Categories by route
        if (!foundPage) {
          const { data: intData } = await supabase.from('interest_categories').select('*').eq('route', path).single();
          if (intData) {
            foundPage = {
              title: intData.name,
              subtitle: "",
              hero: intData.hero_banner_url || intData.image_url || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
              mediaType: intData.hero_media_type || 'image',
              description: intData.description || '',
              type: 'interest',
              id: intData.id
            };
          }
        }

        // 3. Check Destinations by slug
        if (!foundPage) {
          let destSlug = null;
          if (path.startsWith('/destinations/')) {
            destSlug = path.split('/destinations/')[1];
          } else {
            destSlug = path.split('/')[1]; 
          }
          if (destSlug) {
            const { data: destData } = await supabase.from('destinations').select('*').eq('slug', destSlug).single();
            if (destData) {
              foundPage = {
                title: destData.name,
                subtitle: destData.region || "",
                hero: destData.hero_banner_url || destData.image_url || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
                mediaType: destData.hero_media_type || 'image',
                description: destData.description || '',
                type: 'destination',
                id: destData.id
              };
            }
          }
        }

        // Fallback for hardcoded standard routes like /all-departures
        if (!foundPage) {
          if (path === '/all-departures') {
            foundPage = { title: "All Departures", subtitle: "Explore all our trips", hero: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", type: 'all' };
          } else if (path === '/international') {
            foundPage = { title: "International Tour Packages", subtitle: "Soon you can plan abroad trips with us", hero: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", type: 'all' };
          } else {
             // Basic fallback matching the slug
             const titleParts = path.split('/').pop().split('-');
             const titleStr = titleParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
             foundPage = { title: titleStr || "Packages", subtitle: "", hero: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", type: 'all' };
          }
        }

        setPageData(foundPage);
        if (foundPage.title) {
          document.title = `${foundPage.title} - TripoMist`;
        }

        // Fetch Packages
        if (foundPage.type === 'all') {
           const { data, error: pkgsErr } = await supabase.from('Pakage').select('*, package_placements(placement_type, placement_slug)').eq('status', 'active');
           if (pkgsErr) throw pkgsErr;
           pkgs = data || [];
        } else {
           const { data, error: fetchErr } = await supabase
            .from('package_placements')
            .select('*, Pakage!inner(*, package_placements(placement_type, placement_slug))')
            .eq('placement_id', foundPage.id)
            .eq('placement_type', foundPage.type)
            .eq('Pakage.status', 'active');
            
           if (fetchErr) throw fetchErr;
           
           if (data) {
             const uniquePkgs = [];
             const seen = new Set();
             data.forEach(d => {
               if (!seen.has(d.Pakage.id)) {
                 seen.add(d.Pakage.id);
                 uniquePkgs.push(d.Pakage);
               }
             });
             pkgs = uniquePkgs;
           }
        }
        setPackages(pkgs);

      } catch (err) {
        console.error('Error fetching listing page data:', err);
        setError('Failed to load packages. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [path]);

  const isVideo = pageData?.mediaType === 'video' || pageData?.hero?.toLowerCase().endsWith('.mp4');

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Banner Section */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden bg-black">
        {pageData && (
          <>
            {isVideo ? (
              <>
                <video
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src={pageData.hero} type="video/mp4" />
                </video>
                {/* Mute toggle button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-6 right-6 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all cursor-pointer"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </>
            ) : (
              <img
                src={pageData.hero}
                alt={pageData.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
              <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight drop-shadow-md">
                {pageData.title}
              </h1>
            </div>
          </>
        )}
      </section>

      {/* Content Heading & About Section */}
      {pageData && (pageData.subtitle || pageData.description) && (
        <section className="w-full max-w-7xl mx-auto px-4 pt-12">
          {pageData.subtitle && (
            <h2 className="text-2xl md:text-3xl text-gray-800 font-bold text-center mb-6">
              {pageData.subtitle}
            </h2>
          )}
          
          {pageData.description && (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 text-left mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-sans tracking-tight">About {pageData.title}</h2>
              <div 
                className={`text-gray-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap transition-[max-height] duration-500 ease-in-out overflow-hidden relative ${isAboutExpanded ? 'max-h-[3000px]' : 'max-h-[5.5rem] md:max-h-[6.5rem]'}`}
              >
                {pageData.description}
                {!isAboutExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
              </div>
              <button 
                onClick={() => setIsAboutExpanded(!isAboutExpanded)} 
                className="mt-4 text-[#136b8a] font-bold hover:underline text-sm md:text-base cursor-pointer"
              >
                {isAboutExpanded ? 'Read Less' : 'Read More'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Grid Section */}
      <main className="max-w-7xl mx-auto px-4 pt-10 pb-36 w-full flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw size={32} className="animate-spin mb-3 text-[#136b8a]" />
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
              We couldn't find any active packages right now. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {packages.map(pkg => (
              <PackageCard destination={pkg.destination} state={pkg.state}  
                key={pkg.id} 
                tripTitle={pkg.title} 
                price={pkg.price != null && pkg.price !== '' ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : 'Price on request'}
                duration={pkg.duration || 'Flexible'}
                description={pkg.short_description || pkg.destination || ''}
                bg={pkg.image_url || pkg.banner_image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"}
                link={`/itinerary/${pkg.slug}`}
                bestSeller={pkg.best_seller}
                primaryBadgeText={pkg.primary_badge_text}
                secondaryBadgeText={pkg.secondary_badge_text}
                showPrimaryBadge={pkg.show_primary_badge}
                showSecondaryBadge={pkg.show_secondary_badge}
                isClickable={pkg.is_clickable ?? true}
                className="w-full h-[360px]"
              />
            ))}
          </div>
        )}

        {pageData && pageData.type !== 'all' && pageData.id && (
          <RecommendedExtraPackages
            placementType={pageData.type === 'homepage_section' ? 'recommendation_listing' : `recommendation_${pageData.type}`}
            placementId={pageData.id}
            excludePackageIds={packages.map(p => p.id)}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}

