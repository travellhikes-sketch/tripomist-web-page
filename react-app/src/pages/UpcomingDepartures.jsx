import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ReadMoreText from '../components/ReadMoreText'

const allDestinations = [
  // Domestic
  {
    id: 'srinagar', name: 'Srinagar', tagline: 'Paradise on Earth', duration: '4N/5D', price: 15999,
    img: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600&q=80',
    tags: ['Dal Lake', 'Houseboat', 'Scenic'], type: 'domestic'
  },
  {
    id: 'kerala-backwaters', name: 'Kerala Backwaters', tagline: 'God\'s Own Country', duration: '5N/6D', price: 18999,
    img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80',
    tags: ['Houseboat', 'Nature', 'Relax'], type: 'domestic'
  },
  {
    id: 'ladakh', name: 'Ladakh', tagline: 'Land of High Passes', duration: '6N/7D', price: 24999,
    img: 'https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=600&q=80',
    tags: ['Mountains', 'Adventure', 'Monasteries'], type: 'domestic'
  },
  // International
  {
    id: 'bali', name: 'Bali', tagline: 'Island of the Gods', duration: '5N/6D', price: 35000,
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
    tags: ['Beaches', 'Culture', 'Relax'], type: 'international'
  },
  {
    id: 'dubai', name: 'Dubai', tagline: 'City of Gold', duration: '4N/5D', price: 42000,
    img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
    tags: ['Desert', 'Shopping', 'Luxury'], type: 'international'
  },
  {
    id: 'singapore', name: 'Singapore', tagline: 'Lion City', duration: '4N/5D', price: 38000,
    img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80',
    tags: ['City', 'Modern', 'Food'], type: 'international'
  }
];

export default function UpcomingDepartures() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredDestinations = allDestinations.filter(dest => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Domestic trips') return dest.type === 'domestic';
    if (activeFilter === 'International trips') return dest.type === 'international';
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80"
          alt="Upcoming Departures"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            See Upcoming Departures
          </h1>
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
          About Upcoming Departures
        </h2>
        <ReadMoreText text="Ready for your next adventure? Browse our upcoming departures to find the perfect trip. Whether you're looking for a quick domestic getaway or a grand international tour, we have carefully curated experiences waiting just for you." />
        
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-3 mt-8">
          {['All', 'Domestic trips', 'International trips'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-full border text-sm font-semibold transition-all cursor-pointer ${
                activeFilter === filter 
                  ? 'bg-primary text-white border-primary shadow-md scale-105' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-36 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((dest) => (
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
