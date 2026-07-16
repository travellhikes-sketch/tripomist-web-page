import React, { useState } from 'react'
import PackageCard from '../components/PackageCard'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DestinationSearch from '../components/DestinationSearch'

const destinations = [
  {
    id: 'havelock',
    name: 'Havelock Island',
    tagline: 'Pristine White Sands',
    duration: '4N/5D',
    price: 16999,
    img: 'https://images.unsplash.com/photo-1596489370605-649faaaeb5c5?w=600&q=80',
    tags: ['Beaches', 'Scuba Diving', 'Relax'],
  },
  {
    id: 'port-blair',
    name: 'Port Blair',
    tagline: 'Historical Capital',
    duration: '3N/4D',
    price: 10999,
    img: 'https://images.unsplash.com/photo-1588691517409-f6ef7d3910c2?w=600&q=80',
    tags: ['History', 'Cellular Jail', 'Islands'],
  }
]

export default function Andaman() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';

  const filteredDestinations = destinations.filter(dest => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return dest.name.toLowerCase().includes(q) || 
           dest.tagline.toLowerCase().includes(q) || 
           dest.tags.some(tag => tag.toLowerCase().includes(q))
  })

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

            {/* Hero */}
      <section className="relative w-full h-72 md:h-96 flex items-end pb-10 px-6 md:px-12 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1596489370605-649faaaeb5c5?w=1200&q=80"
          alt="Andaman Islands"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden md:flex relative w-full items-end justify-between">
            <div className="w-1/3">
              <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore India</p>
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">Andaman & Nicobar</h1>
              <p className="text-white/80 mt-2 text-base">Tropical paradise — dive into azure waters and historical legacy.</p>
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-[400px]">
              <DestinationSearch 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Andaman packages..."
              />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col gap-6">
            <div>
              <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore India</p>
              <h1 className="text-white text-4xl font-bold leading-tight">Andaman & Nicobar</h1>
              <p className="text-white/80 mt-2 text-base">Tropical paradise — dive into azure waters and historical legacy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <main className="max-w-6xl mx-auto px-4 py-10 w-full pb-36">
        <h2 className="text-2xl font-bold text-on-surface mb-6">Top Destinations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((dest) => (
            <PackageCard 
              key={dest.id}
              tripTitle={dest.name} 
              price={"₹" + dest.price.toLocaleString()}
              duration={dest.duration} 
              description={dest.tagline}
              bg={dest.img}
              link={`/itinerary/${dest.name.toLowerCase().replace(/\s+/g, '-')}`} 
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

