import React, { useState, useEffect } from 'react'
import ReadMoreText from '../components/ReadMoreText'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DestinationSearch from '../components/DestinationSearch'
import Footer from '../components/Footer'
import PackageCard from '../components/PackageCard'

function International() {
  const location = useLocation()
  const [filter, setFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const trips = [
    {
      id: "almaty",
      name: "Almaty",
      duration: "5N/6D",
      desc: "Experience the magic of Central Asia.",
      price: "₹54,999",
      img: "https://images.unsplash.com/photo-1558588825-450f38b1d9df?w=800&q=80"
    },
    {
      id: "kazakhstan",
      name: "Kazakhstan",
      duration: "5N/6D",
      desc: "Discover beautiful landscapes and culture.",
      price: "₹56,999",
      img: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=80"
    },
    {
      id: "thailand",
      name: "Thailand",
      duration: "6N/7D",
      desc: "Explore vibrant beaches and culture.",
      price: "₹41,999",
      img: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80"
    },
    {
      id: "bali",
      name: "Bali",
      duration: "6N/7D",
      desc: "Relax on pristine tropical beaches.",
      price: "₹51,999",
      img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80"
    },
    {
      id: "vietnam",
      name: "Vietnam",
      duration: "5N/6D",
      desc: "Explore breathtaking bays and historic cities.",
      price: "₹56,999",
      img: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80"
    },
    {
      id: "dubai",
      name: "Dubai",
      duration: "5N/6D",
      desc: "Experience luxury and modern marvels.",
      price: "₹62,999",
      img: "https://images.unsplash.com/photo-1512453979436-5a5336f33d7b?w=800&q=80"
    },
    {
      id: "philippines",
      name: "Philippines",
      duration: "8N/9D",
      desc: "Discover beautiful islands and lagoons.",
      price: "₹75,999",
      img: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80"
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
      <main className="max-w-6xl mx-auto px-4 pb-36 w-full mt-10">
        <h2 className="text-3xl font-bold mb-8 text-center text-on-surface">Soon you can plan abroad trips with us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <PackageCard 
              key={trip.id} 
              tripTitle={trip.name} 
              price={trip.price} 
              duration={trip.duration} 
              bg={trip.img} 
              link="#"
              badge="Coming Soon"
              label='International' 
              blueText={true} 
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default International
