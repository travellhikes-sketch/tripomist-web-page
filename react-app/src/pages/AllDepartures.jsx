import React from 'react'
import ReadMoreText from '../components/ReadMoreText'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DestinationSearch from '../components/DestinationSearch'

const destinations = [
  {
    id: 'srinagar',
    name: 'Srinagar',
    tagline: 'Paradise on Earth',
    duration: '4N/5D',
    price: 15999,
    img: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600&q=80',
    tags: ['Dal Lake', 'Houseboat', 'Scenic'],
  },
  {
    id: 'gulmarg',
    name: 'Gulmarg',
    tagline: 'Heartland of Winter Sports',
    duration: '3N/4D',
    price: 12999,
    img: 'https://images.unsplash.com/photo-1606822230495-25e4c07fc738?w=600&q=80',
    tags: ['Snow', 'Gondola', 'Adventure'],
  }
]

export default function AllDepartures() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src={destinations[0]?.img || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80"}
          alt="All Departures"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            All Departures
          </h1>
        </div>

        
      </section>

      {/* About Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
          About All Departures Tour Packages
        </h2>
        <ReadMoreText text="What if we say to you that there's a place wherein the clouds came down to greet the mountains, where rivers whisper the old secrets, and where time slows down just to make you able to take it all in? All Departures is that magical place, waiting for you to explore its untouched beauty." />
        
        
      </section>

      {/* Destinations Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-36 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              to={`/itinerary/${dest.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline flex flex-col"
            >
              <div className="relative h-48 overflow-hidden shrink-0">
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  {dest.duration}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-on-surface">{dest.name}</h3>
                <p className="text-on-surface-variant text-sm mt-0.5 flex-grow">{dest.tagline}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {dest.tags.map((t) => (
                    <span key={t} className="text-[11px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className="text-xs text-on-surface-variant">Starting from</span>
                    <p className="text-primary font-bold text-lg">₹{dest.price.toLocaleString()}</p>
                  </div>
                  <span className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl group-hover:bg-primary/90 transition-colors">
                    View Detail
                  </span>
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
