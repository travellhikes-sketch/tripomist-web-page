import React, { useState, useEffect } from 'react'
import ReadMoreText from '../components/ReadMoreText'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DestinationSearch from '../components/DestinationSearch'
import Footer from '../components/Footer'

function International() {
  const location = useLocation()
  const [filter, setFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const trips = [
    {
      id: "Rishikesh Retreat",
      name: "Rishikesh Retreat",
      duration: "1N/2D",
      desc: "Experience the serenity of the Ganges with yoga, light trekking, and riverside camping.",
      price: 4500,
      img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
    },
    {
      id: "Jaipur Heritage",
      name: "Jaipur Heritage",
      duration: "2N/3D",
      desc: "Explore majestic forts, vibrant markets, and royal palaces in the Pink City.",
      price: 6200,
      img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
    },
    {
      id: "Kasol Escape",
      name: "Kasol Escape",
      duration: "2N/3D",
      desc: "Unwind in the scenic Parvati Valley with gentle hikes and peaceful cafe culture.",
      price: 5800,
      img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
    }
  ]

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('search') || params.get('query') || ''
    if (q) setSearchQuery(q)
  }, [location])

  const filteredTrips = trips.filter(t => {
    if (filter !== 'All' && t.duration !== filter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
          alt="International trips"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            International Tour Packages
          </h1>
        </div>

        
      </section>

      {/* About Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
          About International Tour Packages
        </h2>
        <ReadMoreText text="What if we say to you that there's a place wherein the clouds came down to greet the mountains, where rivers whisper the old secrets, and where time slows down just to make you able to take it all in? Explore the world's most magical places, waiting for you to discover their untouched beauty." />
        
        
      </section>

      {/* Grid Section */}
      <main className="max-w-6xl mx-auto px-4 pb-36 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <Link key={trip.id} to={`/itinerary/${trip.name.toLowerCase().replace(/\s+/g, '-')}`} className="glass-card rounded-[1.5rem] overflow-hidden group relative hover:shadow-[0_10px_25px_-5px_rgba(14,165,233,0.15)] transition-all duration-300 transform hover:-translate-y-2 flex flex-col no-underline">
              <div className="h-48 relative overflow-hidden">
                <img alt={trip.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={trip.img} />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md font-label-sm text-label-sm text-primary font-bold uppercase">{trip.duration}</div>
              </div>
              <div className="p-6 flex flex-col flex-grow glass-reveal">
                <h3 className="font-headline-md text-headline-md mb-2 font-bold group-hover:text-primary transition-colors text-on-surface">{trip.name}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">{trip.desc}</p>
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

export default International
