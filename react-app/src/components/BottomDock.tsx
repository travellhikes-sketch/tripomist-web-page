import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import GooeyDock from '@/components/ui/gooey-dock'
import { Home, Mountain, Sunrise, Info, Search } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { icon: Home,     label: 'Home',        path: '/' },
  { icon: Mountain, label: 'Uttarakhand', path: '/uttarakhand' },
  { icon: Sunrise,  label: 'Himachal',    path: '/himachal' },
  { icon: Info,     label: 'About Us',    path: '/about' },
  { icon: Search,   label: 'Search',      path: '/search' },
]

interface BottomDockProps {
  onOpenChat?: () => void
}

export default function BottomDock({ onOpenChat }: BottomDockProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const items = navItems.map((nav) => ({
    icon: nav.icon,
    label: nav.label,
    onClick: () => navigate(nav.path),
    active: location.pathname === nav.path,
  }))

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-2 gap-1.5 pointer-events-none">

      {/* "How can I help you today?" pill — always visible */}
      <motion.button
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.4 }}
        onClick={() => onOpenChat && onOpenChat()}
        className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer select-none"
        style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.40)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}
      >
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span
          className="text-xs font-semibold tracking-wide"
          style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
        >
          How can I help you today?
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
      </motion.button>

      {/* GooeyDock — smaller icons */}
      <div
        className="pointer-events-auto flex items-center px-1 py-1 rounded-[2rem] shadow-2xl"
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
