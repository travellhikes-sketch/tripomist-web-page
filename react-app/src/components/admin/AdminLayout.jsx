import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  LayoutDashboard,
  Package,
  CalendarDays,
  Users,
  LogOut,
  Menu,
  X,
  ExternalLink,
  MessageSquare,
  Layout,
  Globe,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  User as UserIcon,
  Settings,
  Briefcase,
  HandCoins
} from 'lucide-react';
import AdminProfileModal from './AdminProfileModal';
import AdminBrandingModal from './AdminBrandingModal';
import AdminSecurityModal from './AdminSecurityModal';
import { Lock } from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Collapsible states
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isWebsiteMgmtOpen, setIsWebsiteMgmtOpen] = useState(false);
  const [isWebsitePagesOpen, setIsWebsitePagesOpen] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      setIsBookingsOpen(false);
      setIsWebsiteMgmtOpen(false);
      setIsWebsitePagesOpen(false);
    }
  }, [isCollapsed]);

  // Branding & Profile states
  const [adminBranding, setAdminBranding] = useState({ admin_title: 'TripoMist Admin', admin_logo_url: '' });
  const [adminProfile, setAdminProfile] = useState({ full_name: 'Admin', avatar_url: '', email: '' });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
        if (profile) {
          setAdminProfile({ ...profile, email: user.email });
        } else {
          setAdminProfile({ full_name: user.email?.split('@')[0] || 'Admin', avatar_url: '', email: user.email });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadBranding = async () => {
    try {
      const { data } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'admin_branding').single();
      if (data && data.setting_value) {
        setAdminBranding({
          admin_title: data.setting_value.admin_title || 'TripoMist Admin',
          admin_logo_url: data.setting_value.admin_logo_url || ''
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadProfile();
    loadBranding();
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/manual-bookings') ||
        location.pathname.startsWith('/admin/bookings') ||
        location.pathname.startsWith('/admin/checkout-leads') ||
        location.pathname.startsWith('/admin/booking-activity-logs') ||
        location.pathname.startsWith('/admin/business-contribution')) {
      setIsBookingsOpen(true);
    }
    if (location.pathname.startsWith('/admin/banners') || location.pathname.startsWith('/admin/destinations') || location.pathname.startsWith('/admin/interests') || location.pathname.startsWith('/admin/sections') || location.pathname.startsWith('/admin/explore-departments') || location.pathname.startsWith('/admin/site-settings')) {
      setIsWebsiteMgmtOpen(true);
    }
    if (location.pathname.startsWith('/admin/website-pages')) {
      setIsWebsitePagesOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    navigate('/');
    setTimeout(async () => {
      await supabase.auth.signOut();
    }, 50);
  };

  const getPageTitle = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return 'Dashboard';
    const last = segments[segments.length - 1];
    if (last === 'business-contribution') return 'Charity Contribution';
    return last.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getInitials = (name) => {
    return name ? name.substring(0, 1).toUpperCase() : 'A';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-sm admin-layout">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] bg-white border-r border-gray-200 shadow-sm md:shadow-none transform transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-64 md:w-[72px]' : 'w-64'}`}
      >
        <div className="flex items-center justify-between h-14 px-5 border-b border-gray-100 flex-shrink-0 relative bg-white">
          <div className={`flex items-center gap-2 ${isCollapsed ? 'hidden md:flex justify-center w-full' : ''}`}>
            {adminBranding.admin_logo_url && (
              <img src={adminBranding.admin_logo_url} alt="Logo" className="h-6 w-auto object-contain shrink-0" />
            )}
            {!isCollapsed && (
              <span className="text-base font-bold text-gray-900 tracking-tight truncate max-w-[150px]">
                {adminBranding.admin_title}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <button
              className="md:hidden text-gray-500 hover:text-gray-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          )}

          {/* Desktop Toggle Arrow */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-gray-500 hover:text-[#01AFD1] shadow-sm transition-colors absolute right-2 top-1/2 -translate-y-1/2 ${isCollapsed ? 'w-8 h-8' : 'w-7 h-7'}`}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${isCollapsed ? 'justify-center w-12 mx-auto' : ''} ${
              location.pathname === '/admin/dashboard'
                ? 'bg-[#01AFD1] text-white shadow-sm'
                : 'text-gray-700 hover:bg-[#01AFD1]/10 hover:text-gray-900'
            }`}
            onClick={() => setSidebarOpen(false)}
            title={isCollapsed ? "Dashboard" : ""}
          >
            <LayoutDashboard size={18} className={`shrink-0 ${location.pathname === '/admin/dashboard' ? 'text-white' : 'text-gray-500'}`} />
            {!isCollapsed && <span className="truncate">Dashboard</span>}
          </Link>

          <Link
            to="/admin/packages"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${isCollapsed ? 'justify-center w-12 mx-auto' : ''} ${
              location.pathname.startsWith('/admin/packages')
                ? 'bg-[#01AFD1] text-white shadow-sm'
                : 'text-gray-700 hover:bg-[#01AFD1]/10 hover:text-gray-900'
            }`}
            onClick={() => setSidebarOpen(false)}
            title={isCollapsed ? "Packages" : ""}
          >
            <Package size={18} className={`shrink-0 ${location.pathname.startsWith('/admin/packages') ? 'text-white' : 'text-gray-500'}`} />
            {!isCollapsed && <span className="truncate">Packages</span>}
          </Link>

          {/* Bookings */}
          <div className="pt-2">
            <button
              onClick={() => setIsBookingsOpen(!isBookingsOpen)}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-[#01AFD1]/10 transition-colors ${isCollapsed ? 'justify-center w-12 mx-auto' : 'justify-between'}`}
              title={isCollapsed ? "Bookings" : ""}
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays size={18} className="text-gray-500 shrink-0" />
                {!isCollapsed && <span className="truncate">Bookings</span>}
              </div>
              {!isCollapsed && (isBookingsOpen ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />)}
            </button>
            {isBookingsOpen && !isCollapsed && (
              <div className="pl-9 pr-2 space-y-0.5 mt-1">
                <Link to="/admin/manual-bookings" className={`block px-3 py-1.5 rounded-lg transition-colors font-medium ${location.pathname.startsWith('/admin/manual-bookings') ? 'bg-[#01AFD1] text-white shadow-sm' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900'}`} onClick={() => setSidebarOpen(false)}>
                  Manual Booking
                </Link>
                <Link to="/admin/bookings" className={`block px-3 py-1.5 rounded-lg transition-colors font-medium ${location.pathname === '/admin/bookings' ? 'bg-[#01AFD1] text-white shadow-sm' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900'}`} onClick={() => setSidebarOpen(false)}>
                  Online Bookings
                </Link>
                <Link to="/admin/checkout-leads" className={`block px-3 py-1.5 rounded-lg transition-colors font-medium ${location.pathname.startsWith('/admin/checkout-leads') ? 'bg-[#01AFD1] text-white shadow-sm' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900'}`} onClick={() => setSidebarOpen(false)}>
                  Checkout Leads
                </Link>
                <Link to="/admin/itinerary-leads" className={`block px-3 py-1.5 rounded-lg transition-colors font-medium ${location.pathname.startsWith('/admin/itinerary-leads') ? 'bg-[#01AFD1] text-white shadow-sm' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900'}`} onClick={() => setSidebarOpen(false)}>
                  Itinerary Leads
                </Link>
                <Link to="/admin/booking-activity-logs" className={`block px-3 py-1.5 rounded-lg transition-colors font-medium ${location.pathname.startsWith('/admin/booking-activity-logs') ? 'bg-[#01AFD1] text-white shadow-sm' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900'}`} onClick={() => setSidebarOpen(false)}>
                  Activity Logs
                </Link>
                <Link to="/admin/bookings/cancelled" className={`block px-3 py-1.5 rounded-lg transition-colors font-medium ${location.pathname === '/admin/bookings/cancelled' ? 'bg-[#01AFD1] text-white shadow-sm' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900'}`} onClick={() => setSidebarOpen(false)}>
                  Cancelled Bookings
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/admin/business-contribution"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium mt-1 ${isCollapsed ? 'justify-center w-12 mx-auto' : ''} ${
              location.pathname === '/admin/business-contribution'
                ? 'bg-[#01AFD1] text-white shadow-sm'
                : 'text-gray-700 hover:bg-[#01AFD1]/10 hover:text-gray-900'
            }`}
            onClick={() => setSidebarOpen(false)}
            title={isCollapsed ? "Charity Contribution" : ""}
          >
            <HandCoins size={18} className={`shrink-0 ${location.pathname === '/admin/business-contribution' ? 'text-white' : 'text-gray-500'}`} />
            {!isCollapsed && <span className="truncate">Charity Contribution</span>}
          </Link>



          <Link
            to="/admin/users"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${isCollapsed ? 'justify-center w-12 mx-auto' : ''} ${
              location.pathname.startsWith('/admin/users')
                ? 'bg-[#01AFD1] text-white shadow-sm'
                : 'text-gray-700 hover:bg-[#01AFD1]/10 hover:text-gray-900'
            }`}
            onClick={() => setSidebarOpen(false)}
            title={isCollapsed ? "Customers" : ""}
          >
            <Users size={18} className={`shrink-0 ${location.pathname.startsWith('/admin/users') ? 'text-white' : 'text-gray-500'}`} />
            {!isCollapsed && <span className="truncate">Customers</span>}
          </Link>

          {/* Website Management */}
          <div className="pt-2">
            <button
              onClick={() => setIsWebsiteMgmtOpen(!isWebsiteMgmtOpen)}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-[#01AFD1]/10 transition-colors ${isCollapsed ? 'justify-center w-12 mx-auto' : 'justify-between'}`}
              title={isCollapsed ? "Website Mgmt" : ""}
            >
              <div className="flex items-center gap-2.5">
                <Layout size={18} className="text-gray-500 shrink-0" />
                {!isCollapsed && <span className="truncate">Website Mgmt</span>}
              </div>
              {!isCollapsed && (isWebsiteMgmtOpen ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />)}
            </button>
            {isWebsiteMgmtOpen && !isCollapsed && (
              <div className="pl-9 pr-2 space-y-0.5 mt-1">
                <Link to="/admin/banners" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname.startsWith('/admin/banners') ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Banners
                </Link>
                <Link to="/admin/destinations" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname.startsWith('/admin/destinations') ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Destinations
                </Link>
                <Link to="/admin/interests" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname.startsWith('/admin/interests') ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Interests
                </Link>
                <Link to="/admin/sections" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname.startsWith('/admin/sections') ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Homepage Sections
                </Link>
                <Link to="/admin/explore-departments" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname.startsWith('/admin/explore-departments') ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Explore Navigation
                </Link>
                <Link to="/admin/reviews" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname.startsWith('/admin/reviews') ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Reviews
                </Link>
                <Link to="/admin/site-settings" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname.startsWith('/admin/site-settings') ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Site Settings
                </Link>
                <Link to="/admin/login-slider" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname.startsWith('/admin/login-slider') ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Login Slider
                </Link>
              </div>
            )}
          </div>

          {/* Website Pages */}
          <div className="pt-2">
            <button
              onClick={() => setIsWebsitePagesOpen(!isWebsitePagesOpen)}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-[#01AFD1]/10 transition-colors ${isCollapsed ? 'justify-center w-12 mx-auto' : 'justify-between'}`}
              title={isCollapsed ? "Website Pages" : ""}
            >
              <div className="flex items-center gap-2.5">
                <Globe size={18} className="text-gray-500 shrink-0" />
                {!isCollapsed && <span className="truncate">Website Pages</span>}
              </div>
              {!isCollapsed && (isWebsitePagesOpen ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />)}
            </button>
            {isWebsitePagesOpen && !isCollapsed && (
              <div className="pl-9 pr-2 space-y-0.5 mt-1">
                <Link to="/admin/website-pages/menu-manager" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname === '/admin/website-pages/menu-manager' ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Menu Manager
                </Link>
                <Link to="/admin/website-pages/about-us" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname === '/admin/website-pages/about-us' ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  About Us
                </Link>
                <Link to="/admin/website-pages/cancellation-refund" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname === '/admin/website-pages/cancellation-refund' ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Cancellation & Refund
                </Link>
                <Link to="/admin/website-pages/terms-conditions" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname === '/admin/website-pages/terms-conditions' ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Terms & Conditions
                </Link>
                <Link to="/admin/website-pages/privacy-policy" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname === '/admin/website-pages/privacy-policy' ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Privacy Policy
                </Link>
                <Link to="/admin/website-pages/contact-us" className={`block px-3 py-1.5 transition-colors font-medium ${location.pathname === '/admin/website-pages/contact-us' ? 'bg-[#01AFD1]/10 text-[#01AFD1] border-l-2 border-[#01AFD1] rounded-r-md' : 'text-gray-600 hover:bg-[#01AFD1]/10 hover:text-gray-900 rounded-md'}`} onClick={() => setSidebarOpen(false)}>
                  Contact Us
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/admin/ai-chatbot"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium mt-2 ${isCollapsed ? 'justify-center w-12 mx-auto' : ''} ${
              location.pathname.startsWith('/admin/ai-chatbot')
                ? 'bg-[#01AFD1] text-white shadow-sm'
                : 'text-gray-700 hover:bg-[#01AFD1]/10 hover:text-gray-900'
            }`}
            onClick={() => setSidebarOpen(false)}
            title={isCollapsed ? "AI Chatbot" : ""}
          >
            <MessageSquare size={18} className={`shrink-0 ${location.pathname.startsWith('/admin/ai-chatbot') ? 'text-white' : 'text-gray-500'}`} />
            {!isCollapsed && <span className="truncate">AI Chatbot</span>}
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-1 flex-shrink-0 bg-white">
          <Link
            to="/"
            target="_blank"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium ${isCollapsed ? 'justify-center w-12 mx-auto' : ''}`}
            title={isCollapsed ? "View Website" : ""}
          >
            <ExternalLink size={18} className="text-gray-400 shrink-0" />
            {!isCollapsed && <span className="truncate">View Website</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={`flex items-center w-full gap-2.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors font-medium ${isCollapsed ? 'justify-center w-12 mx-auto' : ''}`}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'md:pl-[72px]' : 'md:pl-64'}`}>
        
        {/* Global Admin Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-gray-600 focus:outline-none p-1 -ml-1 hover:text-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="text-lg font-bold text-gray-800">
              {getPageTitle()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                {adminProfile.avatar_url ? (
                  <img src={adminProfile.avatar_url} alt="Admin" className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#01AFD1] text-white flex items-center justify-center font-bold text-sm shadow-sm uppercase">
                    {getInitials(adminProfile.full_name)}
                  </div>
                )}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-sm border border-gray-200 py-1 z-[100]">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{adminProfile.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{adminProfile.email}</p>
                  </div>
                  <div className="py-1">
                    <button 
                      onClick={() => { setProfileDropdownOpen(false); setShowProfileModal(true); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserIcon size={16} className="text-gray-400" />
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => { setProfileDropdownOpen(false); setShowBrandingModal(true); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={16} className="text-gray-400" />
                      Admin Branding
                    </button>
                    <button 
                      onClick={() => { setProfileDropdownOpen(false); setShowSecurityModal(true); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Lock size={16} className="text-gray-400" />
                      Security
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 bg-slate-50 p-4 md:p-6">
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-[50vh]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#01AFD1]"></div>
            </div>
          }>
            <Outlet />
          </React.Suspense>
        </div>
      </main>

      {/* Modals */}
      {showProfileModal && (
        <AdminProfileModal
          currentProfile={adminProfile}
          onClose={() => setShowProfileModal(false)}
          onUpdate={loadProfile}
        />
      )}
      
      {showBrandingModal && (
        <AdminBrandingModal
          currentBranding={adminBranding}
          onClose={() => setShowBrandingModal(false)}
          onUpdate={loadBranding}
        />
      )}
      {showSecurityModal && (
        <AdminSecurityModal
          adminEmail={adminProfile.email}
          onClose={() => setShowSecurityModal(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
