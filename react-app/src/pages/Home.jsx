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
import FeaturedTripCard from '../components/FeaturedTripCard'

function Home() {
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
        <section className="w-full py-12 px-4 md:px-12 lg:px-20 bg-surface-container-lowest">
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

        {/* Camera Roll Destinations */}
        <section className="w-full py-24 px-4 md:px-12 lg:px-20 bg-surface-container-lowest overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-[#136b8a]">
                <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                <span className="font-label-caps text-label-caps tracking-widest uppercase font-bold">Hot Selling</span>
              </div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
              Most Popular Packages
            </h2>
            </div>
            <Link className="inline-flex items-center text-[#136b8a] font-button text-button hover:text-[#0f556e] font-bold transition-colors" to="/most-popular-packages">
              View All Packages <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div ref={scrollRef} className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Ladakh" 
              price="₹21,999" 
              duration="6N/7D" 
              description="Experience the raw beauty of Leh, Nubra Valley, and Pangong Tso with a close-knit group of adventurers."
              bg="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1600&q=80"
              link="/itinerary/Ladakh" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Spiti Valley" 
              price="₹16,999" 
              duration="5N/6D" 
              description="Brave the frozen landscapes of the middle land. A curated winter adventure for the bold."
              bg="https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1600&q=80"
              link="/itinerary/Spiti Valley" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Kashmir" 
              price="₹17,999" 
              duration="4N/5D" 
              description="Explore Srinagar, Gulmarg, and Pahalgam. A perfect mix of leisure and breathtaking vistas."
              bg="https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&q=80"
              link="/itinerary/Kashmir" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Andaman Retreat" 
              price="₹25,999" 
              duration="5N/6D" 
              description="Relax on the pristine beaches of Havelock and Neil Islands with amazing scuba diving opportunities."
              bg="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1600&q=80"
              link="/group-trips" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Meghalaya Expedition" 
              price="₹18,999" 
              duration="6N/7D" 
              description="Journey through the abode of clouds, explore living root bridges and crystal clear rivers."
              bg="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1600&q=80"
              link="/group-trips" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Manali Kasol" 
              price="₹10,999" 
              duration="4N/5D" 
              description="Experience the vibrant cafes of Kasol and the snow-capped peaks of Manali in one epic trip."
              bg="https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1600&q=80"
              link="/group-trips" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Jibhi Tirthan" 
              price="₹9,999" 
              duration="3N/4D" 
              description="Unwind in the pristine hidden valleys of Jibhi and Tirthan, surrounded by lush green forests."
              bg="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=80"
              link="/group-trips" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Chopta Tungnath" 
              price="₹11,999" 
              duration="4N/5D" 
              description="Trek through the mini Switzerland of India and visit the highest Shiva temple in the world."
              bg="https://images.unsplash.com/photo-1610212594957-c5332fc39634?w=1600&q=80"
              link="/group-trips" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Kedarnath" 
              price="₹14,999" 
              duration="5N/6D" 
              description="Embark on a spiritual journey to the majestic Kedarnath temple amidst the Garhwal Himalayas."
              bg="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600&q=80"
              link="/group-trips" 
            />
            <PackageCard className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] snap-center shrink-0" 
              tripTitle="Madhyameshwar" 
              price="₹12,999" 
              duration="4N/5D" 
              description="Discover the serene beauty and spiritual aura of the mystical Madhyameshwar temple trek."
              bg="https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?w=1600&q=80"
              link="/group-trips" 
            />
          </div>
        </section>

        {/* Featured Group Trips */}
        <section className="w-full py-12 px-4 md:px-12 lg:px-20 border-t border-gray-100 bg-surface-container-lowest overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-[#136b8a]">
                <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                <span className="font-label-caps text-label-caps tracking-widest uppercase font-bold">Hot Selling</span>
              </div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold font-headline-lg">
                Featured Group <span className="text-[#136b8a]">Trips</span>
              </h2>
            </div>
            <Link className="inline-flex items-center text-[#136b8a] font-button text-button hover:text-[#0f556e] font-bold transition-colors" to="/featured-group-trips">
              View All Trips <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="-mx-4 md:mx-0 overflow-visible relative pb-12">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              loop={true}
              slidesPerView={'auto'}
              slideToClickedSlide={true}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 150,
                modifier: 2.5,
                slideShadows: true,
              }}
              modules={[EffectCoverflow]}
              className="w-full"
            >
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[75vw] sm:w-[240px] md:w-[280px] lg:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Chopta Tungnath" 
                  packagesCount="2" 
                  bg="https://images.unsplash.com/photo-1610212594957-c5332fc39634?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[75vw] sm:w-[240px] md:w-[280px] lg:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Kedarnath" 
                  packagesCount="4" 
                  bg="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[75vw] sm:w-[240px] md:w-[280px] lg:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Madhyameshwar" 
                  packagesCount="1" 
                  bg="https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[75vw] sm:w-[240px] md:w-[280px] lg:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Ladakh Expedition" 
                  packagesCount="3" 
                  bg="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1600&q=80"
                  link="/itinerary/Ladakh" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[75vw] sm:w-[240px] md:w-[280px] lg:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Winter Spiti Circuit" 
                  packagesCount="2" 
                  bg="https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1600&q=80"
                  link="/itinerary/Spiti Valley" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[75vw] sm:w-[240px] md:w-[280px] lg:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Kashmir Retreat" 
                  packagesCount="0" 
                  bg="https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&q=80"
                  link="/itinerary/Kashmir" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <FeaturedTripCard className="w-[75vw] sm:w-[240px] md:w-[280px] lg:w-[320px] h-[380px] md:h-[420px]" 
                  tripTitle="Andaman Retreat" 
                  packagesCount="5" 
                  bg="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
            </Swiper>
          </div>
        </section>

        {/* International Trips Coming Soon */}
        <section className="w-full py-12 px-4 md:px-12 lg:px-20 border-t border-gray-100 bg-surface-container-lowest overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-[#136b8a]">
                <span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
                <span className="font-label-caps text-label-caps tracking-widest uppercase font-bold">International</span>
              </div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold font-headline-lg">
                Soon you can plan <span className="text-[#136b8a]">abroad trips with us</span>
              </h2>
            </div>
            <Link className="inline-flex items-center text-[#136b8a] font-button text-button hover:text-[#0f556e] font-bold transition-colors" to="/international">
              View All Destinations <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pb-8">
            <PackageCard className="w-full h-[340px] md:h-[360px]" 
              tripTitle="Almaty" 
              price="54999" 
              duration="5N/6D" 
              description="Experience the magic of Central Asia."
              bg="https://images.unsplash.com/photo-1558588825-450f38b1d9df?w=800&q=80"
              link="#" 
              badge="Coming Soon"
            />
            <PackageCard className="w-full h-[340px] md:h-[360px]" 
              tripTitle="Kazakhstan" 
              price="56999" 
              duration="5N/6D" 
              description="Discover beautiful landscapes and culture."
              bg="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=80"
              link="#" 
              badge="Coming Soon"
            />
            <PackageCard className="w-full h-[340px] md:h-[360px]" 
              tripTitle="Thailand" 
              price="41999" 
              duration="6N/7D" 
              description="Explore vibrant beaches and culture."
              bg="https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80"
              link="#" 
              badge="Coming Soon"
            />
            <PackageCard className="w-full h-[340px] md:h-[360px]" 
              tripTitle="Bali" 
              price="51999" 
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
