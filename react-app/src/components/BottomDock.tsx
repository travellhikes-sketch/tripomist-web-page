import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import GooeyDock from '@/components/ui/gooey-dock'
import {
  Home,
  Users,
  CalendarDays,
  Sunrise,
  Search,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { icon: Home,         label: 'Home',          path: '/' },
  { icon: Users,        label: 'Group Trips',   path: '/group-trips' },
  { icon: Sunrise,      label: 'Weekend Trips', path: '/weekend-trips' },
  { icon: CalendarDays, label: 'Upcoming',      path: '/upcoming-trips' },
  { icon: Search,       label: 'Search',        path: '/search' },
]

interface BottomDockProps {
  onOpenChat?: () => void
}

export default function BottomDock({ onOpenChat }: BottomDockProps) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [pillVisible, setPillVisible] = useState(true)

  const items = navItems.map((nav) => ({
    icon: nav.icon,
    label: nav.label,
    onClick: () => navigate(nav.path),
    active: location.pathname === nav.path,
  }))

  const handlePillClick = () => {
    setPillVisible(false)
    // trigger chatbot open via custom event (works with Chatbot.jsx)
    if (onOpenChat) {
      onOpenChat()
    } else {
      // fallback: click the chatbot trigger button if it exists in DOM
      const btn = document.getElementById('chatbot-trigger-btn')
      if (btn) btn.click()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-4 gap-2 pointer-events-none">

      {/* "How can I help you today?" pill — above the dock */}
      <AnimatePresence>
        {pillVisible && (
          <motion.button
            key="ai-pill"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.5 }}
            onClick={handlePillClick}
            className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full cursor-pointer select-none"
            style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.40)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            }}
          >
            {/* pulsing green dot */}
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>

            <span
              className="text-sm font-semibold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
            >
              How can I help you today?
            </span>

            {/* small red dot (like in the screenshot) */}
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* GooeyDock pill */}
      <div
        className="pointer-events-auto flex items-center px-2 py-2 rounded-[2rem] shadow-2xl"
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
  )
}
