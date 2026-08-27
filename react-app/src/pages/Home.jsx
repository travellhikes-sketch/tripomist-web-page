import React, { useState, useRef, useEffect, useCallback } from 'react'
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
import ReviewsSection from '../components/ReviewsSection'
import PromoCarousel from '../components/PromoCarousel'
import { CoverflowCarousel } from '../components/ui/coverflow-carousel'
import SquarePackageSlider from '../components/SquarePackageSlider'
import { generateDepartureDates } from '../utils/dateUtils'
import TestimonialsSection from '../components/TestimonialsSection'
import StatsStrip from '../components/StatsStrip'

const DEFAULT_LAYOUT_ORDER = [
  'destinations',
  'interests',
  'promo_carousel',
  'recommended',
  'static_banner',
  'why_choose_us',
  'why_choose_us_carousel',
  'best_seller',
  'upcoming_trips',
  'stats_strip',
  'international',
  'testimonials'
];

const getMergedLayoutOrder = (savedOrder) => {
  if (!Array.isArray(savedOrder) || savedOrder.length === 0) {
    return DEFAULT_LAYOUT_ORDER;
  }
  const uniqueSaved = Array.from(new Set(savedOrder)).filter(key => DEFAULT_LAYOUT_ORDER.includes(key));
  const missing = DEFAULT_LAYOUT_ORDER.filter(key => !uniqueSaved.includes(key));
  return [...uniqueSaved, ...missing];
};

const isExternal = (url) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
};

function Home() {
  const [dynamicPackageSections, setDynamicPackageSections] = useState([]);

  const [banners, setBanners] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [interests, setInterests] = useState([]);
  const [sections, setSections] = useState({});
  const [heroSettings, setHeroSettings] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [layoutOrder, setLayoutOrder] = useState(DEFAULT_LAYOUT_ORDER);
  const [staticBanner, setStaticBanner] = useState(null);
  const [whyChooseUsHeading, setWhyChooseUsHeading] = useState('Why Choose Us');
  const [whyChooseUsSubheading, setWhyChooseUsSubheading] = useState("India's Fastest Growing Travel Company");

  // Refs for package row scrolling (fix #5)
  const rowRefs = useRef({});
  const getRowRef = useCallback((key) => {
    if (!rowRefs.current[key]) rowRefs.current[key] = React.createRef();
    return rowRefs.current[key];
  }, []);
  const scrollRow = useCallback((key, dir) => {
    const el = rowRefs.current[key]?.current;
    if (!el) return;
    const card = el.firstElementChild;
    const amount = card ? card.getBoundingClientRect().width + 16 : 300;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

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
          const fetchPromises = sData.map(async (sec) => {
            if (sec.section_key === 'destinations' || sec.section_key === 'interests') {
              return { ...sec, isSpecialLayout: true };
            }
            try {
              const { data, error } = await supabase
                .from('package_placements')
                .select('*, Pakage!inner(*, package_placements(placement_type, placement_slug))')
                .eq('placement_type', 'homepage_section')
                .eq('placement_id', sec.id)
                .eq('Pakage.status', 'active');

              if (error) throw error;

              // Filter out duplicates in case the unique constraint failed or data has dupes
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

              return { ...sec, packagesData: uniquePkgs, fetchError: null };
            } catch (err) {
              console.error(`Error fetching packages for section ${sec.id}:`, err);
              return { ...sec, packagesData: [], fetchError: 'Failed to load packages.' };
            }
          });

          const resolvedSections = await Promise.all(fetchPromises);
          setDynamicPackageSections(resolvedSections);
        }

        // Fetch Hero Settings
        const { data: hData } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'hero').single();
        if (hData) {
          setHeroSettings(hData.setting_value);
        }

        // Fetch Layout Order, Static Banner, and Why Choose Us heading settings
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('setting_key, setting_value');

        if (settingsData) {
          const orderItem = settingsData.find(s => s.setting_key === 'homepage_section_order');
          if (orderItem && Array.isArray(orderItem.setting_value)) {
            setLayoutOrder(getMergedLayoutOrder(orderItem.setting_value));
          }
          const bannerItem = settingsData.find(s => s.setting_key === 'homepage_static_banner');
          if (bannerItem) {
            setStaticBanner(bannerItem.setting_value);
          }
          const trustItem = settingsData.find(s => s.setting_key === 'why_choose_us_banners');
          if (trustItem && trustItem.setting_value) {
            setWhyChooseUsHeading(trustItem.setting_value.title || 'Why Choose Us');
            setWhyChooseUsSubheading(trustItem.setting_value.subtitle || "India's Fastest Growing Travel Company");
          }
        }
      } catch (err) {
        console.error("Error fetching homepage configs:", err);
      } finally {
        setPageLoading(false);
      }
    }

    fetchAllData();
  }, []);

  const navigate = useNavigate()

  const renderSpecialSection = (sec) => {
    if (sec.section_key === 'destinations') {
      return (
        <section key={sec.id} className="w-full py-6 px-4 md:px-8 lg:px-10 xl:px-12 bg-surface-container-lowest">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              {sec.title || 'Destinations'}
            </h2>
          </div>

          <div className="flex gap-8 overflow-x-auto hide-scrollbar py-4 px-2 -mx-2">
            {destinations.slice(0, sec.max_cards || 20).map((dest) => (
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
      );
    }

    if (sec.section_key === 'interests') {
      return (
        <section key={sec.id} className="w-full py-6 px-4 md:px-8 lg:px-10 xl:px-12 bg-surface-container-lowest">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              {sec.title || 'Destination According To Interest'}
            </h2>
          </div>

          <div className="flex gap-8 overflow-x-auto hide-scrollbar py-4 px-2 -mx-2">
            {interests.slice(0, sec.max_cards || 20).map((interest) => (
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
      );
    }
    return null;
  };

  const renderPackageSection = (sec) => {
    if (sec.isSpecialLayout) {
      return renderSpecialSection(sec);
    }

    const isInternational = sec.section_key === 'international';
    const isBestSellerFlag = sec.section_key === 'best_seller';
    const rowKey = sec.section_key || sec.id;
    const rowRef = getRowRef(rowKey);

    return (
      <section key={sec.id} className="w-full py-6 px-4 md:px-8 lg:px-10 xl:px-12 bg-surface-container-lowest border-t border-gray-50">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>

            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold font-headline-lg">
              {sec.title}
            </h2>
          </div>
          {sec.view_all_route && (
            <Link className="inline-flex items-center text-[#136b8a] font-button text-button hover:text-[#0f556e] font-bold transition-colors" to={sec.view_all_route}>
              {sec.view_all_text || 'View All'} <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </Link>
          )}
        </div>

        {sec.fetchError ? (
          <div className="flex justify-center items-center py-20 text-red-500">
            <span className="material-symbols-outlined text-[40px] mb-3 mr-3">error</span>
            <p className="text-sm font-medium">{sec.fetchError}</p>
          </div>
        ) : (!sec.packagesData || sec.packagesData.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="material-symbols-outlined text-[48px] mb-4 text-gray-300">inventory_2</span>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Packages Found</h3>
            <p className="text-sm text-gray-500 max-w-md text-center">
              We couldn't find any active packages for this category right now.
            </p>
          </div>
        ) : (sec.display_style || 'simple') === 'advanced' ? (
          <div className="w-full bg-surface-container-lowest max-w-[1550px] w-[94vw] mx-auto overflow-hidden">
            <CoverflowCarousel
              showCaption
              showNavigation
              showPagination
              loop
              slides={sec.packagesData.slice(0, sec.max_cards || 10).map((pkg) => ({
                src: pkg.image_url || pkg.banner_image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
                alt: pkg.title || pkg.destination || 'Package Image',
                title: pkg.title,
                subtitle: pkg.duration ? `${pkg.duration}` : 'Flexible',
                meta: [{ label: "Starting from", value: pkg.price != null && pkg.price !== '' ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : isInternational ? '' : 'Price on request' }],
                slug: pkg.slug,
                isClickable: pkg.is_clickable ?? true,
                showCta: sec.advanced_cta_enabled !== false,
                ctaText: sec.advanced_cta_text || 'View Trip'
              }))}
            />
          </div>
        ) : (sec.display_style === 'advanced_1_1') ? (
          <div className="w-full bg-surface-container-lowest max-w-[1550px] w-[94vw] mx-auto overflow-hidden">
            <SquarePackageSlider 
              packages={sec.packagesData.slice(0, sec.max_cards || 10)}
              showCta={sec.advanced_cta_enabled !== false}
              ctaText={sec.advanced_cta_text || 'View Trip'}
            />
          </div>
        ) : (
          <div className="relative group/row max-w-[1550px] w-[94vw] mx-auto">
            {/* Left Arrow */}
            <button
              type="button"
              onClick={() => scrollRow(rowKey, 'left')}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#136b8a] border border-gray-100 flex items-center justify-center transition-colors shadow-sm cursor-pointer opacity-0 group-hover/row:opacity-100 disabled:opacity-0 hidden md:flex"
              aria-label="Scroll left"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            {/* Right Arrow */}
            <button
              type="button"
              onClick={() => scrollRow(rowKey, 'right')}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#136b8a] border border-gray-100 flex items-center justify-center transition-colors shadow-sm cursor-pointer opacity-0 group-hover/row:opacity-100 disabled:opacity-0 hidden md:flex"
              aria-label="Scroll right"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>

            <div ref={rowRef} className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory scroll-smooth">
              {sec.packagesData.slice(0, sec.max_cards || 10).map((pkg) => (
                <PackageCard destination={pkg.destination} state={pkg.state}
                  key={pkg.id}
                  listingCategories={pkg.listing_categories}
                  bestSeller={isBestSellerFlag || pkg.best_seller}
                  className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-start shrink-0"
                  tripTitle={pkg.title}
                  price={pkg.price != null && pkg.price !== '' ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : isInternational ? '' : 'Price on request'}
                  duration={pkg.duration || 'Flexible'}
                  description={pkg.short_description || pkg.destination || ''}
                  bg={pkg.image_url || pkg.banner_image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"}
                  link={isInternational && !pkg.price ? '#' : `/itinerary/${pkg.slug}`}
                  badge={isInternational && !pkg.price ? 'Coming Soon' : ''}
                  primaryBadgeText={pkg.primary_badge_text}
                  secondaryBadgeText={pkg.secondary_badge_text}
                  showPrimaryBadge={pkg.show_primary_badge}
                  showSecondaryBadge={pkg.show_secondary_badge}
                  isClickable={pkg.is_clickable ?? true}
                  departureDates={generateDepartureDates(pkg.available_weekdays, pkg.departure_dates)}
                />
              ))}
            </div>
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
        <div className="px-2 md:px-6 lg:px-8 pt-6">
          <section className="relative w-full min-h-[300px] md:min-h-[585px] flex flex-col justify-end pt-24 pb-8 rounded-[28px] overflow-hidden shadow-lg">
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
            <div className="w-full px-6 md:px-12 lg:px-16">
              <div className="relative z-10 max-w-3xl mb-8">
                <div className="mb-6 font-bold leading-tight">
                  {(() => {
                    const line1 = heroSettings?.heading_line1 || 'Find Yourself';
                    const line2 = heroSettings?.heading_line2 || 'With TripoMist';

                    return (
                      <>
                        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-white block">
                          {line1}
                        </h1>
                        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary-container block">
                          {line2}
                        </h1>
                      </>
                    );
                  })()}
                </div>
                <p
                  className="font-body-lg text-body-lg text-white/80 max-w-2xl mb-8"
                >
                  {heroSettings?.subtitle || 'Your Safe Travel Our Responsibility.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                  {heroSettings?.show_primary_cta !== false && (
                    <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to={heroSettings?.primary_cta_route || "/all-departures"}>
                      {heroSettings?.primary_cta_text || "Explore All Departures"}
                      <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
                    </Link>
                  )}
                  {heroSettings?.show_secondary_cta !== false && (
                    <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to={heroSettings?.secondary_cta_route || "/trips/upcoming_trips"}>
                      {heroSettings?.secondary_cta_text || "See Upcoming Trips"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
        )}

        {/* Dynamic Sections */}
        {pageLoading ? (
          <div className="flex justify-center items-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a] mb-3"></div>
            <span className="text-sm font-medium ml-3">Loading sections...</span>
          </div>
        ) : (() => {
          const sectionRenderers = {
            destinations: (() => {
              const sec = dynamicPackageSections.find((s) => s.section_key === 'destinations');
              return sec ? <React.Fragment key={sec.id}>{renderPackageSection(sec)}</React.Fragment> : null;
            })(),
            interests: (() => {
              const sec = dynamicPackageSections.find((s) => s.section_key === 'interests');
              return sec ? <React.Fragment key={sec.id}>{renderPackageSection(sec)}</React.Fragment> : null;
            })(),
            promo_carousel: <PromoCarousel key="large-promo-carousel" settingKey="homepage_promo_banners" size="large" />,
            recommended: (() => {
              const sec = dynamicPackageSections.find((s) => s.section_key === 'recommended');
              return sec ? <React.Fragment key={sec.id}>{renderPackageSection(sec)}</React.Fragment> : null;
            })(),
            static_banner: (() => {
              if (!staticBanner || !staticBanner.active || !staticBanner.image) return null;
              const isExt = isExternal(staticBanner.cta_link);
              const content = (
                <div className="relative flex items-center overflow-hidden w-full bg-gradient-to-r from-teal-800 to-slate-900 h-[80px] sm:h-[100px] md:h-[120px] lg:h-[140px] rounded-lg border border-gray-100/50 shadow-none">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${staticBanner.image}')` }}
                  />
                  
                  <div className="relative z-10 flex flex-col justify-center px-8 sm:px-16 md:px-20 lg:px-24 py-6 max-w-3xl text-left select-none animate-in fade-in duration-700">
                    {staticBanner.title && (
                      <h3 className="text-white font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight mb-2 drop-shadow-sm">
                        {staticBanner.title}
                      </h3>
                    )}
                    {staticBanner.subtitle && (
                      <p className="text-white/90 text-xs sm:text-sm md:text-base leading-relaxed mb-4 max-w-lg">
                        {staticBanner.subtitle}
                      </p>
                    )}
                    {staticBanner.cta_text && staticBanner.clickable && (
                      <span className="inline-flex items-center gap-1.5 bg-white text-[#136b8a] font-bold text-[10px] md:text-xs px-3.5 py-1.5 md:px-4.5 md:py-2 rounded-full w-fit shadow-sm">
                        {staticBanner.cta_text}
                        <span className="material-symbols-outlined text-[13px] md:text-[15px]">arrow_outward</span>
                      </span>
                    )}
                  </div>
                </div>
              );

              return (
                <div key="static-banner-container" className="relative max-w-[1550px] w-[94vw] mx-auto my-6 md:my-8 px-0">
                  {staticBanner.clickable && staticBanner.cta_link ? (
                    isExt ? (
                      <a href={staticBanner.cta_link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                        {content}
                      </a>
                    ) : (
                      <Link to={staticBanner.cta_link} className="block w-full h-full">
                        {content}
                      </Link>
                    )
                  ) : (
                    <div className="w-full h-full">
                      {content}
                    </div>
                  )}
                </div>
              );
            })(),
            why_choose_us: (
              <div key="why-choose-us-heading" className="text-center mt-10 mb-4 px-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-550">
                  {whyChooseUsHeading}
                </h2>
                {whyChooseUsSubheading && (
                  <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-xl mx-auto font-medium">
                    {whyChooseUsSubheading}
                  </p>
                )}
              </div>
            ),
            why_choose_us_carousel: <PromoCarousel key="small-promo-carousel" settingKey="why_choose_us_banners" size="small" showTitle={false} />,
            best_seller: (() => {
              const sec = dynamicPackageSections.find((s) => s.section_key === 'best_seller');
              return sec ? <React.Fragment key={sec.id}>{renderPackageSection(sec)}</React.Fragment> : null;
            })(),
            upcoming_trips: (() => {
              const sec = dynamicPackageSections.find((s) => s.section_key === 'upcoming_trips');
              return sec ? <React.Fragment key={sec.id}>{renderPackageSection(sec)}</React.Fragment> : null;
            })(),
            stats_strip: <StatsStrip key="stats-strip" />,
            international: (() => {
              const sec = dynamicPackageSections.find((s) => s.section_key === 'international');
              return sec ? <React.Fragment key={sec.id}>{renderPackageSection(sec)}</React.Fragment> : null;
            })(),
            testimonials: <TestimonialsSection key="testimonials-section" />
          };

          return layoutOrder.map((key) => {
            if (sectionRenderers[key] !== undefined) {
              return sectionRenderers[key];
            }
            // Fallback for custom dynamic database sections
            const sec = dynamicPackageSections.find((s) => s.section_key === key);
            if (sec) {
              return (
                <React.Fragment key={sec.id}>
                  {renderPackageSection(sec)}
                </React.Fragment>
              );
            }
            return null;
          });
        })()
        }
      </main>

      <Footer />
    </div>
  )
}

export default Home

