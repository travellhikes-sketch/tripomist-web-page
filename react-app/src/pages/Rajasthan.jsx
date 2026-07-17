import React, { useState, useEffect } from 'react'
import PackageCard from '../components/PackageCard'
import { supabase } from '../supabaseClient'
import ReadMoreText from '../components/ReadMoreText'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DestinationSearch from '../components/DestinationSearch'

export default function Rajasthan() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';

  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPackages() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Pakage')
          .select('*')
          .eq('state', 'Rajasthan')
          .eq('status', 'active');
        
        if (error) throw error;
        setDestinations(data || []);
      } catch (err) {
        console.error("Error fetching packages:", err);
        setError("Failed to load packages. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  const filteredDestinations = destinations.filter(dest => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return dest.title?.toLowerCase().includes(q) || 
           dest.short_description?.toLowerCase().includes(q) || 
           dest.destination?.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80"
          alt="Rajasthan mountains"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Rajasthan Tour Packages
          </h1>
        </div>
      </section>

      {/* About Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <div className="flex-1">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
            About Rajasthan Tour Packages
          </h2>
          <ReadMoreText text="What if we say to you that there's a place wherein the clouds came down to greet the mountains, where rivers whisper the old secrets, and where time slows down just to make you able to take it all in? Rajasthan is that magical place, waiting for you to explore its untouched beauty." />
        </div>
      </section>

      {/* Destinations Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-36 w-full">
        {loading ? (
          <div className="text-center py-10 font-medium text-gray-500">Loading packages...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10 font-medium">{error}</div>
        ) : filteredDestinations.length === 0 ? (
          <div className="text-center text-gray-500 py-10 font-medium">No active packages found for Rajasthan.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((dest) => (
              <PackageCard 
                  key={dest.id}
                  tripTitle={dest.title} 
                  price={"₹" + Number(dest.price).toLocaleString('en-IN')}
                  originalPrice={dest.original_price ? "₹" + Number(dest.original_price).toLocaleString('en-IN') : null}
                  discountText={dest.discount_text}
                  bestSeller={dest.best_seller}
                  duration={dest.duration} 
                  bg={dest.image_url}
                  link={`/itinerary/${dest.slug}`} 
                  label={dest.destination}
                  className=""
                />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
