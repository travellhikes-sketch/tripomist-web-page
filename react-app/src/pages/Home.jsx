import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Home() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="w-full flex-grow">
        {/* Hero Section */}
        <section className="relative w-full min-h-[921px] flex flex-col justify-end pt-32 pb-margin-mobile md:pb-margin-desktop px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full -z-10">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr1bFj-VK1OCK8cofjz3XpkMGaadAnPYNmy27ywy54zuRYxrUQWhc_bunY6J-RqHK7AH63X6zrdMCNsPptKpAjoAH0gN_AyLziUOhSONpQWYo2iL4J0lexaBryu5Jkgz98qymqdjEkPK6YVc27KlmYURB5u-wFuH0ea815zPNGCAyoL54FxRvBec2KvReMlQ3I5k-JNY1lb-l6qzxNx0EqJq6TgwOr025Fb-LqlnNhup3j9tRlfLE2Ijr-lxsxOAeNIw3yoHQS_XrEWNA" alt="Group of travelers on a ridge" className="w-full h-full object-cover" />
            <div className="absolute inset-0 gradient-overlay"></div>
          </div>
          {/* Content */}
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
        </section>

        {/* Explore Destinations - Circles */}
        <section className="py-12 px-4 md:px-8 max-w-container-max mx-auto bg-surface-container-lowest">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Explore Destinations</h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1">
              <Link to="/group-trips" className="whitespace-nowrap px-4 py-2 rounded-full border-2 border-primary text-primary font-button text-button flex items-center gap-2 bg-primary/5 cursor-pointer">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>public</span> All
              </Link>
              <Link to="/group-trips?style=Mountains" className="whitespace-nowrap px-4 py-2 rounded-full border border-outline-variant/50 text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors font-button text-button flex items-center gap-2 bg-surface cursor-pointer">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>landscape</span> Mountains
              </Link>
              <Link to="/group-trips?style=Beaches" className="whitespace-nowrap px-4 py-2 rounded-full border border-outline-variant/50 text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors font-button text-button flex items-center gap-2 bg-surface cursor-pointer">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>beach_access</span> Beaches
              </Link>
            </div>
          </div>
          
          <div className="flex gap-8 overflow-x-auto hide-scrollbar py-4 px-2 -mx-2">
            {/* Spain */}
            <div onClick={() => navigate('/group-trips?search=Spain')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Spain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg6Yy2y1B5_zWhldPgOEjCjf_mFK-MB5PkN0aygVffQIP-tCSPDr5lepNbZ9SiqN36VBop5DEfKD9iuXPhOykaVrbRxg_CNqaR5Ga-8N21myCpBf0_mblz5ozmxPPeZzvZUFzICH8Nf0ej71uXRPpT3jiDlXwrLrSM3Dg3e9k-PLX9JQhVuY8ywoVk1hgOYZ_aIgNVhPhPCEeORhAJzGmZgs3iIYpWea9JW4EvAQOnyFq181A4snTAsYTLEPTAl8LuIv_cXqeNqlFB" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center max-w-[100px] leading-tight transition-colors">Spain & Ibiza</span>
            </div>
            {/* Japan */}
            <div onClick={() => navigate('/group-trips?search=Japan')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Japan" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8DxhOnB12NwDl9aSCd17cmp-hBViBvqvS-mQG__5JFfNGB1OWdWCrkklFOtMxqSmHS878pacq5l8_uX0qmWEuU5DxxOFyfI4gnNFJdFay7qwNfnwfqEJfORb6ea9_WCcGjGuSySGUQBM1akWuJULFuw4DbYMnX2UJruyzBMH3_n4LTH63bSqelO0NhSYXfaYT3pq5IW5vFRFaQ4q8UR5zW2Qzh6eTQwwdXnqrpAz-N6frYOVxJoxA19vOvRquurOoXB7OZVoebAWM" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Japan</span>
            </div>
            {/* Vietnam */}
            <div onClick={() => navigate('/group-trips?search=Vietnam')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Vietnam" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHQqdIRbvN9sWBUtDeTOLN4RI3y2AbjTMoiNX3ucdssWRlILrLBRoyM2nfFOeYZYb2-_BACX1poFT6Bmg8wVkf21C_NdzoCTz_ylxhI3HnmSBbjh_2r-QOinsuIe8gRdkO4_2T0h1GOAadQUkBYjFg77L2XL-Macwm-oYcc2cf-uW3zM1VkHqbkV3ZNaXfah6an2uXwuWBFBNGbC56xp0nz7O5cGtoPjfNdQVh2LwRP_LeVFzI2HnwXTEAH3JaWSBawED0T04k8Rl5" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Vietnam</span>
            </div>
            {/* Bali */}
            <div onClick={() => navigate('/group-trips?search=Bali')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Bali" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtn1wDKcsh5073nbZOT8l9ZwwZZoS-mrpjG6COUn9gGKWLb_8FYL7a8PEyX_BEEkBVhEbO3A7nNW0UQp7TAulteeO7xsbvhHWrpvg-i5gIUS_wqKLRfrTH6I24lThbfLxxVeZOFQJRTpDEX-iOqh6ulM2MVvUDD9_DYyDI63BDvhRQcjTtpXRvZJk1F8wDQe-FlsfH7YVAR6TVCFvhqLz3lgErFLgI911voNWPN-9bPWjepNk2rYYTbsSpLuP6KsaoxKHfJQteCFLD" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Bali</span>
            </div>
            {/* Thailand */}
            <div onClick={() => navigate('/group-trips?search=Thailand')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Thailand" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXf1ZG0UycvUoz1FHAhSaVsAaTkfc1dWUy4KrjVPJmOHpuCxMQtvvH8vnMyP4D74eXykeMX-Tq924pRbQ9KZo4X3EysKCbdGhMgufPFljfU3FCgV-Za3MpKBGxegKGMyrXk_P0CRl1NDTcesnTqGSPbKWhsoc4FvX72xAHECyLrAF-v8q0SwKGwNNMjz-DYwTCPXEaMubazz5zgS_aqtglb1HKHJqqSucXpjm_EgrFObN_pzTEzOJ-ALgeyVjIVKWsIWJ89era_0Yb" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Thailand</span>
            </div>
            {/* Ladakh */}
            <div onClick={() => navigate('/itinerary/Ladakh')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Ladakh" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZ_LVCgCoAYnwHPqtkSQujITiiomC5hwDNNBsmhdHh64fvHdPU9fTW9dH4r2ZMd3IZy7_ELIuQ5ktlG-Fy8TdpksKLInWdntfnoOfIIeMtsH1ZlcLsM_o5x-TFeFv_jGhdblCWYBTQch77PU0roJvzWOJNquEWga461jVuRtl6wHLIy5pz7LDHtD6cGn13l00Pbe1kE7ZP3B2Ibg6FzsyDY5CGZJSwKPFSz_NVjZGms-ZDNFoacJbYne_bkFr1KNLK1hQqQd2ZJ3P" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Ladakh</span>
            </div>
            {/* Spiti Valley */}
            <div onClick={() => navigate('/itinerary/Spiti Valley')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Spiti Valley" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTVDi07scWfsFblrLlOF-M9lu-HBlLoRDiFhOY99I-xJ8vciAIMc4UWni-VaPjhz66-GETj7gd_fHksswzPboUyDwG1PK0xK8Sob6IH0ONIcytECw-YZjVpt2MCEB5U9uVNq13npqE1DEbJ9UNLPeQIp50xXz0iFVTy_XEx8qhmd7iKpyJ8VllOV8TFiFIezpeoxg2BIlQii2v60DuTHXrdh_Pcm3FPdSSXD_s_4jG-YFTYpnCQTHKIXIj8SpiRgCiPUPkJnNyJZ5t" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center max-w-[100px] leading-tight transition-colors">Spiti Valley</span>
            </div>
            {/* Andaman */}
            <div onClick={() => navigate('/group-trips?search=Andaman')} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] destination-circle">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Andaman" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEgmyWOIgZZbElsZln0-quTF0Zl1sILwwQ0jCPpa9x4O6dexC9kI3F5q6J36Sdjx675kTkFj1OhTAmdo1dRRTjI7BL82J61hzB98Ir7m8lklUTKBDQOL7GBNY4O1TYJtbQlPRlQ6HpPXHJTv-pq9GZAZ_83waE9IRgwZoZbaxPRHFZiXmNjpSU-DTYBJJNY7ayhcdClyF0WZmvH0gC6Pu3goYX3H7GJx6u24jX-q7nJ3LtZ38SEz_SXg_vXpKwA2472XqCzQIRXYA_" />
              </div>
              <span className="font-button text-button text-on-surface group-hover:text-primary text-center transition-colors">Andaman</span>
            </div>
          </div>
        </section>

        {/* Camera Roll Destinations */}
        <section className="py-24 px-4 md:px-8 max-w-container-max mx-auto border-t border-outline-variant/30 bg-surface-container-lowest">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-primary">
                <span className="material-symbols-outlined text-[16px]">explore</span>
                <span className="font-label-caps text-label-caps tracking-widest uppercase">Explore</span>
              </div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
                Destinations made for<br />
                <span className="text-primary">your camera roll.</span>
              </h2>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Link className="px-4 py-2 rounded-full bg-primary text-on-primary font-button text-button hover:bg-primary/95 transition-colors" to="/group-trips">All</Link>
              <Link className="px-4 py-2 rounded-full border border-outline-variant/50 text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5 font-button text-button transition-colors bg-surface" to="/group-trips?style=Mountains">Mountains</Link>
              <Link className="px-4 py-2 rounded-full border border-outline-variant/50 text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5 font-button text-button transition-colors bg-surface" to="/group-trips?style=Beaches">Beaches</Link>
              <Link className="px-4 py-2 rounded-full border border-outline-variant/50 text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5 font-button text-button transition-colors bg-surface" to="/weekend-trips">Weekend</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ladakh */}
            <Link className="group relative rounded-xl overflow-hidden bg-surface-container border border-outline-variant/30 hover:border-primary transition-all duration-300 block aspect-[4/5] flex flex-col justify-between p-6 shadow-sm hover:shadow-md" to="/itinerary/Ladakh">
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAj_2vbbw_s3xz1DiSwdLIPB91UjIk6PDZxdsBnYm814_77Jzqvfd2kWMUeOvj3AEjF3S4r4H15YwByYU97r8Fu7ILdgtSJ7U5xniKZmkdCoaFd_qnmf7-3V7Arh2PPk6Q87ghzBZjDLQe2VR7QRLwWpmocIiBZeT0Jfr7z12eP6njmtr_SiXnTl4Xo5Kodp5oHyjSeZ-7Z8cS6quHT4VhEBpHASzD0tOUoSMVb_xNsQhzdUiwWoLW4I37lVfc5kAK_dtkYWb5NmnPq')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <span className="bg-white/90 backdrop-blur border border-outline-variant/30 text-on-surface font-label-caps text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 uppercase">
                  <span className="material-symbols-outlined text-[12px]">location_on</span> Mountains
                </span>
              </div>
              <div className="relative z-10">
                <h3 className="font-headline-md text-headline-md text-white mb-1 shadow-sm font-bold">Ladakh</h3>
                <p className="font-body-md text-body-md text-white/90 mb-4">Land of high passes</p>
                <div className="flex items-end justify-between border-t border-white/20 pt-4">
                  <div>
                    <div className="font-label-caps text-[10px] text-white/80 uppercase mb-1">Starts From</div>
                    <div className="font-headline-md text-headline-md text-primary-container font-bold">₹21,999</div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all">
                    <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Spiti Valley */}
            <Link className="group relative rounded-xl overflow-hidden bg-surface-container border border-outline-variant/30 hover:border-primary transition-all duration-300 block aspect-[4/5] flex flex-col justify-between p-6 shadow-sm hover:shadow-md" to="/itinerary/Spiti Valley">
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDiD2GO7fIb1ciUdWe0odOedfkhJIm1ur64B1iKghZ8eMdF66RoOvQDTrZz1L1nfURfVdMroAzsjyFtv85EjcF8NXBkccIFhdalQolBp9Yar92MT8MtrG9wQGjuK5B7wctNIUhR54TEU7PYNv323Svs0dPfNfV6sfFdjHZinMcri0e9lDmEaHhHTP1F5YA25LoETYvVR1Dnn-8UNP4ShswwHgnmwn3Pw1YqRx1ECDm16ijYYriT-jcGpT9--pyJ_OQkKTc7lwXlnByS')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <span className="bg-white/90 backdrop-blur border border-outline-variant/30 text-on-surface font-label-caps text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 uppercase">
                  <span className="material-symbols-outlined text-[12px]">location_on</span> Mountains
                </span>
              </div>
              <div className="relative z-10">
                <h3 className="font-headline-md text-headline-md text-white mb-1 shadow-sm font-bold">Spiti Valley</h3>
                <p className="font-body-md text-body-md text-white/90 mb-4">Middle land between India & Tibet</p>
                <div className="flex items-end justify-between border-t border-white/20 pt-4">
                  <div>
                    <div className="font-label-caps text-[10px] text-white/80 uppercase mb-1">Starts From</div>
                    <div className="font-headline-md text-headline-md text-primary-container font-bold">₹16,999</div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all">
                    <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Kashmir */}
            <Link className="group relative rounded-xl overflow-hidden bg-surface-container border border-outline-variant/30 hover:border-primary transition-all duration-300 block aspect-[4/5] flex flex-col justify-between p-6 shadow-sm hover:shadow-md" to="/itinerary/Kashmir">
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCoZ_1M6Zk0HMDhTpKzxMQgQnTBWH9nJlDxVZ3z680TUyTZDm2k0r8nZLugA9SsMmSxZwBQNlP0RqL0o_pN3y8oodeLuZrAMK_BT5g3TtjjmMuq2qryknNF_eDajNtaJ0lhkNCoTDd0wvhRvqO6r6FQKYgQY2G1jrrxLxKfk3vfLTyv4stEcsTeJNnx4i_IeZlGcu5QAISZR2l1bfUnCU3NRglStiKpz8VEJh6Ac0yEugDurHd9RpWrIHVqOg_8q7TXhns1RLgQNPd3')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <span className="bg-white/90 backdrop-blur border border-outline-variant/30 text-on-surface font-label-caps text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 uppercase">
                  <span className="material-symbols-outlined text-[12px]">location_on</span> Mountains
                </span>
              </div>
              <div className="relative z-10">
                <h3 className="font-headline-md text-headline-md text-white mb-1 shadow-sm font-bold">Kashmir</h3>
                <p className="font-body-md text-body-md text-white/90 mb-4">Heaven on earth</p>
                <div className="flex items-end justify-between border-t border-white/20 pt-4">
                  <div>
                    <div className="font-label-caps text-[10px] text-white/80 uppercase mb-1">Starts From</div>
                    <div className="font-headline-md text-headline-md text-primary-container font-bold">₹17,999</div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all">
                    <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Featured Group Trips */}
        <section className="py-24 px-4 md:px-8 max-w-container-max mx-auto border-t border-outline-variant/30 bg-surface-container-lowest">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-primary">
                <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                <span className="font-label-caps text-label-caps tracking-widest uppercase">Hot Selling</span>
              </div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold font-headline-lg">
                Featured Group <span className="text-primary">Trips</span>
              </h2>
            </div>
            <Link className="inline-flex items-center text-primary font-button text-button hover:text-primary-container transition-colors" to="/group-trips">
              View All Trips <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ladakh Card */}
            <div className="bg-surface rounded-xl overflow-hidden border border-outline-variant/30 group flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300 -translate-y-0 hover:-translate-y-1">
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAj_2vbbw_s3xz1DiSwdLIPB91UjIk6PDZxdsBnYm814_77Jzqvfd2kWMUeOvj3AEjF3S4r4H15YwByYU97r8Fu7ILdgtSJ7U5xniKZmkdCoaFd_qnmf7-3V7Arh2PPk6Q87ghzBZjDLQe2VR7QRLwWpmocIiBZeT0Jfr7z12eP6njmtr_SiXnTl4Xo5Kodp5oHyjSeZ-7Z8cS6quHT4VhEBpHASzD0tOUoSMVb_xNsQhzdUiwWoLW4I37lVfc5kAK_dtkYWb5NmnPq')" }}></div>
                <div className="absolute top-4 right-4 bg-primary text-on-primary font-label-caps text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider">Best Seller</div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-on-surface-variant font-label-caps text-[12px] mb-3 uppercase">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 6N/7D</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">group</span> Group</span>
                </div>
                <h3 className="font-headline-md text-[20px] text-on-surface mb-2 font-bold">The Ultimate Ladakh Expedition</h3>
                <p className="font-body-md text-[14px] text-on-surface-variant mb-6 flex-grow">Experience the raw beauty of Leh, Nubra Valley, and Pangong Tso with a close-knit group of adventurers.</p>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4 mt-auto">
                  <div>
                    <span className="text-[12px] text-on-surface-variant line-through block font-body-md">₹28,999</span>
                    <span className="font-headline-md text-[20px] text-primary font-bold">₹24,999</span>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/itinerary/Ladakh" className="border border-outline-variant/50 text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5 px-4 py-2 rounded-lg font-button text-button transition-colors">Details</Link>
                    <Link to="/checkout?trip=The Ultimate Ladakh Expedition&price=24999" className="bg-primary text-white hover:bg-primary/95 px-4 py-2 rounded-lg font-button text-button transition-colors">Book Now</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Spiti Card */}
            <div className="bg-surface rounded-xl overflow-hidden border border-outline-variant/30 group flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300 -translate-y-0 hover:-translate-y-1">
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDiD2GO7fIb1ciUdWe0odOedfkhJIm1ur64B1iKghZ8eMdF66RoOvQDTrZz1L1nfURfVdMroAzsjyFtv85EjcF8NXBkccIFhdalQolBp9Yar92MT8MtrG9wQGjuK5B7wctNIUhR54TEU7PYNv323Svs0dPfNfV6sfFdjHZinMcri0e9lDmEaHhHTP1F5YA25LoETYvVR1Dnn-8UNP4ShswwHgnmwn3Pw1YqRx1ECDm16ijYYriT-jcGpT9--pyJ_OQkKTc7lwXlnByS')" }}></div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-on-surface-variant font-label-caps text-[12px] mb-3 uppercase">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 5N/6D</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">group</span> Group</span>
                </div>
                <h3 className="font-headline-md text-[20px] text-on-surface mb-2 font-bold">Winter Spiti Circuit</h3>
                <p className="font-body-md text-[14px] text-on-surface-variant mb-6 flex-grow">Brave the frozen landscapes of the middle land. A curated winter adventure for the bold.</p>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4 mt-auto">
                  <div>
                    <span className="text-[12px] text-on-surface-variant block uppercase tracking-wider text-xs">Starts at</span>
                    <span className="font-headline-md text-[20px] text-primary font-bold">₹16,999</span>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/itinerary/Spiti Valley" className="border border-outline-variant/50 text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5 px-4 py-2 rounded-lg font-button text-button transition-colors">Details</Link>
                    <Link to="/checkout?trip=Spiti Valley Expedition&price=16999" className="bg-primary text-white hover:bg-primary/95 px-4 py-2 rounded-lg font-button text-button transition-colors">Book Now</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Kashmir Card */}
            <div className="bg-surface rounded-xl overflow-hidden border border-outline-variant/30 group flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300 -translate-y-0 hover:-translate-y-1">
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCoZ_1M6Zk0HMDhTpKzxMQgQnTBWH9nJlDxVZ3z680TUyTZDm2k0r8nZLugA9SsMmSxZwBQNlP0RqL0o_pN3y8oodeLuZrAMK_BT5g3TtjjmMuq2qryknNF_eDajNtaJ0lhkNCoTDd0wvhRvqO6r6FQKYgQY2G1jrrxLxKfk3vfLTyv4stEcsTeJNnx4i_IeZlGcu5QAISZR2l1bfUnCU3NRglStiKpz8VEJh6Ac0yEugDurHd9RpWrIHVqOg_8q7TXhns1RLgQNPd3')" }}></div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-on-surface-variant font-label-caps text-[12px] mb-3 uppercase">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 4N/5D</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">group</span> Group</span>
                </div>
                <h3 className="font-headline-md text-[20px] text-on-surface mb-2 font-bold">Kashmir Valley Retreat</h3>
                <p className="font-body-md text-[14px] text-on-surface-variant mb-6 flex-grow">Explore Srinagar, Gulmarg, and Pahalgam. A perfect mix of leisure and breathtaking vistas.</p>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4 mt-auto">
                  <div>
                    <span className="text-[12px] text-on-surface-variant block uppercase tracking-wider text-xs">Starts at</span>
                    <span className="font-headline-md text-[20px] text-primary font-bold">₹19,999</span>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/itinerary/Kashmir" className="border border-outline-variant/50 text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5 px-4 py-2 rounded-lg font-button text-button transition-colors">Details</Link>
                    <Link to="/checkout?trip=Kashmir Valley Paradise&price=19999" className="bg-primary text-white hover:bg-primary/95 px-4 py-2 rounded-lg font-button text-button transition-colors">Book Now</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Experience banner stats */}
        <section className="px-4 md:px-8 max-w-container-max mx-auto mb-24">
          <div className="flex flex-col md:flex-row justify-between items-center bg-surface-container-low border border-outline-variant/30 rounded-xl p-8 shadow-sm gap-8 md:gap-16">
            <div className="text-center w-full">
              <div className="font-headline-lg text-headline-lg text-primary mb-1 flex items-center justify-center gap-1 font-bold">4.9<span className="material-symbols-outlined fill-current text-[24px]">star</span></div>
              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[12px]">Google Rating</div>
            </div>
            <div className="text-center w-full">
              <div className="font-headline-lg text-headline-lg text-primary mb-1 font-bold">10K+</div>
              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[12px]">Happy Travellers</div>
            </div>
            <div className="text-center w-full">
              <div className="font-headline-lg text-headline-lg text-primary mb-1 font-bold">100+</div>
              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[12px]">Domestic Trips</div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-50 animate-float-bounce">
        <a className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white transition-colors shadow-lg active:scale-95" href="https://wa.me/919990802608" target="_blank" rel="noreferrer" title="WhatsApp Us">
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202 0 6.213 1.248 8.477 3.518 2.266 2.27 3.51 5.289 3.507 8.497-.005 6.545-5.343 11.884-11.957 11.884-.002 0-.003 0-.005 0-2.099 0-4.148-.549-5.952-1.59L0 24zm6.305-1.654c1.787 1.063 3.731 1.623 5.702 1.624h.004c5.789 0 10.5-4.71 10.503-10.499.002-2.805-1.09-5.442-3.076-7.427C17.462 4.058 14.821 2.96 12.012 2.96 6.225 2.96 1.516 7.67 1.513 13.46c0 1.972.52 3.918 1.507 5.707l-.99 3.618 3.827-.979zm11.167-7.603c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          </svg>
        </a>
      </div>

      <Footer />
    </div>
  )
}

export default Home
