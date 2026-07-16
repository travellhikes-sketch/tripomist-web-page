import React, { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DownloadItineraryModal from '../components/DownloadItineraryModal'
import { GooeySearchBar } from '../components/ui/animated-search-bar'


// --- Booking Modal Component ---
const BookingModal = ({ isOpen, onClose, tripTitle, price, travellers, navigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: null,
    source: ''
  })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0,0,0,0);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (prev > new Date(today.getFullYear(), today.getMonth(), 1) || (prev.getMonth() === today.getMonth() && prev.getFullYear() === today.getFullYear())) {
      setCurrentMonth(prev);
    }
  };

  const handleDateSelect = (d) => {
    if (d >= today && d.getDay() === 5) { // Only Fridays
      setFormData({...formData, date: d});
      setIsCalendarOpen(false); // Close calendar on select
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date) return alert("Please select a date (Fridays only)");
    // Pass data to checkout
    navigate(`/checkout?trip=${encodeURIComponent(tripTitle)}&price=${price}&date=${formData.date.toISOString()}&name=${encodeURIComponent(formData.fullName)}&email=${encodeURIComponent(formData.email)}&phone=${encodeURIComponent('+91 ' + formData.phone)}&source=${encodeURIComponent(formData.source)}`);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Your Trip</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input required type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700" placeholder="John Doe" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700" placeholder="john@example.com" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone No (WhatsApp)</label>
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 font-semibold">+91</span>
              <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-200 rounded-r-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700" placeholder="9999999999" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Date</label>
            <div 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 cursor-pointer bg-white flex justify-between items-center text-gray-700 hover:border-[#136b8a] transition-colors"
            >
              <span>{formData.date ? formData.date.toLocaleDateString() : "Select Date"}</span>
              <span className="material-symbols-outlined text-gray-400">calendar_month</span>
            </div>

            {isCalendarOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 border border-gray-200 rounded-xl p-3 bg-white shadow-xl">
                <div className="flex justify-between items-center mb-2">
                  <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded-full"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                  <span className="font-bold text-sm text-gray-700">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded-full"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {days.map((d, idx) => {
                    if (!d) return <div key={idx} className="p-1"></div>;
                    const isPast = d < today;
                    const isFriday = d.getDay() === 5;
                    const isSelected = formData.date && d.getTime() === formData.date.getTime();
                    return (
                      <button 
                        key={idx}
                        type="button"
                        disabled={isPast || !isFriday}
                        onClick={() => handleDateSelect(d)}
                        className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${isPast ? 'text-gray-300 cursor-not-allowed' : !isFriday ? 'text-gray-400 cursor-not-allowed' : isSelected ? 'bg-[#136b8a] text-white font-bold' : 'bg-blue-100 text-[#136b8a] hover:bg-blue-200 font-semibold cursor-pointer'}`}
                      >
                        {d.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Where did you hear about us?</label>
            <select required value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none bg-white text-gray-700">
              <option value="" className="text-gray-400">Select source</option>
              <option value="Facebook" className="text-gray-700">Facebook</option>
              <option value="Instagram" className="text-gray-700">Instagram</option>
              <option value="WhatsApp" className="text-gray-700">WhatsApp</option>
              <option value="Google" className="text-gray-700">Google</option>
              <option value="Friend and Family" className="text-gray-700">Friend and Family</option>
              <option value="I'm already travel with you" className="text-gray-700">I'm already travel with you</option>
              <option value="Other" className="text-gray-700">Other</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] mt-4">
            Proceed to Checkout
          </button>
        </form>
      </div>
    </div>
  )
}
// ------------------------------

export default function ItineraryJibhi() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [activeAccordion, setActiveAccordion] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReadMore, setIsReadMore] = useState(false)
  
  // New States for Redesign
  const [activeTab, setActiveTab] = useState('Itinerary')
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [travellers, setTravellers] = useState(1)

  const tripsData = {
    "Spiti Valley": {
      title: "Spiti Valley Expedition",
      location: "Himachal Pradesh, India",
      description: "Journey through the high-altitude desert of the Himalayas. Experience ancient monasteries, surreal landscapes, and the raw beauty of the middle land.",
      price: "₹24,999",
      numericPrice: 24999,
      duration: "6 Days, 5 Nights",
      difficulty: "Moderate",
      bg: "https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1600&q=80",
      days: [
        {
          num: 1,
          title: "Arrival in Manali & Acclimatization",
          desc: "Arrive in the beautiful hill station of Manali. Spend the day acclimatizing to the altitude. We'll have a brief orientation session in the evening, followed by a welcome dinner with the group. Explore local cafes in Old Manali."
        },
        {
          num: 2,
          title: "Manali to Kaza via Atal Tunnel",
          desc: "Cross the engineering marvel, Atal Tunnel. Witness the dramatic change in landscape as we enter Lahaul Valley and proceed to Kaza. Drive offers stunning views of rugged mountains and Chandra River."
        },
        {
          num: 3,
          title: "Key Monastery & Kibber Village",
          desc: "Visit the iconic Key Monastery perched on a hilltop fortress. Later, drive to Kibber, one of the highest inhabited villages. Keep an eye out for Himalayan wildlife like the Snow Leopard."
        }
      ]
    },
    "Ladakh": {
      title: "Ladakh Himalayan Expedition",
      location: "Ladakh, India",
      description: "Experience the ultimate land of high passes. Drive through Khardung La, camp alongside Pangong Lake, and explore the ancient culture of Leh.",
      price: "₹21,999",
      numericPrice: 21999,
      duration: "7 Days, 6 Nights",
      difficulty: "Hard",
      bg: "https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1600&q=80",
      days: [
        {
          num: 1,
          title: "Arrival in Leh & Rest",
          desc: "Fly into Leh airport. Transfer to hotel and complete absolute bed rest for acclimatization. In the evening, visit Shanti Stupa for a gorgeous sunset over Leh town."
        },
        {
          num: 2,
          title: "Leh Local Sightseeing & Confluence",
          desc: "Explore Leh Palace, Hall of Fame, and Magnetic Hill. Visit Sangam - the spectacular confluence of Indus and Zanskar rivers. Enjoy local Ladakhi cuisine."
        },
        {
          num: 3,
          title: "Leh to Nubra Valley via Khardung La",
          desc: "Drive across Khardung La, one of the highest motorable passes in the world. Descend into Nubra Valley, enjoy double-humped camel rides on cold desert sand dunes of Hunder."
        }
      ]
    },
    "Kashmir": {
      title: "Kashmir Valley Paradise",
      location: "Kashmir, India",
      description: "Explore the stunning meadows of Gulmarg, the golden valleys of Pahalgam, and float on a traditional Shikara along the serene Dal Lake.",
      price: "₹17,999",
      numericPrice: 17999,
      duration: "5 Days, 4 Nights",
      difficulty: "Easy",
      bg: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&q=80",
      days: [
        {
          num: 1,
          title: "Srinagar Arrival & Houseboat Stay",
          desc: "Arrive in Srinagar. Check into a beautiful traditional cedar wood Houseboat on Dal Lake. Enjoy a relaxing Shikara ride through floating markets during golden hour."
        },
        {
          num: 2,
          title: "Srinagar to Gulmarg Day Trip",
          desc: "Drive to Gulmarg, the meadow of flowers. Take the Gulmarg Gondola, one of the highest cable cars in Asia, up to the snow line. Play in snow and enjoy skiing options."
        },
        {
          num: 3,
          title: "Srinagar to Pahalgam Valley",
          desc: "Drive to Pahalgam along saffron fields. Explore Aru Valley and Betaab Valley. Walk along the crystal clear waters of Lidder River before a warm bonfire dinner."
        }
      ]
    }
  }

  // Determine active itinerary dynamically
  let trip = tripsData["Spiti Valley"];
  if (id) {
    const formattedId = id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    // Check specific overrides first
    if (id.toLowerCase().includes("ladakh")) trip = tripsData["Ladakh"];
    else if (id.toLowerCase().includes("kashmir")) trip = tripsData["Kashmir"];
    else if (tripsData[formattedId]) trip = tripsData[formattedId];
    else {
      // Create dynamic fallback using Spiti as a template
      trip = {
        ...trip,
        title: `${formattedId} Tour Package`,
        location: formattedId,
        description: `Explore the beautiful landscapes of ${formattedId}. Journey through amazing places and make memories for a lifetime.`
      };
    }
  }

  React.useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const isAdded = cartItems.some(item => item.title === trip.title);
    setIsAddedToCart(isAdded);
  }, [trip.title]);

  
  const handleAddToCart = () => {
    if (isAddedToCart) return;
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    cartItems.push({
      id: Date.now(),
      title: trip.title,
      duration: trip.durationText || "Package",
      travellers: travellers,
      price: trip.numericPrice,
      total: trip.numericPrice * travellers
    });
    localStorage.setItem('cart', JSON.stringify(cartItems));
    setIsAddedToCart(true);
    window.dispatchEvent(new Event('cartUpdated'));
  }

  const handleBookNow = () => {
    setIsBookingModalOpen(true)
  }

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index)
  }

  const handleSendEnquiry = () => {
    const message = `Hey *TripoMist* I'm interested in *${trip.title}*\nMy Full Name: \nPrefer Travel date: \nDestination: ${trip.title}\nHow Many people travel with me : ${travellers}`;
    const whatsappUrl = `https://wa.me/919990802608?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
              {trip.title} {trip.duration.split(',')[0]}
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
                About {trip.title} Trip From Delhi
              </h1>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-2">
                {isReadMore ? trip.description : `${trip.description.slice(0, 80)}...`}
              </p>
              <button onClick={() => setIsReadMore(!isReadMore)} className="text-[#136b8a] font-bold hover:underline text-sm md:text-base cursor-pointer">
                {isReadMore ? 'Read Less' : 'Read More'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-10 hide-scrollbar border-b border-gray-100">
              {['Itinerary', 'Inclusions', 'Costing'].map((tab) => (
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
                  {trip.days.map((day, idx) => (
                    <div key={day.num} className="bg-[#eff6f9] rounded-2xl overflow-hidden border border-[#b9dae6]">
                      <button 
                        onClick={() => toggleAccordion(idx)}
                        className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left cursor-pointer hover:bg-[#deedf4] transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-5 flex-grow pr-4">
                          <div className="flex-shrink-0 bg-white border border-[#136b8a] text-gray-900 font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-wide w-fit">
                            Day {day.num}
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
                            {day.desc.split('. ').filter(Boolean).map((sentence, sIdx) => (
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
            {activeTab === 'Inclusions' && (
              <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What included in package and what not ??</h2>
                
                <h3 className="text-lg font-bold text-[#136b8a] mb-4">Included</h3>
                <ul className="space-y-4 text-gray-700 font-medium">
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check_circle</span>
                    Accommodation in hotels, campsites, and lakeside cottages.
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check_circle</span>
                    Meals {parseInt(trip.duration.split(' ')[0]) - 1 || 4} Dinner & {parseInt(trip.duration.split(' ')[0]) - 1 || 4} Breakfast
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check_circle</span>
                    Professional team captains, guides, and support staff.
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check_circle</span>
                    First aid kits, oxygen cylinders, and an oximeter are available.
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check_circle</span>
                    All sightseeing, permits, and entry fees as per the itinerary.
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check_circle</span>
                    Adventure medical insurance
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check_circle</span>
                    Emergency medical support and oxygen cylinders for high altitudes.
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check_circle</span>
                    Inner Line Permits for restricted areas included.
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-[#25D366] mt-0.5 text-[20px]">check_circle</span>
                    Delhi to {trip.title.split(' ')[0]} and back via volvo bus & Tempo traveller for the whole journey for local sightseeings.
                  </li>
                </ul>
              </section>
            )}
            {activeTab !== 'Itinerary' && activeTab !== 'Inclusions' && (
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
                  <span className="text-[#136b8a] text-3xl font-bold">{trip.price} <span className="text-sm text-gray-500 font-medium">+ 5% GST</span></span>
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <span className="line-through text-gray-500 font-normal">₹{strikePrice.toLocaleString()}</span>
                    <span className="text-red-500 font-bold">₹3,000 Off</span>
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
                Send Enquiry to trip experts
              </button>
              <p className="text-center text-gray-500 text-[11px] font-medium mt-2 mb-2">
                fill the blanks to send enquiry to expert
              </p>
              
            </div>
          </div>
        </div>
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
      />

      <Footer />
    </div>
  )
}

