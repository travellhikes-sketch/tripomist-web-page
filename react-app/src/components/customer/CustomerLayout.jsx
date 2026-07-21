import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
  LayoutDashboard, 
  Map, 
  CreditCard, 
  User, 
  LifeBuoy, 
  LogOut,
  ArrowLeft
} from 'lucide-react';

const CustomerLayout = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', session.user.id)
        .single();
      
      if (data) {
        setProfile(data);
      } else {
        // Fallback to user metadata
        setProfile({
          first_name: session.user.user_metadata?.first_name || 'Customer',
          last_name: session.user.user_metadata?.last_name || ''
        });
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/account', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/account/trips', icon: Map, label: 'My Trips' },
    { to: '/account/payments', icon: CreditCard, label: 'Payments' },
    { to: '/account/profile', icon: User, label: 'Profile' },
    { to: '/account/support', icon: LifeBuoy, label: 'Support' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-20">
        <div className="p-6">
          <NavLink to="/" className="flex items-center gap-2 group mb-8">
            <ArrowLeft size={16} className="text-gray-400 group-hover:text-[#136b8a] transition-colors" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 group-hover:text-[#136b8a] transition-colors">Back to Website</span>
          </NavLink>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
              {profile?.first_name?.charAt(0) || 'C'}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-xs text-gray-500">Traveler Account</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#136b8a] text-white shadow-md'
                      : 'text-gray-600 hover:bg-slate-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-2 safe-area-pb">
        <nav className="flex justify-around items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 h-12 transition-colors ${
                  isActive ? 'text-[#136b8a]' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <item.icon size={20} className="mb-1" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

    </div>
  );
};

export default CustomerLayout;
