import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Reusable Package Card Component (Clean, Classic Design matching user's image)
const PackageCard = ({ tripTitle, price, duration, description, bg, link, label }) => {
  return (
    <Link 
      to={link} 
      draggable={false}
      className="w-[85vw] sm:w-[240px] md:w-[260px] lg:w-[280px] h-[340px] md:h-[360px] flex-shrink-0 snap-center rounded-[28px] overflow-hidden group relative flex flex-col justify-end shadow-sm hover:shadow-xl transition-all duration-300 select-none block"
    >
      <div className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700 pointer-events-none" style={{ backgroundImage: `url('${bg}')` }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent h-[75%] mt-auto"></div>
      
      {label && (
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider z-10">
          {label}
        </div>
      )}

      <div className="relative z-10 p-6 md:p-7 w-full flex flex-col gap-1">
        <h3 className="text-white text-[22px] md:text-[26px] font-bold leading-tight">{tripTitle}</h3>
        <p className="text-white/80 text-[13px] md:text-[14px] font-medium mb-4 truncate">{description}</p>
        
        <div className="flex flex-wrap gap-2.5">
          <span className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md text-white text-[11px] md:text-[12px] font-semibold px-4 py-1.5 rounded-full">
            {duration}
          </span>
          <span className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md text-white text-[11px] md:text-[12px] font-semibold px-4 py-1.5 rounded-full">
            Group
          </span>
          <span className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md text-white text-[11px] md:text-[12px] font-semibold px-4 py-1.5 rounded-full">
            {price}
          </span>
        </div>
      </div>
    </Link>
  )
}

function Home() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [isFabOpen, setIsFabOpen] = useState(false)

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
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to="/all-departures">
                Explore All Departures
                <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
              </Link>
              <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to="/upcoming-departures">
                See Upcoming Departures
              </Link>
              <div className="relative flex items-center bg-black/40 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3.5 w-full sm:w-64">
                <span className="material-symbols-outlined text-white/60 mr-2 text-[20px] leading-none">search</span>
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchValue.trim()) {
                      navigate(`/group-trips?search=${encodeURIComponent(searchValue.trim())}`)
                    }
                  }}
                  className="bg-transparent border-none text-white text-sm focus:ring-0 outline-none w-full placeholder-white/60 p-0"
                  placeholder="Search destinations..."
                  type="text"
                />
              </div>
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
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Himachal Pradesh</span>
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
                <span className="material-symbols-outlined text-[16px]">explore</span>
                <span className="font-label-caps text-label-caps tracking-widest uppercase font-bold">Explore</span>
              </div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
                Explore More Capture Better
              </h2>
            </div>
          </div>

          {/* Cards Container with Swiper Flat */}
          <div className="-mx-4 md:mx-0">
            <Swiper
              grabCursor={true}
              centeredSlides={true}
              loop={true}
              slidesPerView={'auto'}
              spaceBetween={24}
              observer={true}
              observeParents={true}
              touchEventsTarget="container"
              modules={[Autoplay]}
              className="w-full !pb-12 !pt-6"
            >
              <SwiperSlide className="!w-auto">
                <PackageCard 
                  tripTitle="Ladakh" 
                  price="₹21,999" 
                  duration="6N/7D" 
                  description="Experience the raw beauty of Leh, Nubra Valley, and Pangong Tso with a close-knit group of adventurers."
                  bg="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1600&q=80"
                  link="/itinerary/Ladakh" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <PackageCard 
                  tripTitle="Spiti Valley" 
                  price="₹16,999" 
                  duration="5N/6D" 
                  description="Brave the frozen landscapes of the middle land. A curated winter adventure for the bold."
                  bg="https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1600&q=80"
                  link="/itinerary/Spiti Valley" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <PackageCard 
                  tripTitle="Kashmir" 
                  price="₹17,999" 
                  duration="4N/5D" 
                  description="Explore Srinagar, Gulmarg, and Pahalgam. A perfect mix of leisure and breathtaking vistas."
                  bg="https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&q=80"
                  link="/itinerary/Kashmir" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <PackageCard 
                  tripTitle="Andaman Retreat" 
                  price="₹25,999" 
                  duration="5N/6D" 
                  description="Relax on the pristine beaches of Havelock and Neil Islands with amazing scuba diving opportunities."
                  bg="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <PackageCard 
                  tripTitle="Meghalaya Expedition" 
                  price="₹18,999" 
                  duration="6N/7D" 
                  description="Journey through the abode of clouds, explore living root bridges and crystal clear rivers."
                  bg="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <PackageCard 
                  tripTitle="Manali Kasol" 
                  price="₹10,999" 
                  duration="4N/5D" 
                  description="Experience the vibrant cafes of Kasol and the snow-capped peaks of Manali in one epic trip."
                  bg="https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <PackageCard 
                  tripTitle="Jibhi Tirthan" 
                  price="₹9,999" 
                  duration="3N/4D" 
                  description="Unwind in the pristine hidden valleys of Jibhi and Tirthan, surrounded by lush green forests."
                  bg="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <PackageCard 
                  tripTitle="Chopta Tungnath" 
                  price="₹11,999" 
                  duration="4N/5D" 
                  description="Trek through the mini Switzerland of India and visit the highest Shiva temple in the world."
                  bg="https://images.unsplash.com/photo-1610212594957-c5332fc39634?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <PackageCard 
                  tripTitle="Kedarnath" 
                  price="₹14,999" 
                  duration="5N/6D" 
                  description="Embark on a spiritual journey to the majestic Kedarnath temple amidst the Garhwal Himalayas."
                  bg="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
              <SwiperSlide className="!w-auto">
                <PackageCard 
                  tripTitle="Madhyameshwar" 
                  price="₹12,999" 
                  duration="4N/5D" 
                  description="Discover the serene beauty and spiritual aura of the mystical Madhyameshwar temple trek."
                  bg="https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?w=1600&q=80"
                  link="/group-trips" 
                />
              </SwiperSlide>
            </Swiper>
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
            <Link className="inline-flex items-center text-[#136b8a] font-button text-button hover:text-[#0f556e] font-bold transition-colors" to="/group-trips">
              View All Trips <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
            <PackageCard 
              tripTitle="Ladakh Expedition" 
              price="₹24,999" 
              duration="6N/7D" 
              description="Experience the raw beauty of Leh, Nubra Valley, and Pangong Tso with a close-knit group of adventurers."
              bg="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1600&q=80"
              link="/itinerary/Ladakh" 
              label="Best Seller"
            />
            <PackageCard 
              tripTitle="Winter Spiti Circuit" 
              price="₹16,999" 
              duration="5N/6D" 
              description="Brave the frozen landscapes of the middle land. A curated winter adventure for the bold."
              bg="https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1600&q=80"
              link="/itinerary/Spiti Valley" 
            />
            <PackageCard 
              tripTitle="Kashmir Retreat" 
              price="₹19,999" 
              duration="4N/5D" 
              description="Explore Srinagar, Gulmarg, and Pahalgam. A perfect mix of leisure and breathtaking vistas."
              bg="https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&q=80"
              link="/itinerary/Kashmir" 
            />
            <PackageCard 
              tripTitle="Rajasthan Royalty" 
              price="₹22,999" 
              duration="6N/7D" 
              description="Discover the majestic forts, stunning palaces, and vast deserts of historic Rajasthan."
              bg="https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80"
              link="/group-trips" 
            />
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
          </div>

          <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
            <PackageCard 
              tripTitle="Bali Escape" 
              price="₹51,999" 
              duration="6N/7D" 
              description="Experience the magic of Bali, from pristine beaches to lush rice terraces and ancient temples."
              bg="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80"
              link="#" 
            />
            <PackageCard 
              tripTitle="Vietnam Adventure" 
              price="₹56,999" 
              duration="5N/6D" 
              description="Discover the breathtaking landscapes, rich history, and vibrant culture of Vietnam."
              bg="https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80"
              link="#" 
            />
            <PackageCard 
              tripTitle="Singapore Highlights" 
              price="₹55,999" 
              duration="4N/5D" 
              description="Explore the futuristic city-state of Singapore, offering a perfect blend of nature and modern marvels."
              bg="https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80"
              link="#" 
            />
            <PackageCard 
              tripTitle="Dubai Luxury Getaway" 
              price="₹62,999" 
              duration="5N/6D" 
              description="Experience the opulence of Dubai, from the towering Burj Khalifa to the endless desert dunes."
              bg="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80"
              link="#" 
            />
          </div>
        </section>

        {/* Experience banner stats */}
        <section className="w-full px-4 md:px-12 lg:px-20 mb-24 mt-24">
          <div className="flex flex-col md:flex-row justify-between items-center bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8 shadow-sm gap-8 md:gap-16">
            <div className="text-center w-full">
              <div className="font-headline-lg text-headline-lg text-[#136b8a] mb-1 flex items-center justify-center gap-1 font-bold">4.9<span className="material-symbols-outlined fill-current text-[24px]">star</span></div>
              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[12px] font-bold">Google Rating</div>
            </div>
            <div className="text-center w-full">
              <div className="font-headline-lg text-headline-lg text-[#136b8a] mb-1 font-bold">10K+</div>
              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[12px] font-bold">Happy Travellers</div>
            </div>
            <div className="text-center w-full">
              <div className="font-headline-lg text-headline-lg text-[#136b8a] mb-1 font-bold">100+</div>
              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[12px] font-bold">Domestic Trips</div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home
