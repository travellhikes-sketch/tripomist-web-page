import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DestinationSearch from '../components/DestinationSearch'
import Footer from '../components/Footer'

function Domestic() {
  const location = useLocation()
  const [activeStyle, setActiveStyle] = useState('All')
  const [favoritesFilter, setFavoritesFilter] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [tripsList, setTripsList] = useState([
    {
      id: "uttarakhand-explorer",
      name: "Valley of Flowers Trek",
      location: "Uttarakhand",
      style: "Mountains",
      durationText: "5N/6D",
      price: 15999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80"
    },
    {
      id: "himachal-adventure",
      name: "Manali to Rohtang Pass",
      location: "Himachal",
      style: "Mountains",
      durationText: "4N/5D",
      price: 12499,
      isFav: false,
      img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80"
    },
    {
      id: "kashmir-paradise",
      name: "Kashmir Valley Paradise",
      location: "Kashmir",
      style: "Mountains",
      durationText: "5N/6D",
      price: 18999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600&q=80"
    },
    {
      id: "rajasthan-royal",
      name: "Jaipur & Udaipur Heritage",
      location: "Rajasthan",
      style: "Weekend",
      durationText: "3N/4D",
      price: 14999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80"
    },
    {
      id: "meghalaya-monsoon",
      name: "Cherrapunji & Shillong",
      location: "Meghalaya",
      style: "Mountains",
      durationText: "4N/5D",
      price: 17500,
      isFav: false,
      img: "https://images.unsplash.com/photo-1629211252194-2795f72da0bc?w=600&q=80"
    },
    {
      id: "ladakh-expedition",
      name: "Ladakh Himalayan Expedition",
      location: "Ladakh",
      style: "Mountains",
      durationText: "6N/7D",
      price: 21999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1596500412806-0361280031dc?w=600&q=80"
    },
    {
      id: "spiti-valley-expedition",
      name: "Spiti Valley Roadtrip",
      location: "Spiti Valley",
      style: "Mountains",
      durationText: "7N/8D",
      price: 24999,
      isFav: false,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTVDi07scWfsFblrLlOF-M9lu-HBlLoRDiFhOY99I-xJ8vciAIMc4UWni-VaPjhz66-GETj7gd_fHksswzPboUyDwG1PK0xK8Sob6IH0ONIcytECw-YZjVpt2MCEB5U9uVNq13npqE1DEbJ9UNLPeQIp50xXz0iFVTy_XEx8qhmd7iKpyJ8VllOV8TFiFIezpeoxg2BIlQii2v60DuTHXrdh_Pcm3FPdSSXD_s_4jG-YFTYpnCQTHKIXIj8SpiRgCiPUPkJnNyJZ5t"
    },
    {
      id: "andaman-escape",
      name: "Andaman Islands Escape",
      location: "Andaman",
      style: "Beaches",
      durationText: "5N/6D",
      price: 28500,
      isFav: false,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0y5u9i_7N2laNOZIxv71RdSK5FT0jAp-uHjMwYERiu8PA0f5ZIXZzTW4mDV5pXzsldIlhzXyCWnP5ZeVmWrNzZA04wZjrXsqBFScmOmKAtCHvpCFb6K2d2clvgPz9CbpDVnYeY-R0F5Gqy6VwxCes6qYo50J7xDRpzrnraZxMnW3TIp8XWLoxy3IC28IqbylRrXiPfjUP5lIgNX_7uh3ALSCif0KIatU2BLPP981PAZcWg9SUt4geKFkNwyapsLwVn2kD17gLKID1"
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
  })

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
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">Domestic Trips & Expeditions</h1>
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
              <h1 className="text-white text-4xl font-bold leading-tight">Domestic Trips & Expeditions</h1>
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
                    to={`/checkout?trip=${encodeURIComponent(trip.name)}&price=${trip.price}`} 
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

export default Domestic
