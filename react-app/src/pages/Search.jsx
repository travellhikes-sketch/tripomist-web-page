import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Search() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')
  const [tripsList, setTripsList] = useState([
    {
      id: "ladakh-expedition",
      name: "Ladakh Expedition",
      style: "Mountains",
      durationText: "6N/7D",
      price: 21999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
    },
    {
      id: "andaman-escape",
      name: "Andaman Escape",
      style: "Beaches",
      durationText: "4N/5D",
      price: 18500,
      isFav: false,
      img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
    },
    {
      id: "munnar-retreat",
      name: "Munnar Retreat",
      style: "Weekend",
      durationText: "2N/3D",
      price: 8999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
    },
    {
      id: "spiti-valley-expedition",
      name: "Spiti Valley Expedition",
      style: "Mountains",
      durationText: "5N/6D",
      price: 24999,
      isFav: false,
      img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
    },
    {
      id: "rishikesh-retreat",
      name: "Rishikesh Retreat",
      style: "Weekend",
      durationText: "1N/2D",
      price: 5499,
      isFav: false,
      img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
    },
    {
      id: "jaipur-heritage",
      name: "Jaipur Heritage",
      style: "Weekend",
      durationText: "2N/3D",
      price: 6200,
      isFav: false,
      img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
    }
  ])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('search') || params.get('query') || ''
    setSearchVal(query)
  }, [location])

  const toggleFavorite = (id) => {
    setTripsList(prev => prev.map(t => t.id === id ? { ...t, isFav: !t.isFav } : t))
  }

  const doSearch = () => {
    navigate(`/search?search=${encodeURIComponent(searchVal.trim())}`)
  }

  const filteredTrips = tripsList.filter(trip => {
    const query = searchVal.toLowerCase().trim()
    if (!query) return true
    return trip.name.toLowerCase().includes(query) || trip.style.toLowerCase().includes(query)
  })

  return (
    <div className="text-on-background bg-background font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12">
        {/* Google-like Search Bar Card */}
        <div className="max-w-xl mx-auto mb-12 text-center">
          <h1 className="font-display-lg text-2xl md:text-3xl font-extrabold mb-2 text-on-surface tracking-tight">Search Results</h1>
          <p className="text-on-surface-variant text-sm mb-6">Type destination, state, or style to find matching itineraries.</p>
          <div className="relative flex items-center bg-white dark:bg-surface-container-high border border-outline-variant/60 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
            <span className="material-symbols-outlined text-outline mr-2 text-[22px]">search</span>
            <input 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              className="bg-transparent border-none text-on-surface text-sm focus:ring-0 outline-none w-full p-0" 
              placeholder="Search destination, e.g. Ladakh, beach..." 
              type="text" 
            />
            <button 
              onClick={doSearch}
              className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-surface-tint transition-all cursor-pointer border-none ml-2"
            >
              Search
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-slate-800 text-lg">
            {searchVal 
              ? `Found ${filteredTrips.length} departures matching "${searchVal}"` 
              : `Showing all ${filteredTrips.length} departures`}
          </h2>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <div key={trip.id} className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 hover:shadow-lg transition-all duration-300 group flex flex-col h-full trip-card">
              <div className="relative h-48 w-full overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={trip.name} src={trip.img} />
                <div className="absolute top-3 left-3 bg-primary text-on-primary px-3 py-1 rounded-md font-label-sm text-label-sm shadow-sm backdrop-blur-md bg-opacity-90 font-bold">{trip.style}</div>
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

export default Search
