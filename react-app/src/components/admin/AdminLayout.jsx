import React, { useState } from 'react';
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
  Globe
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Packages', path: '/admin/packages', icon: Package },
    { name: 'Bookings', path: '/admin/bookings', icon: CalendarDays },
    { name: 'Checkout Leads', path: '/admin/checkout-leads', icon: UserPlus },
    { name: 'Customers', path: '/admin/users', icon: Users },
    { name: 'Banners', path: '/admin/banners', icon: Image },
    { name: 'Destinations', path: '/admin/destinations', icon: MapPin },
    { name: 'Interests', path: '/admin/interests', icon: Heart },
    { name: 'Sections', path: '/admin/sections', icon: Layout },
    { name: 'Site Settings', path: '/admin/site-settings', icon: Globe },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

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
        className={`fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-5 border-b border-gray-100">
          <span className="text-base font-bold text-gray-800 tracking-tight">TripoMist Admin</span>
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700" 
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-3.5rem)] justify-between">
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-slate-100 text-slate-900 font-semibold' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} className={isActive ? 'text-slate-800' : 'text-gray-400'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100 space-y-1">
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header for Mobile */}
        <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-100 md:hidden z-10">
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
