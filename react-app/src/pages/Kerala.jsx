import React, { useState } from 'react'
import PackageCard from '../components/PackageCard'
import ReadMoreText from '../components/ReadMoreText'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DestinationSearch from '../components/DestinationSearch'

const destinations = [
  {
    id: 'shillong',
    name: 'Shillong',
    tagline: 'Scotland of the East',
    duration: '4N/5D',
    price: 13999,
    img: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=600&q=80',
    tags: ['Waterfalls', 'Culture', 'Nature'],
  },
  {
    id: 'cherrapunji',
    name: 'Cherrapunji',
    tagline: 'Living Root Bridges',
    duration: '2N/3D',
    price: 8999,
    img: 'https://images.unsplash.com/photo-1596700767223-28956e545465?w=600&q=80',
    tags: ['Rain', 'Caves', 'Forests'],
  }
]

export default function Kerala() {
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

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src={destinations[0]?.img || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80"}
          alt="Kerala mountains"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Kerala Tour Packages
          </h1>
        </div>

        
      </section>

      {/* About Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <div className="flex-1">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
            About Kerala Tour Packages
          </h2>
          <ReadMoreText text="What if we say to you that there's a place wherein the clouds came down to greet the mountains, where rivers whisper the old secrets, and where time slows down just to make you able to take it all in? Kerala is that magical place, waiting for you to explore its untouched beauty." />
        </div>
      </section>

      {/* Destinations Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-36 w-full">
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

