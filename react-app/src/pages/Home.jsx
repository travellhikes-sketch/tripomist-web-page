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
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBestSellers() {
      const { data, error } = await supabase
        .from('Pakage')
        .select('*')
        .eq('best_seller', true)
        .ilike('status', '%active%');
        
      if (!error && data) {
        setBestSellers(data);
      }
      setLoading(false);
    }
    fetchBestSellers();
  }, []);

  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [isFabOpen, setIsFabOpen] = useState(false)
  
  const scrollRef = useRef(null)

  // Auto-scroll removed as requested
  useEffect(() => {}, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="w-full flex-grow">
        {/* Hero Section */}
        <section className="relative w-full min-h-[921px] flex flex-col justify-end pt-32 pb-48 md:pb-margin-desktop">
          <div className="absolute inset-0 w-full h-full -z-10 bg-black">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              preload="auto"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center center' }}
            >
              <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_032424_3c9c2a9d-807b-4482-80e6-dd6d9dfd4545.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Subtle dark overlay (20-30%) for text readability */}
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
          
          {/* Content Wrapper */}
          <div className="w-full px-4 md:px-12 lg:px-20">
            <div className="relative z-10 max-w-3xl mb-stack-lg">
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-white mb-6 font-bold leading-tight">
              Find Yourself&nbsp; <br /><span className="text-primary-container">With TripoMist</span>
            </h1>
            <p className="font-body-lg text-body-lg text-white/80 max-w-2xl mb-8">
              Your Safe Travel Our Responsibility<span className="text-primary-container">.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-8">
              <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to="/all-departures">
                Explore All Departures
                <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
              </Link>
              <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to="/upcoming-departures">
                See Upcoming Trips
              </Link>
            </div>
            

          </div>
        </div>
        </section>

        {/* Explore Destinations - Circles */}
        <section className="w-full py-6 px-4 md:px-12 lg:px-20 bg-surface-container-lowest">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Destinations</h2>
          </div>
          
          <div className="flex gap-8 overflow-x-auto hide-scrollbar py-4 px-2 -mx-2">
            <Link to="/ladakh" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Ladakh" src="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?q=80&w=600&auto=format&fit=crop" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Ladakh</span>
            </Link>
            <Link to="/kashmir" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Kashmir" src="https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Kashmir</span>
            </Link>
            <Link to="/spiti" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Spiti Valley" src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center max-w-[100px] leading-tight transition-colors">Spiti Valley</span>
            </Link>
            <Link to="/uttarakhand" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Uttarakhand" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center max-w-[100px] leading-tight transition-colors">Uttarakhand</span>
            </Link>
            <Link to="/himachal" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Himachal Pradesh" src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Himachal</span>
            </Link>
            <Link to="/rajasthan" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Rajasthan" src="https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Rajasthan</span>
            </Link>
            <Link to="/kerala" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Kerala" src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Kerala</span>
            </Link>
            <Link to="/meghalaya" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Meghalaya" src="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Meghalaya</span>
            </Link>
            <Link to="/goa" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Goa" src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Goa</span>
            </Link>
          </div>
          </section>

        {/* Destination According To Interest */}
        <section className="w-full py-6 px-4 md:px-12 lg:px-20 bg-surface-container-lowest">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Destination According To Interest</h2>
          </div>
          
          <div className="flex gap-8 overflow-x-auto hide-scrollbar py-4 px-2 -mx-2">
            <Link to="/treks" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Only Trek" src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=600&auto=format&fit=crop" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center whitespace-nowrap transition-colors">Only Trek</span>
            </Link>
            <Link to="/group-trips" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Group Departures" src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center whitespace-nowrap transition-colors">Group Departures</span>
            </Link>
            <Link to="/weekend-trips" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Weekend Departures" src="https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=600&auto=format&fit=crop" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center whitespace-nowrap transition-colors">Weekend Departures</span>
            </Link>
            <Link to="/family-tours" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Family Destination" src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center whitespace-nowrap transition-colors">Family Destination</span>
            </Link>
            <Link to="/honeymoon-trips" className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle no-underline">
              <div className="w-32 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Honeymoon Trips" src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center whitespace-nowrap transition-colors">Honeymoon Trips</span>
            </Link>
          </div>
        </section>

        {/* Recommended Packages Section */}
        <section className="w-full py-6 px-4 md:px-12 lg:px-20 bg-surface-container-lowest overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-[#136b8a]">
                <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                <span className="font-label-caps text-label-caps tracking-widest uppercase font-bold">Hot Selling</span>
              </div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold font-headline-lg">
                Recommended Packages
              </h2>
            </div>
            <Link className="inline-flex items-center text-[#136b8a] font-button text-button hover:text-[#0f556e] font-bold transition-colors" to="/all-departures">
              View All Packages <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div ref={scrollRef} className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            <PackageCard bestSeller={true} className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Ladakh" 
              price="₹21,999" 
              duration="6N/7D" 
              description="Experience the raw beauty of Leh, Nubra Valley, and Pangong Tso with a close-knit group of adventurers."
              bg="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1600&q=80"
              link="/itinerary/Ladakh" 
            />
            <PackageCard bestSeller={true} className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Spiti Valley" 
              price="₹16,999" 
              duration="5N/6D" 
              description="Brave the frozen landscapes of the middle land. A curated winter adventure for the bold."
              bg="https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1600&q=80"
              link="/itinerary/Spiti Valley" 
            />
            <PackageCard bestSeller={true} className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Kashmir" 
              price="₹17,999" 
              duration="4N/5D" 
              description="Explore Srinagar, Gulmarg, and Pahalgam. A perfect mix of leisure and breathtaking vistas."
              bg="https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&q=80"
              link="/itinerary/Kashmir" 
            />
            <PackageCard bestSeller={true} className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Andaman Retreat" 
              price="₹25,999" 
              duration="5N/6D" 
              description="Relax on the pristine beaches of Havelock and Neil Islands with amazing scuba diving opportunities."
              bg="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1600&q=80"
              link="/itinerary/andaman-retreat" 
            />
            <PackageCard bestSeller={true} className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Meghalaya Expedition" 
              price="₹18,999" 
              duration="6N/7D" 
              description="Journey through the abode of clouds, explore living root bridges and crystal clear rivers."
              bg="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1600&q=80"
              link="/itinerary/meghalaya-expedition" 
            />
            <PackageCard bestSeller={true} className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Manali Kasol" 
              price="₹10,999" 
              duration="4N/5D" 
              description="Experience the vibrant cafes of Kasol and the snow-capped peaks of Manali in one epic trip."
              bg="https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1600&q=80"
              link="/itinerary/manali-kasol" 
            />
            <PackageCard bestSeller={true} className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Jibhi Tirthan" 
              price="₹9,999" 
              duration="3N/4D" 
              description="Unwind in the pristine hidden valleys of Jibhi and Tirthan, surrounded by lush green forests."
              bg="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=80"
              link="/itinerary/jibhi" 
            />
            <PackageCard bestSeller={true} className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Chopta Tungnath" 
              price="₹11,999" 
              duration="4N/5D" 
              description="Trek through the mini Switzerland of India and visit the highest Shiva temple in the world."
              bg="https://images.unsplash.com/photo-1610212594957-c5332fc39634?w=1600&q=80"
              link="/itinerary/chopta" 
            />
            <PackageCard bestSeller={true} className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Kedarnath" 
              price="₹14,999" 
              duration="5N/6D" 
              description="Embark on a spiritual journey to the majestic Kedarnath temple amidst the Garhwal Himalayas."
              bg="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600&q=80"
              link="/itinerary/kedarnath" 
            />
            <PackageCard bestSeller={true} className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Madhyameshwar" 
              price="₹12,999" 
              duration="4N/5D" 
              description="Discover the serene beauty and spiritual aura of the mystical Madhyameshwar temple trek."
              bg="https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?w=1600&q=80"
              link="/itinerary/madhyameshwar" 
            />
          </div>
        </section>

        {/* Best Seller Section */}
        {bestSellers.length > 0 && (
          <section className="w-full py-6 px-4 md:px-12 lg:px-20 bg-surface-container-lowest overflow-hidden border-t border-gray-50">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <div>
                <div className="inline-flex items-center gap-2 mb-4 text-[#136b8a]">
                  <span className="material-symbols-outlined text-[16px]">award_star</span>
                  <span className="font-label-caps text-label-caps tracking-widest uppercase font-bold">Top Choice</span>
                </div>
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold font-headline-lg">
                  Best Seller
                </h2>
              </div>
              <Link className="inline-flex items-center text-[#136b8a] font-button text-button hover:text-[#0f556e] font-bold transition-colors" to="/all-departures">
                View All Sellers <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
              {bestSellers.map((pkg) => (
                <PackageCard 
                  key={pkg.id}
                  bestSeller={true}
                  className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
                  tripTitle={pkg.package_title} 
                  price={`₹${Number(pkg.price || 0).toLocaleString('en-IN')}`} 
                  duration={pkg.duration || '5N/6D'} 
                  description={pkg.description || ''}
                  bg={pkg.image_url || pkg.banner_image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"}
                  link={`/itinerary/${pkg.id}`} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Promo Autoplay Banner Slider (Autoplay every 4 seconds) */}
        <section className="w-full py-8 px-0 overflow-hidden border-t border-gray-50 bg-surface-container-lowest">
          <Swiper
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            loop={true}
            slidesPerView={1.15}
            spaceBetween={0}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
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
            <SwiperSlide className="overflow-visible">
              <Link to="/itinerary/Spiti Valley" className="block relative w-full h-[220px] md:h-[280px] bg-slate-900 rounded-3xl overflow-hidden shadow-lg active:scale-[0.99] transition-transform">
                <img 
                  src="https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1200&q=80" 
                  alt="Chandrataal" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent"></div>
                <div className="relative z-10 text-white max-w-xl h-full flex flex-col justify-center px-6 md:px-16">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest bg-amber-500 text-black px-2.5 py-1 rounded-full mb-3 self-start">Special Summer Offer</span>
                  <h3 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight mb-2">BURNT OUT? <span className="text-yellow-400">ESCAPE TO CHANDRATAAL</span></h3>
                  <p className="text-xs md:text-sm text-gray-300 font-semibold uppercase tracking-wider">THIS SUMMER • Trips starting at <span className="text-emerald-400 font-extrabold text-sm md:text-lg">Rs 17,999</span></p>
                </div>
              </Link>
            </SwiperSlide>
            <SwiperSlide className="overflow-visible">
              <Link to="/itinerary/Spiti Valley" className="block relative w-full h-[220px] md:h-[280px] bg-slate-900 rounded-3xl overflow-hidden shadow-lg active:scale-[0.99] transition-transform">
                <img 
                  src="https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1200&q=80" 
                  alt="Spiti Valley" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent"></div>
                <div className="relative z-10 text-white max-w-xl h-full flex flex-col justify-center px-6 md:px-16">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest bg-[#136b8a] text-white px-2.5 py-1 rounded-full mb-3 self-start">Best Seller</span>
                  <h3 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight mb-2">EXPLORE THE MIDDLE LAND: <span className="text-cyan-400">SPITI VALLEY</span></h3>
                  <p className="text-xs md:text-sm text-gray-300 font-semibold uppercase tracking-wider">WINTER EXPEDITION • starting at <span className="text-emerald-400 font-extrabold text-sm md:text-lg">Rs 16,999</span></p>
                </div>
              </Link>
            </SwiperSlide>
            <SwiperSlide className="overflow-visible">
              <Link to="/itinerary/Ladakh" className="block relative w-full h-[220px] md:h-[280px] bg-slate-900 rounded-3xl overflow-hidden shadow-lg active:scale-[0.99] transition-transform">
                <img 
                  src="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1200&q=80" 
                  alt="Ladakh" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent"></div>
                <div className="relative z-10 text-white max-w-xl h-full flex flex-col justify-center px-6 md:px-16">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest bg-emerald-500 text-black px-2.5 py-1 rounded-full mb-3 self-start">Adventure Guide</span>
                  <h3 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight mb-2">LADAKH: <span className="text-emerald-300">LAND OF HIGH PASSES</span></h3>
                  <p className="text-xs md:text-sm text-gray-300 font-semibold uppercase tracking-wider">ROAD TRIP OF A LIFETIME • starting at <span className="text-emerald-400 font-extrabold text-sm md:text-lg">Rs 21,999</span></p>
                </div>
              </Link>
            </SwiperSlide>
          </Swiper>
        </section>

        {/* International Trips Coming Soon */}
        <section className="w-full py-6 px-4 md:px-12 lg:px-20 border-t border-gray-100 bg-surface-container-lowest overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-[#136b8a]">
                <span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
                <span className="font-label-caps text-label-caps tracking-widest uppercase font-bold">International</span>
              </div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold font-headline-lg">
                Soon you can plan abroad trips with us
              </h2>
            </div>
            <Link className="inline-flex items-center text-[#136b8a] font-button text-button hover:text-[#0f556e] font-bold transition-colors" to="/international">
              View All Destinations <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Almaty" 
              price="" 
              duration="5N/6D" 
              description="Experience the magic of Central Asia."
              bg="https://images.unsplash.com/photo-1558588825-450f38b1d9df?w=800&q=80"
              link="#" 
              badge="Coming Soon"
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Kazakhstan" 
              price="" 
              duration="5N/6D" 
              description="Discover beautiful landscapes and culture."
              bg="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=80"
              link="#" 
              badge="Coming Soon"
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Thailand" 
              price="" 
              duration="6N/7D" 
              description="Explore vibrant beaches and culture."
              bg="https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80"
              link="#" 
              badge="Coming Soon"
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Bali" 
              price="" 
              duration="6N/7D" 
              description="Relax on pristine tropical beaches."
              bg="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80"
              link="#" 
              badge="Coming Soon"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home
