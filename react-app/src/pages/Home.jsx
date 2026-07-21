import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import PackageCard from '../components/PackageCard'
import { supabase } from '../supabaseClient'
import FeaturedTripCard from '../components/FeaturedTripCard'

function Home() {
  const [recommended, setRecommended] = useState({ data: [], loading: true, error: null });
  const [bestSellers, setBestSellers] = useState({ data: [], loading: true, error: null });
  const [upcomingTrips, setUpcomingTrips] = useState({ data: [], loading: true, error: null });
  const [internationalTrips, setInternationalTrips] = useState({ data: [], loading: true, error: null });
  
  const [banners, setBanners] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [interests, setInterests] = useState([]);
  const [sections, setSections] = useState({});
  const [heroSettings, setHeroSettings] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function fetchAllData() {
      try {
        // Fetch Banners
        const { data: bData } = await supabase.from('promotional_banners').select('*').eq('is_active', true).order('display_order');
        if (bData) setBanners(bData);

        // Fetch Destinations
        const { data: dData } = await supabase.from('destinations').select('*').eq('is_active', true).order('display_order');
        if (dData) setDestinations(dData);

        // Fetch Interests
        const { data: iData } = await supabase.from('interest_categories').select('*').eq('is_active', true).order('display_order');
        if (iData) setInterests(iData);

        // Fetch Sections
        const { data: sData } = await supabase.from('homepage_sections').select('*').eq('is_active', true).order('display_order');
        if (sData) {
          const secMap = {};
          sData.forEach(s => secMap[s.section_key] = s);
          setSections(secMap);
        }

        // Fetch Hero Settings
        const { data: hData } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'hero').single();
        if (hData) {
          setHeroSettings(hData.setting_value);
        }
      } catch (err) {
        console.error("Error fetching homepage configs:", err);
      } finally {
        setPageLoading(false);
      }
    }

    async function fetchPackageSection(category, setState) {
      try {
        const { data, error } = await supabase
          .from('Pakage')
          .select('*')
          .eq('status', 'active')
          .contains('listing_categories', [category]);
          
        if (error) throw error;
        setState({ data: data || [], loading: false, error: null });
      } catch (err) {
        console.error(`Error fetching ${category}:`, err);
        setState({ data: [], loading: false, error: 'Failed to load packages.' });
      }
    }

    fetchAllData();
    fetchPackageSection('recommended', setRecommended);
    fetchPackageSection('best-seller', setBestSellers);
    fetchPackageSection('upcoming-trips', setUpcomingTrips);
    fetchPackageSection('international', setInternationalTrips);
  }, []);

  const navigate = useNavigate()
  
  const renderPackageSection = (sectionKey, defaultTitle, defaultSubtitle, defaultIcon, defaultLink, stateObj, isBestSellerFlag = false, isInternational = false) => {
    // If section is configured in DB, use its settings
    const config = sections[sectionKey];
    // If it's explicitly disabled in DB, don't render
    if (config === undefined && Object.keys(sections).length > 0 && ['recommended','best_seller','upcoming','international'].includes(sectionKey)) {
      // Meaning sections are loaded but this one isn't in active sections map
      // Actually, let's just use config if it exists, otherwise defaults (unless explicitly hidden, but we only fetched active ones).
      // Wait, if it's missing from `sections` map and `pageLoading` is false, it means it's inactive!
      if (!pageLoading && !config) return null; 
    }

    const title = config?.title || defaultTitle;
    const subtitle = config?.subtitle || defaultSubtitle;
    const icon = config?.icon || defaultIcon;
    const linkTo = config?.view_all_route || defaultLink;
    const viewAllText = config?.view_all_text || 'View All';
    const maxCards = config?.max_cards || 10;

    return (
      <section className="w-full py-6 px-4 md:px-12 lg:px-20 bg-surface-container-lowest overflow-hidden border-t border-gray-50">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4 text-[#136b8a]">
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
              <span className="font-label-caps text-label-caps tracking-widest uppercase font-bold">{subtitle}</span>
            </div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold font-headline-lg">
              {title}
            </h2>
          </div>
          <Link className="inline-flex items-center text-[#136b8a] font-button text-button hover:text-[#0f556e] font-bold transition-colors" to={linkTo}>
            {viewAllText} <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
          </Link>
        </div>

        {stateObj.loading ? (
          <div className="flex justify-center items-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a] mb-3"></div>
            <span className="text-sm font-medium ml-3">Loading {title.toLowerCase()}...</span>
          </div>
        ) : stateObj.error ? (
          <div className="flex justify-center items-center py-20 text-red-500">
            <span className="material-symbols-outlined text-[40px] mb-3 mr-3">error</span>
            <p className="text-sm font-medium">{stateObj.error}</p>
          </div>
        ) : stateObj.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="material-symbols-outlined text-[48px] mb-4 text-gray-300">inventory_2</span>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Packages Found</h3>
            <p className="text-sm text-gray-500 max-w-md text-center">
              We couldn't find any active packages for this category right now.
            </p>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            {stateObj.data.slice(0, maxCards).map((pkg) => (
              <PackageCard 
                key={pkg.id}
                bestSeller={isBestSellerFlag || pkg.best_seller}
                className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
                tripTitle={pkg.title} 
                price={pkg.price != null && pkg.price !== '' ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : isInternational ? '' : 'Price on request'} 
                duration={pkg.duration || 'Flexible'} 
                description={pkg.short_description || pkg.destination || ''}
                bg={pkg.image_url || pkg.banner_image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"}
                link={isInternational && !pkg.price ? '#' : `/itinerary/${pkg.slug}`} 
                badge={isInternational && !pkg.price ? 'Coming Soon' : ''}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="w-full flex-grow">
        {/* Hero Section */}
        {(!heroSettings || heroSettings.is_active !== false) && (
        <section className="relative w-full min-h-[921px] flex flex-col justify-end pt-32 pb-48 md:pb-margin-desktop">
          <div className="absolute inset-0 w-full h-full -z-10 bg-black">
            {(!heroSettings?.media_type || heroSettings.media_type === 'video') ? (
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                preload="auto"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center center' }}
              >
                <source src={heroSettings?.desktop_media_url || "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_032424_3c9c2a9d-807b-4482-80e6-dd6d9dfd4545.mp4"} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img 
                src={heroSettings?.desktop_media_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"} 
                alt="Hero Background" 
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center center' }}
              />
            )}
            {/* Subtle dark overlay for text readability */}
            <div 
              className="absolute inset-0 bg-black" 
              style={{ opacity: heroSettings?.overlay_opacity !== undefined ? Number(heroSettings.overlay_opacity) / 100 : 0.3 }}
            ></div>
          </div>
          
          {/* Content Wrapper */}
          <div className="w-full px-4 md:px-12 lg:px-20">
            <div className="relative z-10 max-w-3xl mb-stack-lg">
              <h1 
                className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-white mb-6 font-bold leading-tight"
                dangerouslySetInnerHTML={{ __html: heroSettings?.heading || 'Find Yourself&nbsp; <br /><span class="text-primary-container">With TripoMist</span>' }}
              />
              <p 
                className="font-body-lg text-body-lg text-white/80 max-w-2xl mb-8"
                dangerouslySetInnerHTML={{ __html: heroSettings?.subtitle || 'Your Safe Travel Our Responsibility<span class="text-primary-container">.</span>' }}
              />
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-8">
              <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to={heroSettings?.primary_button_route || "/all-departures"}>
                {heroSettings?.primary_button_text || "Explore All Departures"}
                <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
              </Link>
              <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to={heroSettings?.secondary_button_route || "/trips/upcoming-trips"}>
                {heroSettings?.secondary_button_text || "See Upcoming Trips"}
              </Link>
            </div>
          </div>
        </div>
        </section>
        )}

        {/* Explore Destinations - Circles */}
        {(!pageLoading && (!sections.destinations || sections.destinations.is_active)) && (
          <section className="w-full py-6 px-4 md:px-12 lg:px-20 bg-surface-container-lowest">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                {sections.destinations?.title || 'Destinations'}
              </h2>
            </div>
            
            <div className="flex gap-8 overflow-x-auto hide-scrollbar py-4 px-2 -mx-2">
              {destinations.slice(0, sections.destinations?.max_cards || 20).map((dest) => (
                <Link key={dest.id} to={`/destinations/${dest.slug}`} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
                  <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                    <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={dest.name} src={dest.image_url} />
                  </div>
                  <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">
                    {dest.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Destination According To Interest */}
        {(!pageLoading && (!sections.interests || sections.interests.is_active)) && (
          <section className="w-full py-6 px-4 md:px-12 lg:px-20 bg-surface-container-lowest">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                {sections.interests?.title || 'Destination According To Interest'}
              </h2>
            </div>
            
            <div className="flex gap-8 overflow-x-auto hide-scrollbar py-4 px-2 -mx-2">
              {interests.slice(0, sections.interests?.max_cards || 20).map((interest) => (
                <Link key={interest.id} to={interest.route} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
                  <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                    <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={interest.name} src={interest.image_url} />
                  </div>
                  <span className="font-button text-button text-on-surface group-hover:text-primary text-center whitespace-nowrap transition-colors">
                    {interest.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Dynamic Package Sections */}
        {renderPackageSection('recommended', 'Recommended Packages', 'Hot Selling', 'local_fire_department', '/trips/recommended', recommended)}
        {renderPackageSection('best_seller', 'Best Seller', 'Top Choice', 'award_star', '/trips/best-seller', bestSellers, true)}
        {renderPackageSection('upcoming', 'Upcoming Trips', 'Plan Ahead', 'event_upcoming', '/trips/upcoming-trips', upcomingTrips)}

        {/* Promo Autoplay Banner Slider (Autoplay every 4 seconds) */}
        {banners.length > 0 && (
          <section className="w-full py-8 px-0 overflow-hidden border-t border-gray-50 bg-surface-container-lowest">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              loop={banners.length > 1}
              slidesPerView={1.15}
              spaceBetween={0}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              coverflowEffect={{
                rotate: 0,
                stretch: -24,
                depth: 100,
                modifier: 2.5,
                slideShadows: false,
              }}
              modules={[EffectCoverflow, Autoplay]}
              className="w-full overflow-visible"
            >
              {banners.map((banner) => (
                <SwiperSlide key={banner.id} className="overflow-visible">
                  <Link to={banner.button_link || '#'} className="block relative w-full h-[220px] md:h-[280px] bg-slate-900 rounded-3xl overflow-hidden shadow-lg active:scale-[0.99] transition-transform">
                    <img 
                      src={banner.desktop_image} 
                      alt={banner.title} 
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent"></div>
                    <div className="relative z-10 text-white max-w-xl h-full flex flex-col justify-center px-6 md:px-16">
                      {banner.label && (
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest bg-amber-500 text-black px-2.5 py-1 rounded-full mb-3 self-start">
                          {banner.label}
                        </span>
                      )}
                      <h3 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight mb-2">
                        {banner.title} {banner.highlighted_text && <span className="text-yellow-400">{banner.highlighted_text}</span>}
                      </h3>
                      {(banner.subtitle || banner.price_text) && (
                        <p className="text-xs md:text-sm text-gray-300 font-semibold uppercase tracking-wider">
                          {banner.subtitle} {banner.subtitle && banner.price_text && '•'} {banner.price_text && <span className="text-emerald-400 font-extrabold text-sm md:text-lg">{banner.price_text}</span>}
                        </p>
                      )}
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* International Trips Coming Soon */}
        {renderPackageSection('international', 'Soon you can plan abroad trips with us', 'International', 'flight_takeoff', '/trips/international', internationalTrips, false, true)}

      </main>

      <Footer />
    </div>
  )
}

export default Home
