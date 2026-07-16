import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DestinationSearch from '../components/DestinationSearch'
import Footer from '../components/Footer'
import PackageCard from '../components/PackageCard'

function FeaturedGroupTrip() {
  const location = useLocation()
  const [activeStyle, setActiveStyle] = useState('All')
  const [favoritesFilter, setFavoritesFilter] = useState(false)

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

  }, [location])

  const toggleFavorite = (id) => {
    setTripsList(prev => prev.map(t => t.id === id ? { ...t, isFav: !t.isFav } : t))
  }

  const filteredTrips = tripsList.filter(trip => {
    if (trip.style === 'International Trips') return false
    if (activeStyle !== 'All' && trip.style !== activeStyle) return false
    if (favoritesFilter && !trip.isFav) return false
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

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=1200&q=80"
          alt="Featured Group Trips"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Featured Group Trips
          </h1>
        </div>
      </section>



      {/* Main Content Layout */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12">

        

        
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
              link={`/itinerary/${trip.name.toLowerCase().replace(/\s+/g, '-')}`} 
              blueText={true}
              badge="Featured Trip"
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default FeaturedGroupTrip
