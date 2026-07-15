import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DestinationSearch from '../components/DestinationSearch'
import Footer from '../components/Footer'

function GroupTrips() {
  const location = useLocation()
  const [activeStyle, setActiveStyle] = useState('All')
  const [favoritesFilter, setFavoritesFilter] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [tripsList, setTripsList] = useState([
    {
      id: "uttarakhand-explorer",
      name: "Valley of Flowers Trek",
      location: "Uttarakhand",
      style: "Domestic Trips",
      durationText: "5N/6D",
      price: 15999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80"
    },
    {
      id: "himachal-adventure",
      name: "Manali to Rohtang Pass",
      location: "Himachal",
      style: "Domestic Trips",
      durationText: "4N/5D",
      price: 12499,
      isFav: false,
      img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80"
    },
    {
      id: "kashmir-paradise",
      name: "Kashmir Valley Paradise",
      location: "Kashmir",
      style: "Domestic Trips",
      durationText: "5N/6D",
      price: 18999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600&q=80"
    },
    {
      id: "rajasthan-royal",
      name: "Jaipur & Udaipur Heritage",
      location: "Rajasthan",
      style: "Domestic Trips",
      durationText: "3N/4D",
      price: 14999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80"
    },
    {
      id: "meghalaya-monsoon",
      name: "Cherrapunji & Shillong",
      location: "Meghalaya",
      style: "Domestic Trips",
      durationText: "4N/5D",
      price: 17500,
      isFav: false,
      img: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=600&q=80"
    },
    {
      id: "ladakh-expedition",
      name: "Ladakh Himalayan Expedition",
      location: "Ladakh",
      style: "Domestic Trips",
      durationText: "6N/7D",
      price: 21999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=600&q=80"
    },
    {
      id: "spiti-valley-expedition",
      name: "Spiti Valley Roadtrip",
      location: "Spiti Valley",
      style: "Domestic Trips",
      durationText: "7N/8D",
      price: 24999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=600&q=80"
    },
    {
      id: "andaman-escape",
      name: "Andaman Islands Escape",
      location: "Andaman",
      style: "Domestic Trips",
      durationText: "5N/6D",
      price: 28500,
      isFav: false,
      img: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=600&q=80"
    },
    {
      id: "bali-escape",
      name: "Bali Island Escape",
      location: "Bali",
      style: "International Trips",
      durationText: "5N/6D",
      price: 35000,
      isFav: false,
      img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80"
    },
    {
      id: "dubai-adventure",
      name: "Dubai Desert Adventure",
      location: "Dubai",
      style: "International Trips",
      durationText: "4N/5D",
      price: 42000,
      isFav: false,
      img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80"
    }
  ])

  // Parse query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const styleParam = urlParams.get('style')
    if (styleParam) setActiveStyle(styleParam)

    const favParam = urlParams.get('favorites')
    if (favParam === 'true') setFavoritesFilter(true)

    const searchParam = urlParams.get('search') || urlParams.get('query')
    if (searchParam) setSearchQuery(searchParam)
  }, [location])

  const toggleFavorite = (id) => {
    setTripsList(prev => prev.map(t => t.id === id ? { ...t, isFav: !t.isFav } : t))
  }

  const filteredTrips = tripsList.filter(trip => {
    if (activeStyle !== 'All' && trip.style !== activeStyle) return false
    if (favoritesFilter && !trip.isFav) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return trip.name.toLowerCase().includes(q) || trip.style.toLowerCase().includes(q) || (trip.location && trip.location.toLowerCase().includes(q))
    }
    return true
  }).sort((a, b) => {
    if (activeStyle === 'All') {
      if (a.style === 'Domestic Trips' && b.style === 'International Trips') return -1;
      if (a.style === 'International Trips' && b.style === 'Domestic Trips') return 1;
    }
    return 0;
  });

  return (
    <div className="text-on-background bg-background font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Navbar />

            {/* Hero */}
      <section className="relative w-full h-72 md:h-96 flex items-end pb-10 px-6 md:px-12 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=1200&q=80"
          alt="Trips"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden md:flex relative w-full items-end justify-between">
            <div className="w-1/3">
              <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore</p>
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">Group Trips & Expeditions</h1>
              <p className="text-white/80 mt-2 text-base">Explore premium group adventures across stunning landscapes, beaches, and scenic mountain trails.</p>
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-[400px]">
              <DestinationSearch 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trips by destination..."
              />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col gap-6">
            <div>
              <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore</p>
              <h1 className="text-white text-4xl font-bold leading-tight">Group Trips & Expeditions</h1>
              <p className="text-white/80 mt-2 text-base">Explore premium group adventures across stunning landscapes, beaches, and scenic mountain trails.</p>
            </div>
            <div className="w-full">
              <DestinationSearch 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trips by destination..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12">

        
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          {['All', 'Domestic Trips', 'International Trips'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveStyle(filter)}
              className={`px-5 py-2.5 rounded-full border text-sm font-semibold transition-all cursor-pointer ${
                activeStyle === filter 
                  ? 'bg-primary text-white border-primary shadow-md scale-105' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        {/* Trips Grid */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <div key={trip.id} className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 hover:shadow-lg transition-all duration-300 group flex flex-col h-full trip-card">
              <div className="relative h-48 w-full overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={trip.name} src={trip.img} />
                <div className="absolute top-3 left-3 bg-primary text-on-primary px-3 py-1 rounded-md font-label-sm text-label-sm shadow-sm backdrop-blur-md bg-opacity-90 font-bold">{trip.style}</div>
                <button 
                  onClick={() => toggleFavorite(trip.id)} 
                  className={`absolute top-3 right-3 p-1.5 bg-surface-container-lowest/80 backdrop-blur-sm rounded-full hover:text-red-500 transition-colors cursor-pointer ${trip.isFav ? 'text-red-500' : 'text-on-surface'}`}
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: trip.isFav ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                </button>
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold group-hover:text-primary transition-colors">{trip.name}</h3>
                <div className="flex items-center gap-1 text-on-surface-variant mb-4 mt-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span className="font-body-md text-body-md text-sm">{trip.durationText}</span>
                </div>
                <div className="mt-auto flex items-end justify-between pt-4 border-t border-outline-variant/10">
                  <div>
                    <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider text-[10px]">Starting from</span>
                    <span className="font-headline-md text-headline-md text-primary font-bold">₹{trip.price.toLocaleString('en-IN')}</span>
                  </div>
                  <Link 
                    to={`/itinerary/${trip.name.toLowerCase().replace(/\s+/g, '-')}`} 
                    className="bg-primary text-on-primary px-4 py-2 rounded-lg font-body-md text-body-md font-semibold hover:bg-surface-tint transition-colors no-underline"
                  >
                    View Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default GroupTrips
