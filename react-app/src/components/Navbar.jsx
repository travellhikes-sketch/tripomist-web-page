import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
    setShowUserDropdown(false)
  }

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/group-trips?search=${encodeURIComponent(searchValue.trim())}`)
      setSearchValue('')
    }
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white/80 dark:bg-surface-dim/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center w-full px-4 md:px-8 py-3 max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link className="font-headline-md text-headline-md font-bold tracking-tight text-primary flex items-center gap-2 hover:scale-95 duration-150 transition-transform" to="/">
            <img alt="TripoMist Logo" className="h-10 w-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf4iPOLD4TW-emcX7qi8W7qPZhFbm5OzAQitvDsMARyOfBuAo9ztt29roRULWmZnSZXWDU9C66-5CEUsII9ClNmyCllVfZSQsk_Zh8SNMinjoMc_fWjzIKKChJB0UTFRB6QTigHPgLb0E2DZsOlp_JhvJp0lXnbSsTzGVqfLBMNk-0_rDP3tmtkhWYAQN9_F1nRcn8PpFGemDTJHOLelhxsCRyeTqUu0-JvD0GzZAkXaVLereGaQFPqUxJgRLojmOnEGYfiVmgV8Js0WY" />
            TripoMist
          </Link>
        </div>
        
        {/* Desktop Nav Links */}
        <div className="hidden md:flex gap-6 items-center">
          <Link className={`px-3 py-1 font-body-md text-body-md transition-colors ${isActive('/uttarakhand') ? 'text-primary font-semibold border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`} to="/uttarakhand">Uttarakhand</Link>
          <Link className={`px-3 py-1 font-body-md text-body-md transition-colors ${isActive('/himachal') ? 'text-primary font-semibold border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`} to="/himachal">Himachal Pradesh</Link>
          <Link className={`px-3 py-1 font-body-md text-body-md transition-colors ${isActive('/about') ? 'text-primary font-semibold border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`} to="/about">About Us</Link>
        </div>
        
        {/* Actions/Icons */}
        <div className="flex items-center gap-4">
          <Link className="text-on-surface-variant hover:text-primary transition-colors p-1" to="/cart" aria-label="Cart">
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>
          
          {/* User Auth Profile Dropdown */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserDropdown(!showUserDropdown)} 
                className="flex items-center gap-1.5 focus:outline-none hover:text-primary transition-colors duration-150 p-1"
              >
                <span className="material-symbols-outlined text-[24px]">account_circle</span>
                <span className="hidden md:inline font-body-md text-xs font-semibold max-w-[100px] truncate">
                  {user.user_metadata?.full_name || user.email.split('@')[0]}
                </span>
                <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
              </button>
              
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-[280px] bg-white rounded-2xl border border-gray-200 shadow-2xl py-2 z-50 animate-fade-in text-gray-800 font-sans">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold shadow-inner">
                      {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-base font-bold text-gray-900 m-0 leading-tight">
                        {user.user_metadata?.full_name || "Traveler"}
                      </p>
                      <p className="text-[13px] text-gray-500 m-0 mt-0.5 truncate max-w-[180px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="py-2 border-b border-gray-100">
                    <Link 
                      to="/profile" 
                      onClick={() => setShowUserDropdown(false)} 
                      className="w-full text-left px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 no-underline block"
                    >
                      <span className="material-symbols-outlined text-[20px] font-light">person</span> View Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      onClick={() => setShowUserDropdown(false)} 
                      className="w-full text-left px-5 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 no-underline block"
                    >
                      <span className="material-symbols-outlined text-[20px] font-light">settings</span> Settings
                    </Link>
                  </div>
                  
                  <div className="px-4 py-2 mt-1">
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-left px-4 py-2.5 text-[15px] text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-3 border-none cursor-pointer bg-transparent"
                    >
                      <span className="material-symbols-outlined text-[20px] font-light">logout</span> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/login"
              className="bg-primary hover:bg-primary/95 text-white font-button text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 border-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">login</span> Login
            </Link>
          )}

          <button className="md:hidden text-on-surface-variant p-1" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Menu">
            <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {isOpen && (
        <div className="fixed top-[65px] left-0 w-full bg-white border-b border-outline-variant/30 shadow-lg z-40 md:hidden">
          <div className="flex flex-col p-6 gap-4">
            <Link className={`text-lg pb-1 border-b border-outline-variant/20 ${isActive('/uttarakhand') ? 'text-primary font-bold' : 'text-on-surface-variant'}`} onClick={() => setIsOpen(false)} to="/uttarakhand">Uttarakhand</Link>
            <Link className={`text-lg pb-1 border-b border-outline-variant/20 ${isActive('/himachal') ? 'text-primary font-bold' : 'text-on-surface-variant'}`} onClick={() => setIsOpen(false)} to="/himachal">Himachal Pradesh</Link>
            <Link className={`text-lg pb-1 border-b border-outline-variant/20 ${isActive('/about') ? 'text-primary font-bold' : 'text-on-surface-variant'}`} onClick={() => setIsOpen(false)} to="/about">About Us</Link>
            
            {user ? (
              <div className="pt-2 flex flex-col gap-2">
                <div className="px-1 py-1 text-sm font-semibold text-on-surface-variant">
                  Hi, {user.user_metadata?.full_name || user.email.split('@')[0]}
                </div>
                <Link 
                  to="/profile" 
                  onClick={() => setIsOpen(false)} 
                  className="w-full bg-slate-50 text-slate-700 border border-slate-200 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 no-underline text-center block"
                >
                  <span className="material-symbols-outlined text-sm">person</span> Profile Dashboard
                </Link>
                <button 
                  onClick={() => { handleLogout(); setIsOpen(false); }} 
                  className="w-full bg-red-50 text-red-500 border border-red-200 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">logout</span> Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full bg-primary text-white text-center py-2.5 rounded-lg font-bold text-sm mt-2 flex items-center justify-center gap-2 border-none cursor-pointer block"
              >
                <span className="material-symbols-outlined">login</span> Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
