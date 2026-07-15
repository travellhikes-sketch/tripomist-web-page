import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Search() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')
  const [tripsList, setTripsList] = useState([
    {
      id: "ladakh-expedition",
      name: "Ladakh Expedition",
      style: "Mountains",
      durationText: "6N/7D",
      price: 21999,
      isFav: false,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCE6p_UF0GujYyL7QDuZtoqzEShR-1wG1cgQi_O9hq38FgS581MFo2tgdKmqcWlbrQv9BdUpqpfR3vThFmanWNkaQRl4F0B3TKW2esN658tI0CjH-96Uh4B0SFJGOihOlNRXGuNeTj7DuNQKJh7n4WL1N1nlIj9od50ycbUf85JmEIJnOVNdc--S1p5-ZvcYwdCh35eyB9Y9_0MF0m9e0LoIC9-kWldVdViKnfzZc-H1YQF1JrBHOfUx0TWmgKVKuqtnJQv7mNresai"
    },
    {
      id: "andaman-escape",
      name: "Andaman Escape",
      style: "Beaches",
      durationText: "4N/5D",
      price: 18500,
      isFav: false,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0y5u9i_7N2laNOZIxv71RdSK5FT0jAp-uHjMwYERiu8PA0f5ZIXZzTW4mDV5pXzsldIlhzXyCWnP5ZeVmWrNzZA04wZjrXsqBFScmOmKAtCHvpCFb6K2d2clvgPz9CbpDVnYeY-R0F5Gqy6VwxCes6qYo50J7xDRpzrnraZxMnW3TIp8XWLoxy3IC28IqbylRrXiPfjUP5lIgNX_7uh3ALSCif0KIatU2BLPP981PAZcWg9SUt4geKFkNwyapsLwVn2kD17gLKID1"
    },
    {
      id: "munnar-retreat",
      name: "Munnar Retreat",
      style: "Weekend",
      durationText: "2N/3D",
      price: 8999,
      isFav: false,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCCXUB1XgJi4Y3t-H0p0t5UTLh_BxmzWOe6kQ6O9c_bPnXHeOmV57Psr-R7D3VlYAEeSb8-WFp0w8bVahRCvNnzR2fMlppIEo7n0DZjWXwlGY4PaWsr7zS4rmU4g64wR4hqvvoWbTudriJszYf-C0CCmsgcHn_H5FaXFQ99Nj5-WPugNDzqKW8Tyc3KXyhxW4yhLBrEIf1V8Xo3VDkqA1VgXMiL06W0aDWctLY1-4qYXNgXr9KN6giLlLXGStqXDvP6KxWiRvJVC4J"
    },
    {
      id: "spiti-valley-expedition",
      name: "Spiti Valley Expedition",
      style: "Mountains",
      durationText: "5N/6D",
      price: 24999,
      isFav: false,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDiD2GO7fIb1ciUdWe0odOedfkhJIm1ur64B1iKghZ8eMdF66RoOvQDTrZz1L1nfURfVdMroAzsjyFtv85EjcF8NXBkccIFhdalQolBp9Yar92MT8MtrG9wQGjuK5B7wctNIUhR54TEU7PYNv323Svs0dPfNfV6sfFdjHZinMcri0e9lDmEaHhHTP1F5YA25LoETYvVR1Dnn-8UNP4ShswwHgnmwn3Pw1YqRx1ECDm16ijYYriT-jcGpT9--pyJ_OQkKTc7lwXlnByS"
    },
    {
      id: "rishikesh-retreat",
      name: "Rishikesh Retreat",
      style: "Weekend",
      durationText: "1N/2D",
      price: 5499,
      isFav: false,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdeK5rNXK2i1b9n6OjyVoqm3Bxp8LEe74ptA6ncV2vP0x3Mi3B8HxlbdKEmQm91XCHfRR1kMKAQPDSbdqUrKDW4JM3xypx1fRMk3V2CB8LGMsnDVcKS_UZfnZcEYkmv5SROPXh2Y_cNDIOvWufVrH-JjvgMbmJ5A7_AgOyZUaA-BJA08GG7r2s0bw9GaqDO4QlU2W62kMiK6U1woPfrvgioGY_Glgx-Ig1A4Io0qyEemYXHUM9K9ujeQRoKgUEMoYyknVTGzgYBeRs"
    },
    {
      id: "jaipur-heritage",
      name: "Jaipur Heritage",
      style: "Weekend",
      durationText: "2N/3D",
      price: 6200,
      isFav: false,
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRwnZMqN75wiCGdYCe57bjOJqnQL8ixU9e0QsmbQNBMgQzcZ2tX7BX4tDAqoU8FUgUqp1QPoAzbFcQOY9cjylZmNqpl5HPNriyb50-N7uufQaF7nEz0ciYQP-JVZh7E3rmaaaAtn1HmSbpnGnuSdDky0eOIAvJ7SS5YCQ1I-SURRXNSHrCdOdyeLAeYoMGSKuIszmp7kQygPsJ19kxjBKCrAAjCB-nASur3eTy47RWuE18brwHmoxgNO2fM_WsfO8iaSUnvytThry-"
    }
  ])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('search') || params.get('query') || ''
    setSearchVal(query)
  }, [location])

  const toggleFavorite = (id) => {
    setTripsList(prev => prev.map(t => t.id === id ? { ...t, isFav: !t.isFav } : t))
  }

  const doSearch = () => {
    navigate(`/search?search=${encodeURIComponent(searchVal.trim())}`)
  }

  const filteredTrips = tripsList.filter(trip => {
    const query = searchVal.toLowerCase().trim()
    if (!query) return true
    return trip.name.toLowerCase().includes(query) || trip.style.toLowerCase().includes(query)
  })

  return (
    <div className="text-on-background bg-background font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12">
        {/* Google-like Search Bar Card */}
        <div className="max-w-xl mx-auto mb-12 text-center">
          <h1 className="font-display-lg text-2xl md:text-3xl font-extrabold mb-2 text-on-surface tracking-tight">Search Results</h1>
          <p className="text-on-surface-variant text-sm mb-6">Type destination, state, or style to find matching itineraries.</p>
          <div className="relative flex items-center bg-white dark:bg-surface-container-high border border-outline-variant/60 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
            <span className="material-symbols-outlined text-outline mr-2 text-[22px]">search</span>
            <input 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              className="bg-transparent border-none text-on-surface text-sm focus:ring-0 outline-none w-full p-0" 
              placeholder="Search destination, e.g. Ladakh, beach..." 
              type="text" 
            />
            <button 
              onClick={doSearch}
              className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-surface-tint transition-all cursor-pointer border-none ml-2"
            >
              Search
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-slate-800 text-lg">
            {searchVal 
              ? `Found ${filteredTrips.length} departures matching "${searchVal}"` 
              : `Showing all ${filteredTrips.length} departures`}
          </h2>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <div key={trip.id} className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 hover:shadow-lg transition-all duration-300 group flex flex-col h-full trip-card">
              <div className="relative h-48 w-full overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={trip.name} src={trip.img} />
                <div className="absolute top-3 left-3 bg-primary text-on-primary px-3 py-1 rounded-md font-label-sm text-label-sm shadow-sm backdrop-blur-md bg-opacity-90 font-bold">{trip.style}</div>
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold group-hover:text-primary transition-colors">{trip.name}</h3>
                <div className="flex items-center gap-1 text-on-surface-variant mb-4 mt-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span className="font-body-md text-body-md text-sm">{trip.durationText}</span>
                </div>
                <div className="mt-auto flex items-end justify-between pt-4 border-t border-outline-variant/10">
                  <div>
                    <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider text-[10px]">Starting from</span>
                    <span className="font-headline-md text-headline-md text-primary font-bold">₹{trip.price.toLocaleString('en-IN')}</span>
                  </div>
                  <Link 
                    to={`/checkout?trip=${encodeURIComponent(trip.name)}&price=${trip.price}`} 
                    className="bg-primary text-on-primary px-4 py-2 rounded-lg font-body-md text-body-md font-semibold hover:bg-surface-tint transition-colors no-underline"
                  >
                    View Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Search
