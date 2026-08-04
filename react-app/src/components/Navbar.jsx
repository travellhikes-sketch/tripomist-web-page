import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import ExploreNavbar from './ExploreNavbar'
import LoginSignupModal from './LoginSignupModal'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState('guest')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const mdSearchRef = useRef(null)

  const [settings, setSettings] = useState(null)
  const [packageSuggestions, setPackageSuggestions] = useState([])
  const [navItems, setNavItems] = useState([])

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setSearchQuery(params.get('search') || '')
  }, [location.search])

  const checkUserRole = async (currentUser) => {
    if (!currentUser) {
      setUserRole('guest')
      return;
    }
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
      setUserRole(data?.role || 'user')
    } catch (err) {
      setUserRole('user')
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      checkUserRole(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null
      setUser(currentUser)
      checkUserRole(currentUser)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const fetchNavbarData = async () => {
      const { data: settingsData } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'navbar').single()
      if (settingsData) {
        setSettings(settingsData.setting_value)
      }

      const { data: navData } = await supabase
        .from('navigation_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (navData) {
        setNavItems(navData)
      }
    }
    fetchNavbarData()
  }, [])



  useEffect(() => {
    const handleClickOutside = (event) => {
      const inLg = searchRef.current && searchRef.current.contains(event.target)
      const inMd = mdSearchRef.current && mdSearchRef.current.contains(event.target)
      if (!inLg && !inMd) {
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
    navigate('/')
    setIsOpen(false)
    setTimeout(async () => {
      await supabase.auth.signOut()
    }, 50)
  }

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path
  }

  const renderBadge = (item) => {
    if (!item.badge_is_active || !item.badge_text) return null;
    const colors = {
      new: 'bg-green-100 text-green-700 border-green-200',
      hot: 'bg-red-100 text-red-700 border-red-200',
      sale: 'bg-orange-100 text-orange-700 border-orange-200',
      featured: 'bg-purple-100 text-purple-700 border-purple-200',
      custom: 'bg-primary/10 text-primary border-primary/20'
    };
    const cls = colors[item.badge_type] || colors.new;
    return <span className={`ml-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${cls} inline-block leading-none align-middle`}>{item.badge_text}</span>;
  }

  const renderLinkContent = (item) => (
    <>
      {item.icon && <span className="material-symbols-outlined text-[18px] align-middle mr-1.5">{item.icon}</span>}
      <span className="align-middle">{item.label}</span>
      {renderBadge(item)}
    </>
  )

  const renderLink = (item, className, onClick = null) => {
    const linkProps = {
      className,
      onClick: onClick,
      target: item.open_in_new_tab ? "_blank" : undefined,
      rel: item.open_in_new_tab ? "noopener noreferrer" : undefined
    }

    if (item.external_url) {
      return <a href={item.external_url} {...linkProps}>{renderLinkContent(item)}</a>
    }
    return <Link to={item.route || '#'} {...linkProps}>{renderLinkContent(item)}</Link>
  }

  const isNavbar = (loc) => {
    if (!loc) return false;
    const l = loc.toLowerCase();
    return l === 'navbar' || l === 'both';
  };

  const isMobileMenu = (loc) => {
    if (!loc) return false;
    const l = loc.toLowerCase();
    return l === 'mobile_menu' || l === 'both';
  };

  const visibleNavItems = navItems.filter(item => item.is_active);

  const mobileItems = visibleNavItems.filter(item =>
    item.show_on_mobile && isMobileMenu(item.location)
  );
  const mobileTopLevel = mobileItems.filter(item => !item.parent_id);
  const getMobileChildren = (parentId) => mobileItems.filter(item => item.parent_id === parentId);

  const desktopItems = visibleNavItems.filter(item =>
    item.show_on_desktop && isNavbar(item.location)
  );
  const desktopTopLevel = desktopItems.filter(item => !item.parent_id);
  const getDesktopChildren = (parentId) => desktopItems.filter(item => item.parent_id === parentId);

  const MobileDropdown = ({ item }) => {
    const [open, setOpen] = useState(false);
    const children = getMobileChildren(item.id);

    return (
      <div className="border-b border-black/10">
        <button
          className="w-full flex items-center justify-between text-xl md:text-2xl py-4 text-black/80 hover:text-black font-medium transition-colors"
          onClick={() => setOpen(!open)}
        >
          <span className="flex items-center">
            {item.icon && <span className="material-symbols-outlined text-[20px] mr-2">{item.icon}</span>}
            <span className="align-middle">{item.label}</span>
            {renderBadge(item)}
          </span>
          <span className={`material-symbols-outlined transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-gray-50/50 rounded-lg mb-2"
            >
              <div className="py-2 px-4 flex flex-col">
                {children.map(child => (
                  <div key={child.id} className="py-2">
                    {renderLink(child, `block text-lg transition-colors hover:pl-2 ${isActive(child.route) ? 'font-bold text-[#136b8a]' : 'text-black/70 hover:text-black'}`, () => setIsOpen(false))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const DesktopDropdown = ({ item }) => {
    const [open, setOpen] = useState(false);
    const children = getDesktopChildren(item.id);

    if (item.mega_menu_enabled && children.length > 0) {
      const cols = item.mega_menu_column || 1;
      const gridClsMap = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4'
      };
      return (
        <div className="relative group" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          <button className="flex items-center gap-1 font-medium text-sm text-black/80 hover:text-primary transition-colors py-2">
            {item.icon && <span className="material-symbols-outlined text-[16px]">{item.icon}</span>}
            {item.label}
            {renderBadge(item)}
            <span className="material-symbols-outlined text-[16px] group-hover:rotate-180 transition-transform duration-200">expand_more</span>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-0 pt-2 min-w-[400px] z-50"
              >
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
                  <div className={`grid gap-x-8 gap-y-4 ${gridClsMap[cols] || 'grid-cols-1'}`}>
                    {children.map(child => (
                      <div key={child.id} onClick={() => setOpen(false)}>
                        {renderLink(child, `block text-sm transition-colors ${isActive(child.route) ? 'font-bold text-primary' : 'text-black/80 hover:text-primary'}`)}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    return (
      <div
        className="relative group"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button className="flex items-center gap-1 font-medium text-sm text-black/80 hover:text-primary transition-colors py-2">
          {item.icon && <span className="material-symbols-outlined text-[16px]">{item.icon}</span>}
          {item.label}
          {renderBadge(item)}
          <span className="material-symbols-outlined text-[16px] group-hover:rotate-180 transition-transform duration-200">expand_more</span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-0 pt-2 min-w-[200px] z-50"
            >
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2">
                {children.map(child => (
                  <div key={child.id} onClick={() => setOpen(false)}>
                    {renderLink(child, `block px-4 py-2.5 text-sm transition-colors ${isActive(child.route) ? 'bg-primary/5 text-primary font-bold' : 'text-black/70 hover:bg-gray-50 hover:text-black'}`)}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-[100] w-full flex flex-col bg-white">
      <nav className="relative border-b border-gray-100">
        <div className="flex items-center justify-between w-full px-4 md:px-12 lg:px-20 py-4 bg-white relative z-50">
          {/* LEFT: Logo */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <Link className="font-headline-md text-headline-md font-bold tracking-tight text-black flex items-center gap-2 hover:scale-95 duration-150 transition-transform" to="/">
              {settings?.logo_image_url && (
                <img src={settings.logo_image_url} alt="Logo" className="h-8 object-contain w-auto max-w-[120px]" />
              )}
              <span className="align-middle">{settings?.logo_text || "TripoMist"}</span>
            </Link>

            <div className="hidden lg:flex items-center gap-6 ml-4">
              {desktopTopLevel.map(item => {
                if (item.item_type === 'dropdown') {
                  return <DesktopDropdown key={item.id} item={item} />;
                }
                const linkClass = item.item_type === 'button'
                  ? "bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-full font-medium text-sm transition-colors flex items-center"
                  : `font-medium text-sm transition-colors flex items-center ${isActive(item.route) ? 'text-primary font-bold' : 'text-black/80 hover:text-primary'}`;

                return (
                  <div key={item.id}>
                    {renderLink(item, linkClass)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTER: Search bar — absolutely centered on large screens only */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2" style={{ width: 'min(380px, 32vw)' }}>
            <div ref={searchRef} className="relative w-full">
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
          </div>

          {/* RIGHT: Instagram badge + Menu + Login */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {settings?.show_instagram_badge && settings?.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs sm:text-sm font-semibold text-gray-800 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#e1306c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span>{settings?.instagram_follower_count || '0'}</span>
              </a>
            )}
            <button
              className={`font-semibold px-3 sm:px-4 py-2 rounded-full transition-all text-xs sm:text-sm hover:opacity-90 border flex items-center gap-1.5 sm:gap-2 ${isOpen ? 'bg-gray-100 text-black border-gray-200 shadow-sm' : 'bg-white text-black border-gray-200 shadow-sm'}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">{isOpen ? 'close' : 'menu'}</span>
              <span className="hidden sm:inline">{isOpen ? 'Close' : (settings?.menu_button_text || 'Menu')}</span>
            </button>

            {user ? (
              <Link to="/my-account" className="hidden lg:flex items-center justify-center w-10 h-10 bg-primary/10 text-primary font-bold rounded-full transition-transform hover:scale-105 border border-primary/20 shadow-sm overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">
                    {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </Link>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="hidden lg:flex bg-primary text-white font-semibold px-5 py-2 rounded-full transition-all text-sm hover:bg-primary/90 items-center gap-1 shadow-sm cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">login</span> <span className="hidden sm:inline">{settings?.login_button_text || 'Login'}</span>
              </button>
            )}
          </div>
        </div>

        {/* MD-only search row (768–1023px): full-width search below the main nav row */}
        <div ref={mdSearchRef} className="hidden md:flex lg:hidden items-center px-4 md:px-12 pb-3 relative">
          <div className="relative w-full max-w-md mx-auto">
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
                if (e.key === 'Enter') handleSearch(searchQuery)
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
                      <div key={idx} onClick={() => handleSearch(suggestion)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors text-sm text-black/80 font-medium">
                        <span className="material-symbols-outlined text-[16px] text-primary/70">location_on</span>
                        {suggestion}
                      </div>
                    ))}
                    {packageSuggestions.length === 0 && (
                      <div onClick={() => handleSearch(searchQuery)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors text-sm text-black/80 font-medium">
                        <span className="material-symbols-outlined text-[16px] text-primary/70">search</span>
                        Search for "{searchQuery}"
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>


        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-[100%] z-[40] px-4 md:px-8 max-w-7xl mx-auto -mt-2"
            >
              <div className="bg-white rounded-[24px] shadow-2xl p-6 md:p-10 w-full border border-gray-100 max-h-[80vh] overflow-y-auto">
                <div className="flex flex-col gap-2">

                  {mobileTopLevel.map(item => {
                    if (item.item_type === 'dropdown') {
                      return <MobileDropdown key={item.id} item={item} />
                    }
                    return (
                      <div key={item.id} className="border-b border-black/10">
                        {renderLink(item, `block text-xl md:text-2xl py-4 transition-colors hover:pl-2 flex items-center gap-2 ${isActive(item.route) ? 'font-bold text-[#136b8a]' : 'text-black/80 hover:text-black'}`, () => setIsOpen(false))}
                      </div>
                    )
                  })}

                  {mobileItems.length === 0 && settings?.main_links && settings.main_links.map((link, idx) => (
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
                    <>
                      <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/my-account') ? 'font-bold text-[#136b8a]' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/my-account">Dashboard</Link>
                      <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/my-trips') ? 'font-bold text-[#136b8a]' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/my-trips">My Bookings</Link>
                      {userRole === 'admin' && (
                        <Link className={`text-xl md:text-2xl py-4 border-b border-black/10 transition-colors hover:pl-2 ${isActive('/admin') ? 'font-bold text-[#136b8a]' : 'text-black/80 hover:text-black'}`} onClick={() => setIsOpen(false)} to="/admin">Admin Dashboard</Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="text-xl md:text-2xl py-4 text-left transition-colors hover:pl-2 text-red-600 hover:text-red-800 font-bold w-full"
                      >
                        Logout
                      </button>
                    </>
                  )}
                  {!user && (
                    <button
                      onClick={() => { setIsOpen(false); setShowAuthModal(true); }}
                      className="text-xl md:text-2xl py-4 text-left transition-colors hover:pl-2 text-[#136b8a] font-bold w-full"
                    >
                      Login / Sign Up
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

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

      <ExploreNavbar />

      <LoginSignupModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  )
}

export default Navbar
