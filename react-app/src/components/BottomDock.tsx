import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import GooeyDock from '@/components/ui/gooey-dock'
import {
  Home,
  Users,
  CalendarDays,
  Sunrise,
  Search,
} from 'lucide-react'

const navItems = [
  { icon: Home,        label: 'Home',          path: '/' },
  { icon: Users,       label: 'Group Trips',   path: '/group-trips' },
  { icon: Sunrise,     label: 'Weekend Trips', path: '/weekend-trips' },
  { icon: CalendarDays,label: 'Upcoming',      path: '/upcoming-trips' },
  { icon: Search,      label: 'Search',        path: '/search' },
]

export default function BottomDock() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const items = navItems.map((nav) => ({
    icon: nav.icon,
    label: nav.label,
    onClick: () => navigate(nav.path),
    active: location.pathname === nav.path,
  }))

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 pointer-events-none">
      {/* frosted glass pill wrapper */}
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
