import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import GooeyDock from '@/components/ui/gooey-dock'
import { Home, Users, Sunrise, CalendarDays, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { icon: Home,         label: 'Home',          path: '/' },
  { icon: Users,        label: 'Group Trips',   path: '/group-trips' },
  { icon: Sunrise,      label: 'Weekend Trips', path: '/weekend-trips' },
  { icon: CalendarDays, label: 'Upcoming',      path: '/upcoming-trips' },
  { icon: Search,       label: 'Search',        path: '/search' },
]

interface BottomDockProps {
  isChatOpen?: boolean
  onOpenChat?: () => void
  onCloseChat?: () => void
}

export default function BottomDock({ isChatOpen, onOpenChat, onCloseChat }: BottomDockProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isFabOpen, setIsFabOpen] = useState(false)

  const items = navItems.map((nav) => ({
    icon: nav.icon,
    label: nav.label,
    onClick: () => navigate(nav.path),
    active: location.pathname === nav.path,
  }))

  if (location.pathname === '/login') return null

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[80] w-full px-4 sm:px-6 pointer-events-none flex justify-center items-end">
      
      {/* Center Group: Pill and Dock */}
      <div className="flex flex-col items-center gap-4 pointer-events-auto">
        
        {/* "How can I help you today?" or "Close Chat" pill */}
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.4 }}
          onClick={() => isChatOpen ? onCloseChat?.() : onOpenChat?.()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full select-none transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.40)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}
        >
          {isChatOpen && (
            <span className="material-symbols-outlined text-white text-[16px]">close</span>
          )}
          <span
            className="text-[13px] font-semibold tracking-wide text-center"
            style={{ color: isChatOpen ? 'black' : 'rgba(0,0,0,0.85)', textShadow: 'none' }}
          >
            {isChatOpen ? 'Close Chat' : 'How can I help you today?'}
          </span>
        </motion.button>

        {/* GooeyDock — smaller icons */}
        <div
          className="flex items-center px-1 py-1 rounded-[2rem] shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.35)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}
        >
          <GooeyDock items={items} className="py-0" />
        </div>
      </div>

      {/* Right Corner Group: Contact FAB */}
      <div className="absolute right-4 sm:right-6 bottom-2 flex flex-col items-center justify-end pointer-events-auto">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute bottom-[115%] flex flex-col gap-3 items-center mb-2"
            >
              <a
                className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                href="mailto:info@tripomist.com"
                title="Email Us"
              >
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                href="tel:+919990802608"
                title="Call Us"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20b858] flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                href="https://wa.me/919990802608"
                target="_blank" 
                rel="noreferrer"
                title="WhatsApp Us"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c-.003 1.396.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-xl active:scale-95 ${isFabOpen ? 'bg-slate-700 hover:bg-slate-800' : 'bg-[#136b8a] hover:bg-[#0f556e]'}`}
          title="Contact Options"
        >
          <motion.span 
            animate={{ rotate: isFabOpen ? 90 : 0 }} 
            className="material-symbols-outlined text-[24px]"
          >
            {isFabOpen ? 'close' : 'call'}
          </motion.span>
        </button>
      </div>
    </div>
  )
}
