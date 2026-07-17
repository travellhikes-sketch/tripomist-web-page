import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DestinationSearch from '../components/DestinationSearch'
import Footer from '../components/Footer'
import PackageCard from '../components/PackageCard'
import { supabase } from '../supabaseClient'

function GroupTrips() {
  const location = useLocation()
  const [activeStyle, setActiveStyle] = useState('All')
  const [favoritesFilter, setFavoritesFilter] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [tripsList, setTripsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase
        .from('Pakage')
        .select('*');
      
      if (error) {
        console.error('Error fetching packages:', error);
      } else {
        const activePackages = data.filter(pkg => pkg.status && pkg.status.includes('active'));
        const mappedTrips = activePackages.map(pkg => ({
          id: pkg.id,
          name: pkg.title,
          location: pkg.destination || pkg.state,
          style: pkg.category === 'International' ? 'International Trips' : 'Domestic Trips',
          durationText: pkg.duration,
          price: pkg.price,
          isFav: false,
          img: pkg.image_url || pkg.banner_image
        }));
        setTripsList(mappedTrips);
      }
      setLoading(false);
    }
    fetchPackages();
  }, []);

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
              className={`relative overflow-hidden group/filter border px-5 py-2.5 rounded-full cursor-pointer transition-all duration-300 font-semibold text-sm ${
                activeStyle === filter 
                  ? 'bg-primary text-white border-primary shadow-md scale-105' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              {activeStyle !== filter && (
                <div className="absolute inset-0 w-0 bg-primary/10 transition-all duration-300 ease-out group-hover/filter:w-full z-0"></div>
              )}
              <span className="relative z-10">
                {filter}
              </span>
            </button>
          ))}
        </div>
        
        {/* Trips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <PackageCard 
              key={trip.id}
              className="w-full h-[340px] md:h-[360px]" 
              tripTitle={trip.name} 
              price={`₹${trip.price.toLocaleString('en-IN')}`} 
              duration={trip.durationText} 
              bg={trip.img}
              link={`/itinerary/${trip.id}`} 
              badge={trip.style === 'Domestic Trips' ? 'Domestic' : 'International'}
              blueText={true}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default GroupTrips
