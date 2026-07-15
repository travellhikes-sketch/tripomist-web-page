import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DestinationSearch from '../components/DestinationSearch'

const destinations = [
  {
    id: 'leh',
    name: 'Leh',
    tagline: 'Land of High Passes',
    duration: '5N/6D',
    price: 18999,
    img: 'https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=600&q=80',
    tags: ['Mountains', 'Biking', 'Monasteries'],
  },
  {
    id: 'pangong',
    name: 'Pangong Lake',
    tagline: 'Azure Blue Waters',
    duration: '2N/3D',
    price: 9999,
    img: 'https://images.unsplash.com/photo-1629858711802-e0c52f1b4028?w=600&q=80',
    tags: ['Lake', 'Camping', 'Scenic'],
  }
]

export default function Ladakh() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

            {/* Hero */}
      <section className="relative w-full h-72 md:h-96 flex items-end pb-10 px-6 md:px-12 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1200&q=80"
          alt="Ladakh"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden md:flex relative w-full items-end justify-between">
            <div className="w-1/3">
              <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore India</p>
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">Ladakh</h1>
              <p className="text-white/80 mt-2 text-base">The stark beauty of high-altitude deserts and serene lakes.</p>
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-[400px]">
              <DestinationSearch />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col gap-6">
            <div>
              <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore India</p>
              <h1 className="text-white text-4xl font-bold leading-tight">Ladakh</h1>
              <p className="text-white/80 mt-2 text-base">The stark beauty of high-altitude deserts and serene lakes.</p>
            </div>
            <div className="w-full">
              <DestinationSearch />
            </div>
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <main className="max-w-6xl mx-auto px-4 py-10 w-full pb-36">
        <h2 className="text-2xl font-bold text-on-surface mb-6">Top Destinations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              to={`/checkout?destination=${dest.id}&name=${encodeURIComponent(dest.name)}&price=${dest.price}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  {dest.duration}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-on-surface">{dest.name}</h3>
                <p className="text-on-surface-variant text-sm mt-0.5">{dest.tagline}</p>
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
