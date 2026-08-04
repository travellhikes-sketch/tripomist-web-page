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
import ReviewsSection from '../components/ReviewsSection'
import BenefitsSection from '../components/BenefitsSection'
import StatsStrip from '../components/StatsStrip'
import TestimonialsSection from '../components/TestimonialsSection'

function Home() {
  const [dynamicPackageSections, setDynamicPackageSections] = useState([]);

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
        <section key={sec.id} className="w-full py-6 px-4 md:px-12 lg:px-20 bg-surface-container-lowest">
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
        <section key={sec.id} className="w-full py-6 px-4 md:px-12 lg:px-20 bg-surface-container-lowest">
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

    return (
      <section key={sec.id} className="w-full py-6 px-4 md:px-12 lg:px-20 bg-surface-container-lowest overflow-hidden border-t border-gray-50">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4 text-[#136b8a]">
              <span className="material-symbols-outlined text-[16px]">{sec.icon || 'inventory_2'}</span>
              <span className="font-label-caps text-label-caps tracking-widest uppercase font-bold">{sec.subtitle || 'Category'}</span>
            </div>
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
        ) : (
          <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            {sec.packagesData.slice(0, sec.max_cards || 10).map((pkg) => (
              <PackageCard destination={pkg.destination} state={pkg.state}
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
                primaryBadgeText={pkg.primary_badge_text}
                secondaryBadgeText={pkg.secondary_badge_text}
                showPrimaryBadge={pkg.show_primary_badge}
                showSecondaryBadge={pkg.show_secondary_badge}
                isClickable={pkg.is_clickable ?? true}
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
        <div className="px-2 md:px-6 lg:px-8 pt-6">
          <section className="relative w-full min-h-[500px] md:min-h-[585px] flex flex-col justify-end pt-24 pb-8 rounded-[28px] overflow-hidden shadow-lg">
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
                    const raw = heroSettings?.heading || 'Find Yourself <br/> <span class="text-primary-container">With TripoMist</span>';
                    let parts = raw.split(/<br\s*\/?>/i);
                    if (parts.length < 2) {
                      const match = raw.match(/(.*?)<span[^>]*>(.*?)<\/span>(.*)/i);
                      if (match) {
                        parts = [match[1], match[2] + (match[3] || '')];
                      } else {
                        // Fallback split if there's no br or span but it's a long string
                        const textOnly = raw.replace(/<[^>]+>/g, '').trim();
                        const words = textOnly.split(' ');
                        const mid = Math.floor(words.length / 2) || 1;
                        parts = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
                      }
                    }

                    const cleanHtml = (str) => (str || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();
                    const line1 = cleanHtml(parts[0]) || 'Find Yourself';
                    const line2 = cleanHtml(parts.slice(1).join(' ')) || 'With TripoMist';

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
                  dangerouslySetInnerHTML={{ __html: heroSettings?.subtitle || 'Your Safe Travel Our Responsibility<span class="text-primary-container">.</span>' }}
                />
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                  <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to={heroSettings?.primary_button_route || "/all-departures"}>
                    {heroSettings?.primary_button_text || "Explore All Departures"}
                    <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
                  </Link>
                  <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to={heroSettings?.secondary_button_route || "/trips/upcoming_trips"}>
                    {heroSettings?.secondary_button_text || "See Upcoming Trips"}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
        )}

        {/* Dynamic Sections (Before Reviews) */}
        {pageLoading ? (
          <div className="flex justify-center items-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a] mb-3"></div>
            <span className="text-sm font-medium ml-3">Loading sections...</span>
          </div>
        ) : (() => {
          let benefitsRendered = false;
          return dynamicPackageSections.filter(sec => sec.display_order <= 5).map(sec => {
            const isRecommended = sec.section_key === 'recommended';
            if (isRecommended) benefitsRendered = true;
            return (
              <React.Fragment key={sec.id}>
                {renderPackageSection(sec)}
                {isRecommended && <BenefitsSection />}
              </React.Fragment>
            );
          }).concat(!benefitsRendered && dynamicPackageSections.length > 0 ? [<BenefitsSection key="fallback-benefits" />] : []);
        })()}

        {/* Stats Strip */}
        <StatsStrip />

        {/* Dynamic Reviews Section */}
        <ReviewsSection featuredOnly={true} />

        {/* Dynamic Package Sections (After Reviews/Banners) */}
        {!pageLoading && (() => {
          const afterSections = dynamicPackageSections.filter(sec => sec.display_order > 5);
          let testimonialsRendered = false;
          return (
            <>
              {afterSections.map(sec => {
                const isAbroad = sec.title?.toLowerCase().includes('soon you can plan') || sec.section_key === 'abroad';
                if (isAbroad) testimonialsRendered = true;
                return (
                  <React.Fragment key={sec.id}>
                    {renderPackageSection(sec)}
                    {isAbroad && <TestimonialsSection />}
                  </React.Fragment>
                );
              })}
              {!testimonialsRendered && <TestimonialsSection />}
            </>
          );
        })()}

      </main>

      <Footer />
    </div>
  )
}

export default Home

