import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  
  const suggestionsList = ['Manali-Kasol', 'Jibhi-Thirthan', 'Kedarnath', 'Chopta-Tungnath']

  const navigate = useNavigate()
  const location = useLocation()

  // Initialize search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setSearchQuery(params.get('search') || '')
  }, [location.search])

  useEffect(() => {
    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (query) => {
    const destinationPaths = ['/uttarakhand', '/ladakh', '/spiti', '/kashmir', '/goa', '/rajasthan', '/kerala', '/meghalaya', '/himachal', '/andaman', '/international', '/group-trips', '/all-departures']
    
    setSearchQuery(query) // Update state just in case it was called from a suggestion
    
    if (!query.trim()) {
      if (destinationPaths.includes(location.pathname)) {
        navigate(location.pathname) // Clear search param
      }
      setShowSuggestions(false)
      return
    }

    if (destinationPaths.includes(location.pathname)) {
      navigate(`${location.pathname}?search=${encodeURIComponent(query.trim())}`)
    } else {
      navigate(`/search?search=${encodeURIComponent(query.trim())}`)
    }
    setShowSuggestions(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
    setIsOpen(false)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <>
      <nav className="bg-white sticky top-0 z-50 transition-all duration-300 relative">
        <div className="flex justify-between items-center w-full px-4 md:px-8 py-4 max-w-7xl mx-auto bg-white relative z-50">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link className="font-headline-md text-headline-md font-bold tracking-tight text-black flex items-center gap-2 hover:scale-95 duration-150 transition-transform" to="/">
              <img alt="TripoMist Logo" className="h-10 w-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf4iPOLD4TW-emcX7qi8W7qPZhFbm5OzAQitvDsMARyOfBuAo9ztt29roRULWmZnSZXWDU9C66-5CEUsII9ClNmyCllVfZSQsk_Zh8SNMinjoMc_fWjzIKKChJB0UTFRB6QTigHPgLb0E2DZsOlp_JhvJp0lXnbSsTzGVqfLBMNk-0_rDP3tmtkhWYAQN9_F1nRcn8PpFGemDTJHOLelhxsCRyeTqUu0-JvD0GzZAkXaVLereGaQFPqUxJgRLojmOnEGYfiVmgV8Js0WY" />
              TripoMist
            </Link>
          </div>
          
          {/* Search Bar (Center) */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <input 
              type="text" 
              placeholder="Search destinations..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery)
                }
              }}
              className="w-full bg-white text-black border-2 border-primary rounded-full py-2.5 pl-6 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 text-[14px] font-medium placeholder-black/50 transition-all shadow-sm"
            />
            <button 
              onClick={() => handleSearch(searchQuery)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 flex items-center justify-center text-black hover:bg-gray-100 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>
            
            <AnimatePresence>
              {showSuggestions && (searchQuery.trim().length > 0 || suggestionsList.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[60]"
                >
                  <div className="py-2">
                    {suggestionsList.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).map((suggestion, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSearch(suggestion)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors text-sm text-black/80 font-medium"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary/70">location_on</span>
                        {suggestion}
                      </div>
                    ))}
                    {searchQuery.trim().length > 0 && suggestionsList.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div 
                        onClick={() => handleSearch(searchQuery)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors text-sm text-black/80 font-medium"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary/70">search</span>
                        Search for "{searchQuery}"
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Actions/Icons */}
          <div className="flex items-center gap-2">
            <button 
              className={`font-semibold px-5 py-2 rounded-full transition-all text-sm hover:opacity-90 min-w-[80px] border ${isOpen ? 'bg-white text-black border-gray-200 shadow-sm' : 'bg-primary text-white border-transparent'}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? 'Close' : 'Menu'}
            </button>
            
            {user ? (
              <Link to="/profile" className="bg-primary text-white font-semibold px-5 py-2 rounded-full transition-all text-sm hover:bg-primary/90 flex items-center gap-1 shadow-sm">
                Profile
              </Link>
            ) : (
              <Link to="/login" className="bg-primary text-white font-semibold px-5 py-2 rounded-full transition-all text-sm hover:bg-primary/90 flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[16px]">login</span> Login
              </Link>
            )}
          </div>
        </div>

        {/* Full Screen Menu Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-[100%] z-[40] px-4 md:px-8 max-w-7xl mx-auto -mt-2"
            >
              <div className="bg-white rounded-[24px] shadow-2xl p-6 md:p-10 w-full border border-gray-100">
                <div className="flex flex-col gap-2">
                  <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/uttarakhand') ? 'font-bold text-black' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/uttarakhand">Uttarakhand</Link>
                  <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/himachal') ? 'font-bold text-black' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/himachal">Himachal</Link>
                  <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/about') ? 'font-bold text-black' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/about">About Us</Link>
                  
                  {user && (
                    <button 
                      onClick={handleLogout}
                      className="text-xl md:text-2xl py-4 text-left transition-colors hover:pl-2 text-black/80 hover:text-black"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Overlay to close menu when clicking outside */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[30]"
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
