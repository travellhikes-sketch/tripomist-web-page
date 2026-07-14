import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DestinationSearch from '../components/DestinationSearch'
import Footer from '../components/Footer'

function UpcomingTrips() {
  const location = useLocation()
  const [filter, setFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const trips = [
    {
      id: "Rishikesh Retreat",
      name: "Rishikesh Retreat",
      duration: "1N/2D",
      rating: 4.9,
      desc: "Yoga, white water rafting, and spiritual Ganga Aarti under the stars.",
      price: 5499,
      bestSeller: true,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdeK5rNXK2i1b9n6OjyVoqm3Bxp8LEe74ptA6ncV2vP0x3Mi3B8HxlbdKEmQm91XCHfRR1kMKAQPDSbdqUrKDW4JM3xypx1fRMk3V2CB8LGMsnDVcKS_UZfnZcEYkmv5SROPXh2Y_cNDIOvWufVrH-JjvgMbmJ5A7_AgOyZUaA-BJA08GG7r2s0bw9GaqDO4QlU2W62kMiK6U1woPfrvgioGY_Glgx-Ig1A4Io0qyEemYXHUM9K9ujeQRoKgUEMoYyknVTGzgYBeRs"
    },
    {
      id: "Jaipur Heritage",
      name: "Jaipur Heritage",
      duration: "2N/3D",
      rating: 4.7,
      desc: "Explore royal palaces, vibrant bazaars, and legendary Rajasthani cuisine.",
      price: 6200,
      bestSeller: false,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRwnZMqN75wiCGdYCe57bjOJqnQL8ixU9e0QsmbQNBMgQzcZ2tX7BX4tDAqoU8FUgUqp1QPoAzbFcQOY9cjylZmNqpl5HPNriyb50-N7uufQaF7nEz0ciYQP-JVZh7E3rmaaaAtn1HmSbpnGnuSdDky0eOIAvJ7SS5YCQ1I-SURRXNSHrCdOdyeLAeYoMGSKuIszmp7kQygPsJ19kxjBKCrAAjCB-nASur3eTy47RWuE18brwHmoxgNO2fM_WsfO8iaSUnvytThry-"
    },
    {
      id: "Kasol Escape",
      name: "Kasol Escape",
      duration: "2N/3D",
      rating: 4.8,
      desc: "Trek to Kheerganga and experience the scenic Parvati Valley landscape.",
      price: 4999,
      bestSeller: false,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoJR3BpNyP1i1mPJq3X3jHeXOGmBJ_nQl0snOauAWZkJyJOg4Qba33jURx3B9X94_hsmX9bQh19tDtOJfrT3q37LwYx1Wk_xHMqdEMpCT-wV0fYyopsVjDHjfEIAByBgaDpOOK4g7rOmJx9hzCkMHvbE5VLyDYJYys6hvDlZDthNmF-hNbppnYt9xZRw2g5SDGcNW0_VtWjgiCuQXPg2kY1pF1L1cJHMQ_NyzQ3t5UBG48pm5tsjfp5ydUvO2rOmPvEZgATszcYDG-"
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
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[614px] min-h-[450px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAoig9UuwC8usJJWO11p5-rBPc2lAoDBEgo5rYncjC-BmJviaXxlD3KbNQEOyBoBey8QJU6e_wCMavGLuvdQfGVEz_gIAOQreu5i7lytC3nE0uOdiSA-EpVqogPc5qFRMwoDc7ErdXnQt1kjyt6u239J1S7PD7aeG-xRHyu6Y0O1hFlntUxh4xDwydAwThMayHfR2veQh_quYAJus3GLjd8gMKwFZpKuWmgr8UvExYvu_5EvTO07wkuFHKwJSAGvzOaLy_6IZnbOEcE')" }}></div>
            <div className="absolute inset-0 bg-inverse-surface/40 backdrop-brightness-75"></div>
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl flex flex-col items-center">
            <h1 className="font-display-lg text-display-lg text-white mb-md font-bold">Upcoming Trips</h1>
            <p className="font-body-lg text-body-lg text-white/90 max-w-2xl mx-auto mb-6">Discover the perfect short escapes with like-minded travelers. Expertly curated itineraries designed for adventure and connection.</p>
            
            {/* Filter and Search Controls */}
            <div className="flex flex-col items-center justify-center gap-4 mt-8 w-full max-w-md">


              {/* Search input field */}
              <div className="relative flex items-center bg-white border border-outline-variant/60 rounded-xl px-4 py-2.5 w-full shadow-md focus-within:ring-2 focus-within:ring-primary/20">
                <span className="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-on-surface text-sm focus:ring-0 outline-none w-full p-0" 
                  placeholder="Search upcoming trips..." 
                  type="text" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Grid Section */}
        <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md lg:gap-lg">
            {filteredTrips.map(trip => (
              <div key={trip.id} className="group bg-surface-container-lowest rounded-[1.5rem] overflow-hidden border border-outline-variant/20 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 trip-card flex flex-col">
                <div className="relative h-64 overflow-hidden">
                  <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={trip.name} src={trip.img} />
                  {trip.bestSeller && (
                    <div className="absolute top-sm right-sm">
                      <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-label-sm font-label-sm text-primary font-bold">BEST SELLER</span>
                    </div>
                  )}
                  <div className="absolute top-sm left-sm">
                    <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-label-sm font-label-sm uppercase font-bold">{trip.duration}</span>
                  </div>
                </div>
                <div className="p-md flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-xs gap-2">
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold group-hover:text-primary transition-colors">{trip.name}</h3>
                    <div className="flex items-center gap-1 text-primary shrink-0">
                      <span className="material-symbols-outlined text-[18px]">star</span>
                      <span className="text-label-sm font-label-sm font-bold">{trip.rating}</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant font-body-md text-body-md mb-md flex-grow">{trip.desc}</p>
                  <div className="flex justify-between items-center mt-auto pt-md border-t border-outline-variant/10">
                    <div>
                      <span className="text-label-sm font-label-sm text-outline block uppercase tracking-wider">Starting from</span>
                      <span className="text-headline-md font-bold text-primary">₹{trip.price.toLocaleString('en-IN')}</span>
                    </div>
                    <Link to={`/checkout?trip=${encodeURIComponent(trip.name)}&price=${trip.price}`} className="bg-primary text-white hover:bg-surface-tint px-5 py-2.5 rounded-xl transition-all font-semibold active:scale-95 no-underline flex items-center">Book Now</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default UpcomingTrips
