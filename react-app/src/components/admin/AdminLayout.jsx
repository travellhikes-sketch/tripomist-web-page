import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
  LayoutDashboard, 
  Package, 
  CalendarDays, 
  Users, 
  UserPlus,
  LogOut, 
  Menu, 
  X, 
  ExternalLink,
  MessageSquare,
  Settings,
  Image,
  MapPin,
  Heart,
  Layout,
  Globe,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Collapsible states
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isWebsiteMgmtOpen, setIsWebsiteMgmtOpen] = useState(false);
  const [isWebsitePagesOpen, setIsWebsitePagesOpen] = useState(false);

  // Open collapsibles based on current route on mount/route change
  useEffect(() => {
    if (location.pathname.startsWith('/admin/manual-bookings') || 
        location.pathname.startsWith('/admin/bookings') || 
        location.pathname.startsWith('/admin/checkout-leads') ||
        location.pathname.startsWith('/admin/room-allocation') ||
        location.pathname.startsWith('/admin/booking-activity-logs')) {
      setIsBookingsOpen(true);
    }
    if (location.pathname.startsWith('/admin/banners') || location.pathname.startsWith('/admin/destinations') || location.pathname.startsWith('/admin/interests') || location.pathname.startsWith('/admin/sections') || location.pathname.startsWith('/admin/site-settings')) {
      setIsWebsiteMgmtOpen(true);
    }
    if (location.pathname.startsWith('/admin/website-pages')) {
      setIsWebsitePagesOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-sm">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/40 md:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-5 border-b border-gray-100 flex-shrink-0">
          <span className="text-base font-bold text-gray-800 tracking-tight">TripoMist Admin</span>
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700" 
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors ${
              location.pathname === '/admin/dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard size={18} className={location.pathname === '/admin/dashboard' ? 'text-slate-800' : 'text-gray-400'} />
            Dashboard
          </Link>

          <Link
            to="/admin/packages"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors ${
              location.pathname.startsWith('/admin/packages')
                ? 'bg-slate-100 text-slate-900 font-semibold' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Package size={18} className={location.pathname.startsWith('/admin/packages') ? 'text-slate-800' : 'text-gray-400'} />
            Packages
          </Link>

          {/* Bookings Collapsible */}
          <div className="pt-2">
            <button 
              onClick={() => setIsBookingsOpen(!isBookingsOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays size={18} className="text-gray-400" />
                <span>Bookings</span>
              </div>
              {isBookingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isBookingsOpen && (
              <div className="pl-9 pr-2 space-y-1 mt-1">
                <Link to="/admin/manual-bookings" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname.startsWith('/admin/manual-bookings') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Manual Booking
                </Link>
                <Link to="/admin/bookings" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname === '/admin/bookings' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Online Bookings
                </Link>
                <Link to="/admin/checkout-leads" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname.startsWith('/admin/checkout-leads') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Checkout Leads
                </Link>
                <Link to="/admin/room-allocation" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname.startsWith('/admin/room-allocation') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Room Allocation
                </Link>
                <Link to="/admin/booking-activity-logs" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname.startsWith('/admin/booking-activity-logs') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Activity Logs
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/admin/users"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors ${
              location.pathname.startsWith('/admin/users')
                ? 'bg-slate-100 text-slate-900 font-semibold' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users size={18} className={location.pathname.startsWith('/admin/users') ? 'text-slate-800' : 'text-gray-400'} />
            Customers
          </Link>

          {/* Website Management Collapsible */}
          <div className="pt-2">
            <button 
              onClick={() => setIsWebsiteMgmtOpen(!isWebsiteMgmtOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Layout size={18} className="text-gray-400" />
                <span>Website Mgmt</span>
              </div>
              {isWebsiteMgmtOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isWebsiteMgmtOpen && (
              <div className="pl-9 pr-2 space-y-1 mt-1">
                <Link to="/admin/banners" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname.startsWith('/admin/banners') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Banners
                </Link>
                <Link to="/admin/destinations" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname.startsWith('/admin/destinations') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Destinations
                </Link>
                <Link to="/admin/interests" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname.startsWith('/admin/interests') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Interests
                </Link>
                <Link to="/admin/sections" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname.startsWith('/admin/sections') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Homepage Sections
                </Link>
                <Link to="/admin/reviews" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname.startsWith('/admin/reviews') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Reviews
                </Link>
                <Link to="/admin/site-settings" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname.startsWith('/admin/site-settings') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Site Settings
                </Link>
              </div>
            )}
          </div>

          {/* Website Pages Collapsible */}
          <div className="pt-2">
            <button 
              onClick={() => setIsWebsitePagesOpen(!isWebsitePagesOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Globe size={18} className="text-gray-400" />
                <span>Website Pages</span>
              </div>
              {isWebsitePagesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isWebsitePagesOpen && (
              <div className="pl-9 pr-2 space-y-1 mt-1">
                <Link to="/admin/website-pages/menu-manager" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname === '/admin/website-pages/menu-manager' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Menu Manager
                </Link>
                <Link to="/admin/website-pages/about-us" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname === '/admin/website-pages/about-us' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  About Us
                </Link>
                <Link to="/admin/website-pages/cancellation-refund" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname === '/admin/website-pages/cancellation-refund' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Cancellation & Refund
                </Link>
                <Link to="/admin/website-pages/terms-conditions" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname === '/admin/website-pages/terms-conditions' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Terms & Conditions
                </Link>
                <Link to="/admin/website-pages/privacy-policy" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname === '/admin/website-pages/privacy-policy' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Privacy Policy
                </Link>
                <Link to="/admin/website-pages/contact-us" className={`block px-3 py-1.5 rounded-md transition-colors ${location.pathname === '/admin/website-pages/contact-us' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                  Contact Us
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1 flex-shrink-0">
          <Link 
            to="/" 
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink size={18} className="text-gray-400" />
            View Website
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-2.5 px-3 py-2 rounded-md text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header for Mobile */}
        <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-100 md:hidden z-10 flex-shrink-0">
          <span className="text-base font-bold text-gray-800">Admin</span>
          <button 
            className="text-gray-600 focus:outline-none p-1" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6">
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-[50vh]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800"></div>
            </div>
          }>
            <Outlet />
          </React.Suspense>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
