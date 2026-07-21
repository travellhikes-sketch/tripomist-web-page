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
  
  const [settings, setSettings] = useState(null)
  const [packageSuggestions, setPackageSuggestions] = useState([])
  
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
    // Fetch navbar settings
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'navbar').single()
      if (data) {
        setSettings(data.setting_value)
      }
    }
    fetchSettings()
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

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const fetchSuggestions = async () => {
        const { data } = await supabase
          .from('Pakage')
          .select('title, destination')
          .eq('status', 'active')
          .or(`title.ilike.%${searchQuery}%,destination.ilike.%${searchQuery}%`)
          .limit(5)
        
        if (data) {
          // Deduplicate suggestions
          const uniqueSuggestions = Array.from(new Set(data.map(p => p.title || p.destination))).filter(Boolean)
          setPackageSuggestions(uniqueSuggestions)
        }
      }
      fetchSuggestions()
    } else {
      setPackageSuggestions([])
    }
  }, [searchQuery])

  const handleSearch = (query) => {
    setSearchQuery(query)
    setShowSuggestions(false)
    if (!query.trim()) return
    navigate(`/search?search=${encodeURIComponent(query.trim())}`)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
    setIsOpen(false)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <>
      <nav className="bg-white sticky top-0 z-50 transition-all duration-300 relative border-b border-gray-100">
        <div className="flex justify-between items-center w-full px-4 md:px-12 lg:px-20 py-4 bg-white relative z-50">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link className="font-headline-md text-headline-md font-bold tracking-tight text-black flex items-center gap-2 hover:scale-95 duration-150 transition-transform" to="/">
              {settings?.logo_image_url ? (
                <img src={settings.logo_image_url} alt="TripoMist" className="h-8" />
              ) : (
                settings?.logo_text || "TripoMist"
              )}
            </Link>
          </div>
          
          {/* Search Bar (Center) */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-sm mx-auto relative">
            <input 
              type="text" 
              placeholder={settings?.search_placeholder || "Search destinations..."}
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
              className="w-full bg-white text-black border-[1.5px] border-[#136b8a] rounded-full py-1.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-[13px] font-medium placeholder-black/50 transition-all shadow-sm"
            />
            <button 
              onClick={() => handleSearch(searchQuery)}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 flex items-center justify-center text-black hover:bg-gray-100 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
            </button>
            
            <AnimatePresence>
              {showSuggestions && searchQuery.trim().length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[60]"
                >
                  <div className="py-2">
                    {packageSuggestions.map((suggestion, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSearch(suggestion)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors text-sm text-black/80 font-medium"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary/70">location_on</span>
                        {suggestion}
                      </div>
                    ))}
                    {packageSuggestions.length === 0 && (
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
              {isOpen ? 'Close' : (settings?.menu_button_text || 'Menu')}
            </button>
            
            {user ? (
              <Link to="/my-account" className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary font-bold rounded-full transition-transform hover:scale-105 border border-primary/20 shadow-sm overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">
                    {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </Link>
            ) : (
              <Link to={settings?.login_route || "/login"} className="bg-primary text-white font-semibold px-5 py-2 rounded-full transition-all text-sm hover:bg-primary/90 flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[16px]">login</span> {settings?.login_button_text || 'Login'}
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
                  {user && (
                    <>
                      <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/my-account') ? 'font-bold text-[#136b8a]' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/my-account">Dashboard</Link>
                      <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/my-trips') ? 'font-bold text-[#136b8a]' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/my-trips">My Trips</Link>
                      <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/my-trips') ? 'font-bold text-[#136b8a]' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/my-trips">My Bookings</Link>
                      <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/profile') ? 'font-bold text-[#136b8a]' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/profile">Profile</Link>
                      <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/contact') ? 'font-bold text-[#136b8a]' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/contact">Support</Link>
                    </>
                  )}
                  {settings?.main_links && settings.main_links.map((link, idx) => (
                    <Link 
                      key={idx}
                      className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive(link.route) ? 'font-bold text-black' : 'text-black/80 hover:text-black'}`} 
                      onClick={() => setIsOpen(false)} 
                      to={link.route}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  {user && (
                    <button 
                      onClick={handleLogout}
                      className="text-xl md:text-2xl py-4 text-left transition-colors hover:pl-2 text-red-600 hover:text-red-800 font-bold"
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
