import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const destinations = [
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    tagline: 'Yoga Capital of the World',
    duration: '3N/4D',
    price: 8999,
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    tags: ['Adventure', 'Spiritual', 'River Rafting'],
  },
  {
    id: 'nainital',
    name: 'Nainital',
    tagline: 'Lake District of India',
    duration: '2N/3D',
    price: 6499,
    img: 'https://images.unsplash.com/photo-1612438214708-f428a707bf64?w=600&q=80',
    tags: ['Lakes', 'Hill Station', 'Nature'],
  },
  {
    id: 'auli',
    name: 'Auli',
    tagline: 'Skiing Destination of India',
    duration: '4N/5D',
    price: 14999,
    img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80',
    tags: ['Skiing', 'Snow', 'Mountains'],
  },
  {
    id: 'kedarnath',
    name: 'Kedarnath',
    tagline: 'Sacred Himalayan Shrine',
    duration: '3N/4D',
    price: 11999,
    img: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&q=80',
    tags: ['Pilgrimage', 'Trekking', 'Spiritual'],
  },
  {
    id: 'mussoorie',
    name: 'Mussoorie',
    tagline: 'Queen of Hill Stations',
    duration: '2N/3D',
    price: 7499,
    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
    tags: ['Hill Station', 'Waterfall', 'Scenic'],
  },
  {
    id: 'valley-of-flowers',
    name: 'Valley of Flowers',
    tagline: 'UNESCO World Heritage Trek',
    duration: '5N/6D',
    price: 16999,
    img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80',
    tags: ['Trek', 'UNESCO', 'Flowers'],
  },
]

export default function Uttarakhand() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero */}
      <section className="relative w-full h-72 md:h-96 flex items-end pb-10 px-6 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80"
          alt="Uttarakhand mountains"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10">
          <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore India</p>
          <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">Uttarakhand</h1>
          <p className="text-white/80 mt-2 text-base max-w-md">Dev Bhoomi — Land of Gods. Mountains, rivers, and spiritual energy await you.</p>
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
                    Book Now
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
