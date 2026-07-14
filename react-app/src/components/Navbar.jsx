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
    <>
    <nav className="bg-white dark:bg-slate-900 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300">
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
          <Link className={`px-3 py-1 font-body-md text-body-md transition-colors ${isActive('/uttarakhand') ? 'text-primary font-semibold border-b-2 border-primary' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'}`} to="/uttarakhand">Uttarakhand</Link>
          <Link className={`px-3 py-1 font-body-md text-body-md transition-colors ${isActive('/himachal') ? 'text-primary font-semibold border-b-2 border-primary' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'}`} to="/himachal">Himachal Pradesh</Link>
          <Link className={`px-3 py-1 font-body-md text-body-md transition-colors ${isActive('/about') ? 'text-primary font-semibold border-b-2 border-primary' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'}`} to="/about">About Us</Link>
        </div>
        
        {/* Actions/Icons */}
        <div className="flex items-center gap-4">
          {/* User Auth Profile Dropdown */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserDropdown(!showUserDropdown)} 
                className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity duration-150 p-1"
              >
                {/* Gradient Avatar in Navbar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 via-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                  {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                
                <span className="hidden md:inline font-body-md text-sm font-semibold max-w-[100px] truncate text-gray-700 dark:text-gray-200">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <span className="material-symbols-outlined text-sm text-gray-500 dark:text-gray-400">expand_more</span>
              </button>
              
              {showUserDropdown && (
                <div className="absolute right-0 mt-3 w-[260px] bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 z-50 animate-fade-in font-sans">
                  
                  {/* Header / User Info */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 via-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0">
                      {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-[15px] font-bold text-gray-900 dark:text-white m-0 leading-tight truncate">
                        {user.user_metadata?.full_name || "Traveler"}
                      </p>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 m-0 mt-0.5 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="h-px bg-gray-100 dark:bg-gray-700 w-full my-1"></div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <Link 
                      to="/profile" 
                      onClick={() => setShowUserDropdown(false)} 
                      className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 no-underline block"
                    >
                      <span className="material-symbols-outlined text-[20px] text-gray-500 dark:text-gray-400">person</span> View Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      onClick={() => setShowUserDropdown(false)} 
                      className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 no-underline block"
                    >
                      <span className="material-symbols-outlined text-[20px] text-gray-500 dark:text-gray-400">settings</span> Settings
                    </Link>
                  </div>
                  
                  <div className="h-px bg-gray-100 dark:bg-gray-700 w-full my-1"></div>
                  
                  {/* Sign Out Button */}
                  <div className="px-4 py-3">
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-center py-2.5 text-[14px] font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      Sign Out
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

          <Link className="hidden md:flex items-center text-gray-600 dark:text-gray-300 hover:text-primary transition-colors p-1" to="/cart" aria-label="Cart">
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>

          <button className="md:hidden text-gray-800 dark:text-gray-200 p-1 ml-1" onClick={() => setIsOpen(true)} aria-label="Open Menu">
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
      </div>
    </nav>

      {/* Mobile Overlay (Outside Nav for perfect z-index) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300" onClick={() => setIsOpen(false)}></div>
      )}

      {/* Mobile Drawer Navigation (Drops from top, Outside Nav for perfect z-index) */}
      <div className={`fixed top-0 left-0 w-full bg-white dark:bg-slate-900 shadow-2xl z-[70] transform transition-all duration-300 ease-in-out md:hidden flex flex-col rounded-b-3xl max-h-[90dvh] overflow-hidden ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <span className="font-bold text-gray-900 dark:text-white text-lg">Menu</span>
          <button className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsOpen(false)} aria-label="Close Menu">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex flex-col p-6 gap-2 overflow-y-auto">
          {/* Cart placed inside the menu on mobile */}
          <Link className="text-lg py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 text-gray-800 dark:text-gray-200 hover:text-primary transition-colors" onClick={() => setIsOpen(false)} to="/cart">
            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">shopping_cart</span> Your Cart
          </Link>

          <Link className={`text-lg py-3 border-b border-gray-100 dark:border-gray-800 transition-colors ${isActive('/uttarakhand') ? 'text-primary font-bold' : 'text-gray-800 dark:text-gray-200'}`} onClick={() => setIsOpen(false)} to="/uttarakhand">Uttarakhand</Link>
          <Link className={`text-lg py-3 border-b border-gray-100 dark:border-gray-800 transition-colors ${isActive('/himachal') ? 'text-primary font-bold' : 'text-gray-800 dark:text-gray-200'}`} onClick={() => setIsOpen(false)} to="/himachal">Himachal Pradesh</Link>
          <Link className={`text-lg py-3 border-b border-gray-100 dark:border-gray-800 transition-colors ${isActive('/about') ? 'text-primary font-bold' : 'text-gray-800 dark:text-gray-200'}`} onClick={() => setIsOpen(false)} to="/about">About Us</Link>
          
          {user ? (
            <div className="pt-6 flex flex-col gap-3">
              <div className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                Hi, {user.user_metadata?.full_name || user.email.split('@')[0]}
              </div>
              <Link 
                to="/profile" 
                onClick={() => setIsOpen(false)} 
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 no-underline text-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-sm">person</span> Profile Dashboard
              </Link>
              <button 
                onClick={() => { handleLogout(); setIsOpen(false); }} 
                className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                <span className="material-symbols-outlined">logout</span> Logout
              </button>
            </div>
          ) : (
            <div className="pt-6 mb-4">
              <Link 
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full bg-primary hover:bg-primary/90 text-white text-center py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-none cursor-pointer transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined">login</span> Login / Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Navbar
