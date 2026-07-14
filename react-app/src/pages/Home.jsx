import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Reusable Package Card Component (Clean, Classic Design matching user's image)
const PackageCard = ({ tripTitle, price, duration, description, bg, link, label }) => {
  return (
    <Link 
      to={link} 
      className="w-[85vw] sm:w-[280px] md:w-[320px] flex-shrink-0 snap-center bg-[#f8fbff] rounded-xl overflow-hidden border border-blue-100 group flex flex-col h-full shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url('${bg}')` }}></div>
        {label && (
          <div className="absolute top-3 right-3 bg-[#136b8a] text-white font-bold text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm z-10">
            {label}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow bg-white">
        <div className="flex items-center gap-4 text-gray-500 font-bold text-[10px] mb-3 uppercase tracking-wider">
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {duration}</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span> Group</span>
        </div>
        <h3 className="text-[18px] md:text-[20px] text-gray-900 mb-2 font-bold leading-tight">{tripTitle}</h3>
        <p className="text-[13px] text-gray-600 mb-6 flex-grow leading-relaxed">{description}</p>
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-0.5">Starts At</span>
            <span className="text-[20px] text-[#136b8a] font-extrabold">{price}</span>
          </div>
          <button className="border border-gray-200 text-gray-800 font-bold text-[12px] px-4 py-2 rounded-lg hover:border-[#136b8a] hover:text-[#136b8a] hover:bg-[#eff6f9] transition-colors cursor-pointer shadow-sm">
            View Details
          </button>
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
              preload="none"
              poster="https://lh3.googleusercontent.com/aida-public/AB6AXuDr1bFj-VK1OCK8cofjz3XpkMGaadAnPYNmy27ywy54zuRYxrUQWhc_bunY6J-RqHK7AH63X6zrdMCNsPptKpAjoAH0gN_AyLziUOhSONpQWYo2iL4J0lexaBryu5Jkgz98qymqdjEkPK6YVc27KlmYURB5u-wFuH0ea815zPNGCAyoL54FxRvBec2KvReMlQ3I5k-JNY1lb-l6qzxNx0EqJq6TgwOr025Fb-LqlnNhup3j9tRlfLE2Ijr-lxsxOAeNIw3yoHQS_XrEWNA"
              className="w-full h-full object-cover opacity-90"
            >
              {/* Using a premium cinematic snow-covered mountains video */}
              <source src="https://assets.mixkit.co/videos/preview/mixkit-winter-forest-covered-with-snow-from-above-4188-large.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Cinematic dark gradient overlay (40-50%) for perfect text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30"></div>
          </div>
          
          {/* Content Wrapper */}
          <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="relative z-10 max-w-3xl mb-stack-lg">
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-white mb-6 font-bold leading-tight">
              Find Yourself&nbsp; <br /><span className="text-primary-container">With TripoMist</span>
            </h1>
            <p className="font-body-lg text-body-lg text-white/80 max-w-2xl mb-8">
              Your Safe Travel Our Responsibility<span className="text-primary-container">.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <Link className="inline-flex items-center justify-center bg-primary text-on-primary font-button text-button px-8 py-4 rounded-lg hover:bg-primary/95 transition-all shadow-md active:scale-98 whitespace-nowrap" to="/group-trips">
                Explore Group Trips
                <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
              </Link>
              <Link className="inline-flex items-center justify-center border border-white/50 text-white font-button text-button px-8 py-4 rounded-lg hover:border-white hover:text-white hover:bg-white/10 transition-colors bg-black/30 backdrop-blur-sm active:scale-98 whitespace-nowrap" to="/upcoming-trips">
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
        <section className="py-12 px-4 md:px-8 max-w-container-max mx-auto bg-surface-container-lowest">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Explore Destinations</h2>
          </div>
          
          <div className="flex gap-8 overflow-x-auto hide-scrollbar py-4 px-2 -mx-2">
            <div onClick={() => navigate('/uttarakhand')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Uttarakhand" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center max-w-[100px] leading-tight transition-colors">Uttarakhand</span>
            </div>
            <div onClick={() => navigate('/himachal')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Himachal Pradesh" src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Himachal Pradesh</span>
            </div>
            <div onClick={() => navigate('/kashmir')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Kashmir" src="https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Kashmir</span>
            </div>
            <div onClick={() => navigate('/rajasthan')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Rajasthan" src="https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Rajasthan</span>
            </div>
            <div onClick={() => navigate('/meghalaya')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Meghalaya" src="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=600&auto=format&fit=crop" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Meghalaya</span>
            </div>
            <div onClick={() => navigate('/ladakh')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Ladakh" src="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?q=80&w=600&auto=format&fit=crop" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Ladakh</span>
            </div>
            <div onClick={() => navigate('/spiti')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Spiti Valley" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTVDi07scWfsFblrLlOF-M9lu-HBlLoRDiFhOY99I-xJ8vciAIMc4UWni-VaPjhz66-GETj7gd_fHksswzPboUyDwG1PK0xK8Sob6IH0ONIcytECw-YZjVpt2MCEB5U9uVNq13npqE1DEbJ9UNLPeQIp50xXz0iFVTy_XEx8qhmd7iKpyJ8VllOV8TFiFIezpeoxg2BIlQii2v60DuTHXrdh_Pcm3FPdSSXD_s_4jG-YFTYpnCQTHKIXIj8SpiRgCiPUPkJnNyJZ5t" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center max-w-[100px] leading-tight transition-colors">Spiti Valley</span>
            </div>
            <div onClick={() => navigate('/andaman')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Andaman" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEgmyWOIgZZbElsZln0-quTF0Zl1sILwwQ0jCPpa9x4O6dexC9kI3F5q6J36Sdjx675kTkFj1OhTAmdo1dRRTjI7BL82J61hzB98Ir7m8lklUTKBDQOL7GBNY4O1TYJtbQlPRlQ6HpPXHJTv-pq9GZAZ_83waE9IRgwZoZbaxPRHFZiXmNjpSU-DTYBJJNY7ayhcdClyF0WZmvH0gC6Pu3goYX3H7GJx6u24jX-q7nJ3LtZ38SEz_SXg_vXpKwA2472XqCzQIRXYA_" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Andaman</span>
            </div>
          </div>
        </section>

        {/* Camera Roll Destinations */}
        <section className="py-24 px-4 md:px-8 max-w-[1400px] mx-auto bg-surface-container-lowest overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-[#136b8a]">
                <span className="material-symbols-outlined text-[16px]">explore</span>
                <span className="font-label-caps text-label-caps tracking-widest uppercase font-bold">Explore</span>
              </div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
                Explore More.<br />
                Capture Better.<br />
                <span className="text-[#136b8a]">With TripoMist.</span>
              </h2>
            </div>
          </div>

          {/* Cards Container with Snap Scrolling */}
          <div className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
            <PackageCard 
              tripTitle="Ladakh" 
              price="₹21,999" 
              duration="6N/7D" 
              description="Experience the raw beauty of Leh, Nubra Valley, and Pangong Tso with a close-knit group of adventurers."
              bg="https://lh3.googleusercontent.com/aida-public/AB6AXuAj_2vbbw_s3xz1DiSwdLIPB91UjIk6PDZxdsBnYm814_77Jzqvfd2kWMUeOvj3AEjF3S4r4H15YwByYU97r8Fu7ILdgtSJ7U5xniKZmkdCoaFd_qnmf7-3V7Arh2PPk6Q87ghzBZjDLQe2VR7QRLwWpmocIiBZeT0Jfr7z12eP6njmtr_SiXnTl4Xo5Kodp5oHyjSeZ-7Z8cS6quHT4VhEBpHASzD0tOUoSMVb_xNsQhzdUiwWoLW4I37lVfc5kAK_dtkYWb5NmnPq"
              link="/itinerary/Ladakh" 
            />
            <PackageCard 
              tripTitle="Spiti Valley" 
              price="₹16,999" 
              duration="5N/6D" 
              description="Brave the frozen landscapes of the middle land. A curated winter adventure for the bold."
              bg="https://lh3.googleusercontent.com/aida-public/AB6AXuDiD2GO7fIb1ciUdWe0odOedfkhJIm1ur64B1iKghZ8eMdF66RoOvQDTrZz1L1nfURfVdMroAzsjyFtv85EjcF8NXBkccIFhdalQolBp9Yar92MT8MtrG9wQGjuK5B7wctNIUhR54TEU7PYNv323Svs0dPfNfV6sfFdjHZinMcri0e9lDmEaHhHTP1F5YA25LoETYvVR1Dnn-8UNP4ShswwHgnmwn3Pw1YqRx1ECDm16ijYYriT-jcGpT9--pyJ_OQkKTc7lwXlnByS"
              link="/itinerary/Spiti Valley" 
            />
            <PackageCard 
              tripTitle="Kashmir" 
              price="₹17,999" 
              duration="4N/5D" 
              description="Explore Srinagar, Gulmarg, and Pahalgam. A perfect mix of leisure and breathtaking vistas."
              bg="https://lh3.googleusercontent.com/aida-public/AB6AXuCoZ_1M6Zk0HMDhTpKzxMQgQnTBWH9nJlDxVZ3z680TUyTZDm2k0r8nZLugA9SsMmSxZwBQNlP0RqL0o_pN3y8oodeLuZrAMK_BT5g3TtjjmMuq2qryknNF_eDajNtaJ0lhkNCoTDd0wvhRvqO6r6FQKYgQY2G1jrrxLxKfk3vfLTyv4stEcsTeJNnx4i_IeZlGcu5QAISZR2l1bfUnCU3NRglStiKpz8VEJh6Ac0yEugDurHd9RpWrIHVqOg_8q7TXhns1RLgQNPd3"
              link="/itinerary/Kashmir" 
            />
            <PackageCard 
              tripTitle="Andaman Retreat" 
              price="₹25,999" 
              duration="5N/6D" 
              description="Relax on the pristine beaches of Havelock and Neil Islands with amazing scuba diving opportunities."
              bg="https://lh3.googleusercontent.com/aida-public/AB6AXuAEgmyWOIgZZbElsZln0-quTF0Zl1sILwwQ0jCPpa9x4O6dexC9kI3F5q6J36Sdjx675kTkFj1OhTAmdo1dRRTjI7BL82J61hzB98Ir7m8lklUTKBDQOL7GBNY4O1TYJtbQlPRlQ6HpPXHJTv-pq9GZAZ_83waE9IRgwZoZbaxPRHFZiXmNjpSU-DTYBJJNY7ayhcdClyF0WZmvH0gC6Pu3goYX3H7GJx6u24jX-q7nJ3LtZ38SEz_SXg_vXpKwA2472XqCzQIRXYA_"
              link="/group-trips" 
            />
            <PackageCard 
              tripTitle="Meghalaya Expedition" 
              price="₹18,999" 
              duration="6N/7D" 
              description="Journey through the abode of clouds, explore living root bridges and crystal clear rivers."
              bg="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=600&auto=format&fit=crop"
              link="/group-trips" 
            />
          </div>
        </section>

        {/* Featured Group Trips */}
        <section className="py-24 px-4 md:px-8 max-w-[1400px] mx-auto border-t border-gray-100 bg-surface-container-lowest overflow-hidden">
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
              bg="https://lh3.googleusercontent.com/aida-public/AB6AXuAj_2vbbw_s3xz1DiSwdLIPB91UjIk6PDZxdsBnYm814_77Jzqvfd2kWMUeOvj3AEjF3S4r4H15YwByYU97r8Fu7ILdgtSJ7U5xniKZmkdCoaFd_qnmf7-3V7Arh2PPk6Q87ghzBZjDLQe2VR7QRLwWpmocIiBZeT0Jfr7z12eP6njmtr_SiXnTl4Xo5Kodp5oHyjSeZ-7Z8cS6quHT4VhEBpHASzD0tOUoSMVb_xNsQhzdUiwWoLW4I37lVfc5kAK_dtkYWb5NmnPq"
              link="/itinerary/Ladakh" 
              label="Best Seller"
            />
            <PackageCard 
              tripTitle="Winter Spiti Circuit" 
              price="₹16,999" 
              duration="5N/6D" 
              description="Brave the frozen landscapes of the middle land. A curated winter adventure for the bold."
              bg="https://lh3.googleusercontent.com/aida-public/AB6AXuDiD2GO7fIb1ciUdWe0odOedfkhJIm1ur64B1iKghZ8eMdF66RoOvQDTrZz1L1nfURfVdMroAzsjyFtv85EjcF8NXBkccIFhdalQolBp9Yar92MT8MtrG9wQGjuK5B7wctNIUhR54TEU7PYNv323Svs0dPfNfV6sfFdjHZinMcri0e9lDmEaHhHTP1F5YA25LoETYvVR1Dnn-8UNP4ShswwHgnmwn3Pw1YqRx1ECDm16ijYYriT-jcGpT9--pyJ_OQkKTc7lwXlnByS"
              link="/itinerary/Spiti Valley" 
            />
            <PackageCard 
              tripTitle="Kashmir Retreat" 
              price="₹19,999" 
              duration="4N/5D" 
              description="Explore Srinagar, Gulmarg, and Pahalgam. A perfect mix of leisure and breathtaking vistas."
              bg="https://lh3.googleusercontent.com/aida-public/AB6AXuCoZ_1M6Zk0HMDhTpKzxMQgQnTBWH9nJlDxVZ3z680TUyTZDm2k0r8nZLugA9SsMmSxZwBQNlP0RqL0o_pN3y8oodeLuZrAMK_BT5g3TtjjmMuq2qryknNF_eDajNtaJ0lhkNCoTDd0wvhRvqO6r6FQKYgQY2G1jrrxLxKfk3vfLTyv4stEcsTeJNnx4i_IeZlGcu5QAISZR2l1bfUnCU3NRglStiKpz8VEJh6Ac0yEugDurHd9RpWrIHVqOg_8q7TXhns1RLgQNPd3"
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
        <section className="py-24 px-4 md:px-8 max-w-[1400px] mx-auto border-t border-gray-100 bg-surface-container-lowest overflow-hidden">
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
        <section className="px-4 md:px-8 max-w-container-max mx-auto mb-24 mt-24">
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

      {/* Expandable Contact FAB */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-center gap-3">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex flex-col gap-3 items-center mb-1"
            >
              <a
                className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                href="mailto:info@tripomist.com"
                title="Email Us"
              >
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                href="tel:+919990802608"
                title="Call Us"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20b858] flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                href="https://wa.me/919990802608"
                target="_blank" 
                rel="noreferrer"
                title="WhatsApp Us"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c-.003 1.396.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-xl active:scale-95 ${isFabOpen ? 'bg-slate-700 hover:bg-slate-800' : 'bg-[#136b8a] hover:bg-[#0f556e]'}`}
          title="Contact Options"
        >
          <motion.span 
            animate={{ rotate: isFabOpen ? 90 : 0 }} 
            className="material-symbols-outlined text-[24px]"
          >
            {isFabOpen ? 'close' : 'call'}
          </motion.span>
        </button>
      </div>

      <Footer />
    </div>
  )
}

export default Home
