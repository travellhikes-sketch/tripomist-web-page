import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function WeekendTrips() {
  const location = useLocation()
  const [filter, setFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const trips = [
    {
      id: "Rishikesh Retreat",
      name: "Rishikesh Retreat",
      duration: "1N/2D",
      desc: "Experience the serenity of the Ganges with yoga, light trekking, and riverside camping.",
      price: 4500,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoS-vg_XCH-xHOowgbNVmjJoAj5bJzHN-NPmV15QY-39UHQ4IJCCau_MiOWaK22x0EQGXjpHPcG2QGgkKDzSYzBJx8NUxIR9YhsWYoHhlYXkLlrJCpNeIP2t-yraYqChgdzbvZ0nGOLpUJ0VddALLKLT6LTp-ubk4ne5mb3HfmzUjVL-QQSjGtWIWjpx5VSNdg8NsWROo7n0GwTuaQ34eUIF46J9WrGRE7AQv48QIDQEQ00msw8gCETVFWwU1ocB7f_cNGaUtJoHbC"
    },
    {
      id: "Jaipur Heritage",
      name: "Jaipur Heritage",
      duration: "2N/3D",
      desc: "Explore majestic forts, vibrant markets, and royal palaces in the Pink City.",
      price: 6200,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIbezhhDn6kVeW-bPt5ihoXXxovwztmJdRitP6cpomnc6_qKxsrtuE2LhA1aSGmpzTbQudel1DreoXcgnvtkKQmeiBfKJxvofcpCiS7qc3FXI_lccCF_1b6rvlVhBJtMrR9emJS43N7lV6K_Z7QZdUbbi1FPjn0tzA8AdHDWSxhkSh2XuAh2cU1EryOd0XjSy5tm_OJig6fy7VhWecFwm4iaMhwI5EKYwed_ZTIbb8bKGhuZNTjk3Gy2rmZQ44qUr6PyNBUCW1JWs1"
    },
    {
      id: "Kasol Escape",
      name: "Kasol Escape",
      duration: "2N/3D",
      desc: "Unwind in the scenic Parvati Valley with gentle hikes and peaceful cafe culture.",
      price: 5800,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgL7yO6p43o1i054rIF_OdRwkt9E0P7hMyeB6NFyOy2o5oP-iEfAu5VOXXj0dJwSfmmHayKsaBdsqjzBCCh6ubtd1OKaawRppWYX17Gzeu0-Sv7lPMFcNqaocrNbrvF17LuiLKZe5DXB9_Kd79Tkt1qu6U2vzOv0I1Q67Lg00tvJ1l0X70b1XkJXKviwSlXqAvAotXrB5taNSnfDXZsS-xo17TS1ugN4jzzPPbD8CO-gdnG6u9TTfVkAoAe41xxdMvAitdhXP0CfY8"
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

      <main className="flex-grow flex flex-col items-center w-full bg-background">
        {/* Hero Section */}
        <section className="w-full relative py-xl px-4 md:px-8 flex justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="bg-cover bg-center w-full h-full opacity-20" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA2SFGiuFvySMpzkeJ4qNwJezyFqN7ciVYRXuCKlhd7u9-DT1sfv1FvXiLjqnwIkMJDBletWJ8BCG-Vawhmo8JDI8b18zIQPCZiMUDWVyCxUCIsp5fd5s555fiSiQh13eezdGEOTWDdUJvRz3ZYS9lcf6pTan0rPHCIL2wxmioKnE2E_Cg_i50WFubokMPo3KK93vpGsDfBPdgXb8bNdpkBvLI5swdQv6JDfulqq2NuORk-UfFcaNAysvkzqFWLehEQ2UY5A_acGyIv')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background"></div>
          </div>
          <div className="relative z-10 max-w-7xl w-full flex flex-col items-center text-center gap-6">
            <h1 className="font-display-lg text-display-lg md:font-display-lg text-primary font-bold">Weekend Trips</h1>
            <p className="font-body-lg text-body-lg max-w-2xl text-on-surface-variant">Discover quick, refreshing getaways. Perfect for recharging your spirit without the need for long planning.</p>
            
            {/* Filter and Search Layout */}
            <div className="flex flex-col items-center justify-center gap-4 mt-8 w-full max-w-md">
              <div className="glass-card p-4 rounded-xl flex flex-wrap gap-4 justify-center items-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant mr-2">Duration:</span>
                <button 
                  onClick={() => setFilter('All')} 
                  className={`px-5 py-2 rounded-lg font-body-md transition-all duration-200 cursor-pointer ${filter === 'All' ? 'bg-primary text-white shadow-sm border-none' : 'bg-white border border-outline-variant/40 text-on-surface-variant hover:border-primary/50 hover:text-primary'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilter('1N/2D')} 
                  className={`px-5 py-2 rounded-lg font-body-md transition-all duration-200 cursor-pointer ${filter === '1N/2D' ? 'bg-primary text-white shadow-sm border-none' : 'bg-white border border-outline-variant/40 text-on-surface-variant hover:border-primary/50 hover:text-primary'}`}
                >
                  1N/2D
                </button>
                <button 
                  onClick={() => setFilter('2N/3D')} 
                  className={`px-5 py-2 rounded-lg font-body-md transition-all duration-200 cursor-pointer ${filter === '2N/3D' ? 'bg-primary text-white shadow-sm border-none' : 'bg-white border border-outline-variant/40 text-on-surface-variant hover:border-primary/50 hover:text-primary'}`}
                >
                  2N/3D
                </button>
              </div>

              {/* Search input field */}
              <div className="relative flex items-center bg-white border border-outline-variant/60 rounded-xl px-4 py-2.5 w-full shadow-md focus-within:ring-2 focus-within:ring-primary/20">
                <span className="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-on-surface text-sm focus:ring-0 outline-none w-full p-0" 
                  placeholder="Search weekend trips by destination..." 
                  type="text" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Grid Section */}
        <section className="w-full max-w-7xl px-4 md:px-8 py-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filteredTrips.map(trip => (
            <div key={trip.id} className="glass-card rounded-[1.5rem] overflow-hidden group relative hover:shadow-[0_10px_25px_-5px_rgba(14,165,233,0.15)] transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
              <div className="h-48 relative overflow-hidden">
                <img alt={trip.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={trip.img} />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md font-label-sm text-label-sm text-primary font-bold uppercase">{trip.duration}</div>
              </div>
              <div className="p-6 flex flex-col flex-grow glass-reveal">
                <h3 className="font-headline-md text-headline-md mb-2 font-bold group-hover:text-primary transition-colors">{trip.name}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">{trip.desc}</p>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/20">
                  <span className="font-headline-md text-headline-md text-primary font-bold">₹{trip.price.toLocaleString('en-IN')}</span>
                  <div className="flex gap-2">
                    <Link to={`/itinerary/${trip.id.toLowerCase().replace(/\s+/g, '-')}`} className="border border-outline-variant hover:border-primary hover:text-primary px-3 py-1.5 rounded-lg text-sm transition-colors no-underline text-on-surface flex items-center">Itinerary</Link>
                    <Link to={`/checkout?trip=${encodeURIComponent(trip.name)}&price=${trip.price}`} className="bg-primary text-white px-4 py-1.5 rounded-lg font-label-sm text-label-sm hover:opacity-95 transition-opacity font-bold no-underline flex items-center">Book Now</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default WeekendTrips
