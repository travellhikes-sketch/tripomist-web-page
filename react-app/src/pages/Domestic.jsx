import React, { useState, useEffect } from 'react'
import ReadMoreText from '../components/ReadMoreText'
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
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=1200&q=80"
          alt="Domestic trips"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Domestic Tour Packages
          </h1>
        </div>

        
      </section>

      {/* About Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
          About Domestic Tour Packages
        </h2>
        <ReadMoreText text="What if we say to you that there's a place wherein the clouds came down to greet the mountains, where rivers whisper the old secrets, and where time slows down just to make you able to take it all in? India is that magical place, waiting for you to explore its untouched beauty." />
        
        
      </section>

      {/* Grid Section */}
      <main className="max-w-6xl mx-auto px-4 pb-36 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <Link key={trip.id} to={`/itinerary/${trip.name.toLowerCase().replace(/\s+/g, '-')}`} className="glass-card rounded-[1.5rem] overflow-hidden group relative hover:shadow-[0_10px_25px_-5px_rgba(14,165,233,0.15)] transition-all duration-300 transform hover:-translate-y-2 flex flex-col no-underline">
              <div className="h-48 relative overflow-hidden">
                <img alt={trip.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={trip.img} />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md font-label-sm text-label-sm text-primary font-bold uppercase">{trip.durationText}</div>
              </div>
              <div className="p-6 flex flex-col flex-grow glass-reveal">
                <h3 className="font-headline-md text-headline-md mb-2 font-bold group-hover:text-primary transition-colors text-on-surface">{trip.name}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">{trip.location}</p>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/20">
                  <span className="font-headline-md text-headline-md text-primary font-bold">₹{trip.price.toLocaleString('en-IN')}</span>
                  <div className="bg-primary text-white px-4 py-1.5 rounded-lg font-label-sm text-label-sm hover:opacity-95 transition-opacity font-bold no-underline flex items-center">View Detail</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Domestic
