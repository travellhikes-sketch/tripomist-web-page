import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import BookingModal from '../components/BookingModal'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DownloadItineraryModal from '../components/DownloadItineraryModal'
import ReviewsSection from '../components/ReviewsSection'
import { supabase } from '../utils/supabaseClient'
import { formatSlugToTitle } from '../utils/formatters'

const cleanHeroTitle = (title) => {
  if (!title) return '';
  return title
    .replace(/\b\d+\s*(Nights?|N)\s*\/?\s*\d+\s*(Days?|D)\b/ig, '')
    .replace(/\b\d+\s*(Days?|D)\s*\/?\s*\d+\s*(Nights?|N)\b/ig, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export default function PackageDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Itinerary')
  const [travellers, setTravellers] = useState(1)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  
  const [activeAccordion, setActiveAccordion] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReadMore, setIsReadMore] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  
  const [siteSettings, setSiteSettings] = useState(null)

  useEffect(() => {
    async function fetchPackage() {
      const isBannerRoute = location.pathname.startsWith('/banner/');
      const table = isBannerRoute ? 'promotional_banners' : 'Pakage';
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (error || !data) {
        console.error('Error fetching package or not found, using dummy data:', error)
        // Dummy fallback data so the page opens even if DB is empty
        const titleFallback = slug ? slug.replace(/-/g, ' ').toUpperCase() : 'Amazing Trip';
        setTrip({
          title: titleFallback,
          badge: "Most Popular",
          state: "Adventure",
          durationText: "5N 6D",
          duration: "6 Days, 5 Nights",
          numericPrice: 19999,
          price: `₹19,999`,
          originalPrice: `₹24,999`,
          discountText: "20% OFF",
          pickup: "Delhi / Chandigarh",
          heroImg: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
          bg: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
          overview: "Enjoy a breathtaking journey through stunning landscapes. This package offers a perfect mix of adventure, relaxation, and cultural exploration.",
          description: "Experience the trip of a lifetime with our carefully curated itinerary. From scenic viewpoints to local cuisines, every moment is planned for your ultimate comfort and enjoyment.",
          inclusions: ["Accommodation in premium hotels", "Daily Breakfast & Dinner", "Sightseeing transfers", "Experienced Guide"],
          exclusions: ["Flight / Train Tickets", "Personal Expenses", "Entry fees to monuments", "Travel Insurance"],
          highlights: ["Day 1: Arrival & Local Sightseeing", "Day 2: Adventure Activities", "Day 3: Scenic Drive & Departure"],
          days: [
            { num: 0, title: "Arrival & Local Sightseeing", desc: "Arrive at the destination and check into your hotel. Later, visit local attractions." },
            { num: 1, title: "Adventure Activities", desc: "Spend the day enjoying various adventure sports and exploring hidden gems." },
            { num: 2, title: "Scenic Drive & Departure", desc: "After breakfast, enjoy a scenic drive before heading back home." }
          ],
          costings: [
            { type: "Double Sharing", price: "₹19,999 per person" },
            { type: "Triple Sharing", price: "₹18,500 per person" },
            { type: "Quad Sharing", price: "₹17,000 per person" }
          ]
        })
      } else {
        // Map data to match the UI fields
        const isBannerRoute = location.pathname.startsWith('/banner/');
        const priceNum = isBannerRoute ? (data.price || 0) : data.price;
        const originalPriceNum = isBannerRoute ? (data.original_price || 0) : data.original_price;

        setTrip({
          id: data.id,
          title: data.title,
          badge: "Most Popular", // Default or you can add logic
          state: data.state,
          durationText: data.duration,
          duration: data.duration,
          numericPrice: priceNum, // used for cart calculation
          price: `₹${priceNum.toLocaleString('en-IN')}`,
          originalPrice: `₹${originalPriceNum.toLocaleString('en-IN')}`,
          discountText: data.discount_text,
          pickup: isBannerRoute ? data.destination : data.departure_from,
          heroImg: isBannerRoute ? data.desktop_image : (data.banner_image || data.image_url),
          bg: isBannerRoute ? data.desktop_image : (data.banner_image || data.image_url),
          overview: data.short_description,
          description: data.full_description,
          inclusions: data.inclusions || [],
          exclusions: data.exclusions || [],
          highlights: data.itinerary ? data.itinerary.map(item => item.title) : [],
          days: data.itinerary ? data.itinerary.map((item, idx) => {
            const rawVal = item.day || item.day_number || item.dayNumber || item.title || item.heading || item.description || item.details || '';
            let parsedLabel = String(rawVal).trim();
            if (/^[0-9]+$/.test(parsedLabel)) {
              parsedLabel = `Day ${parsedLabel}`;
            }
            return {
              num: parsedLabel,
              title: item.title,
              desc: item.description
            };
          }) : [],
          costings: data.costings || []
        })
      }
      setLoading(false)
    }

    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'package_detail_settings').single()
      if (data) {
        setSiteSettings(data.setting_value)
      }
    }

    fetchSettings()

    if (slug) {
      fetchPackage()
    } else {
        setLoading(false)
    }
  }, [slug, location.pathname])

  useEffect(() => {
    if (!trip) return;
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const isAdded = cartItems.some(item => item.title === trip.title);
    setIsAddedToCart(isAdded);
  }, [trip]);

  const handleAddToCart = () => {
    if (!trip) return;
    let cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    if (isAddedToCart) {
      cartItems = cartItems.filter(item => item.title !== trip.title);
      localStorage.setItem('cart', JSON.stringify(cartItems));
      setIsAddedToCart(false);
    } else {
      cartItems.push({
        id: Date.now(),
        title: trip.title,
        duration: trip.durationText || trip.duration || "Package",
        travellers: travellers,
        price: trip.numericPrice,
        total: trip.numericPrice * travellers,
        image: trip.heroImg || trip.bg,
        slug: slug || trip.title.toLowerCase().replace(/ /g, '-')
      });
      localStorage.setItem('cart', JSON.stringify(cartItems));
      setIsAddedToCart(true);
    }
    window.dispatchEvent(new Event('cartUpdated'));
  }

  const handleBookNow = () => {
    setIsBookingModalOpen(true)
  }

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index)
  }

  const handleSendEnquiry = () => {
    if(!trip) return;
    
    let template = siteSettings?.whatsapp_template || "Hey *TripoMist* I'm interested in *{package_title}*\nMy Full Name: \nPrefer Travel date: \nDestination: {package_title}\nHow Many people travel with me : {travellers}";
    let message = template
      .replace(/{package_title}/g, trip.title)
      .replace(/{price}/g, `₹${trip.numericPrice * travellers}`)
      .replace(/{duration}/g, trip.duration || '')
      .replace(/{travellers}/g, travellers)
      .replace(/{departure_from}/g, trip.pickup || '');

    const phone = siteSettings?.whatsapp_number || "919990802608";
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <p className="text-xl text-primary font-bold">Loading...</p>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <p className="text-xl text-red-500 font-bold">Package not found</p>
      </div>
    )
  }

  const strikePrice = trip.numericPrice + 3000
  const totalAmount = trip.numericPrice * travellers

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      
      <main className="w-full flex-grow">
        {/* Hero Section */}
        <div className="relative w-full h-[45vh] md:h-[60vh] bg-gray-900 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center w-full h-full" style={{ backgroundImage: `url('${trip.bg}')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 flex flex-col items-start justify-end px-4 md:px-12 lg:px-20 pb-16">
            <h1 className="text-white text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-xl text-left max-w-4xl">
              {cleanHeroTitle(trip.title)}
            </h1>
          </div>
        </div>

        {/* Content Layout */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 relative">
          
          {/* Left Column: Itinerary & Details */}
          <div className="lg:col-span-8 flex flex-col">
            
            {/* Title & Description */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-sans tracking-tight">
                About {trip.title} Trip {trip.pickup ? `From ${trip.pickup}` : ''}
              </h1>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-2">
                {isReadMore ? trip.description : `${trip.description?.slice(0, 80) || ''}...`}
              </p>
              <button onClick={() => setIsReadMore(!isReadMore)} className="text-[#136b8a] font-bold hover:underline text-sm md:text-base cursor-pointer">
                {isReadMore ? 'Read Less' : 'Read More'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-10 hide-scrollbar border-b border-gray-100">
              {['Itinerary', 'Inclusions & Exclusions', 'Costing'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all border cursor-pointer
                    ${activeTab === tab 
                      ? 'bg-[#eff6f9] text-[#136b8a] border-[#136b8a]' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Itinerary Section */}
            {activeTab === 'Itinerary' && (
              <section className="mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Itinerary Breakdown</h2>
                  <div className="flex items-center gap-3">
                    {/* Add to Cart Circular Button */}
                    <button
                      onClick={handleAddToCart}
                      title="Add to Cart"
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-sm border cursor-pointer ${isAddedToCart ? 'bg-white text-[#136b8a] border-[#136b8a]' : 'bg-[#136b8a] text-white border-transparent hover:bg-[#0f556e]'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isAddedToCart ? 'check' : 'shopping_cart'}
                      </span>
                    </button>

                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="btn-shiny bg-[#136b8a] hover:bg-[#0f556e] text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Download Itinerary
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  {trip.days && trip.days.map((day, idx) => (
                    <div key={day.num || idx} className="bg-[#eff6f9] rounded-2xl overflow-hidden border border-[#b9dae6]">
                      <button 
                        onClick={() => toggleAccordion(idx)}
                        className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left cursor-pointer hover:bg-[#deedf4] transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-5 flex-grow pr-4">
                          <div className="flex-shrink-0 bg-white border border-[#136b8a] text-gray-900 font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-wide w-fit">
                            {day.num}
                          </div>
                          <h3 className="font-bold text-gray-900 text-base md:text-lg uppercase tracking-tight">{day.title}</h3>
                        </div>
                        <span 
                          className="material-symbols-outlined text-gray-800 transition-transform duration-300 flex-shrink-0 font-bold"
                          style={{ transform: activeAccordion === idx ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          expand_more
                        </span>
                      </button>
                      {activeAccordion === idx && (
                        <div className="px-5 md:px-6 pb-5 pt-1 text-gray-800 text-sm md:text-base">
                          <ul className="space-y-3 list-disc pl-4 marker:text-gray-500">
                            {day.desc && day.desc.split('. ').filter(Boolean).map((sentence, sIdx) => (
                              <li key={sIdx}>{sentence.trim()}{sentence.endsWith('.') ? '' : '.'}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Other Tabs Placeholders */}
            {activeTab === 'Inclusions & Exclusions' && (
              <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What's included and what's not</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-[#136b8a] mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#25D366]">check_circle</span> Included
                    </h3>
                    <ul className="space-y-4 text-gray-700 font-medium">
                      {trip.inclusions && trip.inclusions.length > 0 ? trip.inclusions.map((inc, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check</span>
                          {inc}
                        </li>
                      )) : (
                        <>
                          <li className="flex gap-3 items-start">
                            <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check</span>
                            Accommodation in hotels, campsites, and lakeside cottages.
                          </li>
                          <li className="flex gap-3 items-start">
                            <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check</span>
                            Meals included.
                          </li>
                          <li className="flex gap-3 items-start">
                            <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check</span>
                            All sightseeing, permits, and entry fees as per the itinerary.
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-500">cancel</span> Excluded
                    </h3>
                    <ul className="space-y-4 text-gray-700 font-medium">
                      {trip.exclusions && trip.exclusions.length > 0 ? trip.exclusions.map((exc, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="material-symbols-outlined text-red-500 mt-0.5 text-[20px]">close</span>
                          {exc}
                        </li>
                      )) : (
                        <>
                          <li className="flex gap-3 items-start">
                            <span className="material-symbols-outlined text-red-500 mt-0.5 text-[20px]">close</span>
                            Flight / Train Tickets.
                          </li>
                          <li className="flex gap-3 items-start">
                            <span className="material-symbols-outlined text-red-500 mt-0.5 text-[20px]">close</span>
                            Personal Expenses.
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </section>
            )}
            {activeTab === 'Costing' && (
              <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Costing Details</h2>
                <div className="space-y-4 text-gray-700 font-medium">
                  <div className="flex justify-between items-center p-4 bg-[#eff6f9] rounded-xl border border-[#cde5ef]">
                    <span className="font-bold">Per Person</span>
                    <span className="text-[#136b8a] font-bold text-lg">₹{trip.numericPrice.toLocaleString()} <span className="text-sm text-gray-500 font-normal">+ 5% GST</span></span>
                  </div>
                </div>
              </section>
            )}
            {activeTab !== 'Itinerary' && activeTab !== 'Inclusions & Exclusions' && activeTab !== 'Costing' && (
              <section className="mb-10 min-h-[200px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500 font-medium">Content for {activeTab} will be available here.</p>
              </section>
            )}
            
          </div>

          {/* Right Column: Sticky Booking Card (Desktop Only) */}
          <div className="w-full lg:col-span-4 relative mt-8 lg:mt-0">
            <div className="sticky top-[100px] bg-white rounded-3xl border border-gray-200 p-6 shadow-lg shadow-gray-100">
              
              {/* Price Details */}
              <div className="mb-6 border-b border-gray-100 pb-5">
                <span className="font-semibold text-gray-900 text-sm block mb-1">Starting Price</span>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[#136b8a] text-3xl font-bold">{trip.price} <span className="text-sm text-gray-500 font-medium">{siteSettings?.gst_label || '+ 5% GST'}</span></span>
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    {trip.originalPrice && trip.originalPrice !== trip.price && trip.originalPrice !== '₹0' ? (
                      <span className="line-through text-gray-500 font-normal">{trip.originalPrice}</span>
                    ) : (
                      <span className="line-through text-gray-500 font-normal">₹{(trip.numericPrice + 3000).toLocaleString()}</span>
                    )}
                    {trip.discountText ? (
                      <span className="text-red-500 font-bold">{trip.discountText}</span>
                    ) : (
                      <span className="text-red-500 font-bold">₹3,000 Off</span>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 text-sm font-medium">Per Person</p>
              </div>

              {/* No of Travellers */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <span className="material-symbols-outlined text-purple-600 text-[20px]">group</span>
                  No. of Travellers
                </div>
                <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
                  <button onClick={() => setTravellers(Math.max(1, travellers - 1))} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full font-bold transition-colors text-lg cursor-pointer">-</button>
                  <span className="font-bold text-gray-900 text-base w-4 text-center">{travellers}</span>
                  <button onClick={() => setTravellers(travellers + 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full font-bold transition-colors text-lg cursor-pointer">+</button>
                </div>
              </div>

              {/* Total Amount */}
              <div className="flex items-center justify-between mb-8 bg-[#eff6f9] px-4 py-3 rounded-xl border border-[#cde5ef]">
                <span className="font-bold text-gray-800 text-sm">Total Amount</span>
                <span className="font-extrabold text-[#136b8a] text-xl">₹{totalAmount.toLocaleString()}</span>
              </div>
              
              {/* Action Buttons */}
              <button 
                onClick={handleBookNow}
                className="btn-shiny w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] mb-4 text-lg cursor-pointer"
              >
                <span className="relative z-10">Book Now</span>
              </button>
              <button 
                onClick={handleSendEnquiry}
                className="w-full mt-4 bg-[#25D366] hover:bg-[#20b858] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg cursor-pointer"
              >
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg" alt="WhatsApp" className="w-5 h-5 filter invert" />
                {siteSettings?.default_enquiry_text || 'Send Enquiry to trip experts'}
              </button>
              <p className="text-center text-gray-500 text-[11px] font-medium mt-2 mb-2">
                fill the blanks to send enquiry to expert
              </p>
              
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {trip.id && (
          <ReviewsSection packageId={trip.id} />
        )}
      </main>

      <DownloadItineraryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tripTitle={trip.title}
      />
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        tripTitle={trip.title}
        price={totalAmount}
        travellers={travellers}
        navigate={navigate}
        packageId={slug}
        destination={formatSlugToTitle(trip.destination) || trip.title}
        costings={trip.costings}
      />

      <Footer />
    </div>
  )
}
