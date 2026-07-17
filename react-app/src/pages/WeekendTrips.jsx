import React, { useState, useEffect } from 'react'
import PackageCard from '../components/PackageCard'
import ReadMoreText from '../components/ReadMoreText'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../supabaseClient'

export default function WeekendTrips() {
  const [tripsList, setTripsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase
        .from('Pakage')
        .select('*');
      
      if (error) {
        console.error('Error fetching packages:', error);
      } else {
        const activePackages = data.filter(pkg => pkg.status && pkg.status.includes('active'));
        // Try to filter by specific logic if matches, else fallback to all active
        let categoryPackages = activePackages.filter(pkg => pkg.duration && (pkg.duration.includes('1N') || pkg.duration.includes('2N') || pkg.duration.includes('3N')));
        if (categoryPackages.length === 0) categoryPackages = activePackages; // Fallback if no specific packages found
        
        const mappedTrips = categoryPackages.map(pkg => ({
          id: pkg.id,
          name: pkg.title,
          location: pkg.destination || pkg.state,
          style: pkg.category === 'International' ? 'International Trips' : 'Domestic Trips',
          durationText: pkg.duration,
          price: pkg.price,
          isFav: false,
          tagline: pkg.short_description ? pkg.short_description.substring(0, 80) + '...' : pkg.title,
          img: pkg.image_url || pkg.banner_image
        }));
        setTripsList(mappedTrips);
      }
      setLoading(false);
    }
    fetchPackages();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80"
          alt="Weekend Departures"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Weekend Departures
          </h1>
        </div>
      </section>

      {/* About Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <div className="flex-1">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
            About Weekend Departures
          </h2>
          <ReadMoreText text="Short on time but big on wanderlust? Our Weekend Departures are designed for the perfect quick getaway to refresh and recharge your spirit without the hassle of long planning." />
        </div>
      </section>

      {/* Destinations Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-36 w-full flex-grow">
        {loading ? (
           <p className="text-center font-bold text-primary mt-10">Loading packages...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tripsList.map((dest) => (
              <PackageCard 
                key={dest.id}
                tripTitle={dest.name} 
                price={"₹" + dest.price.toLocaleString('en-IN')}
                duration={dest.durationText} 
                description={dest.tagline}
                bg={dest.img}
                link={`/itinerary/${dest.id}`} 
                blueText={true}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
