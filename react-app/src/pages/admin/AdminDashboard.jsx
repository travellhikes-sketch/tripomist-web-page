import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  ArrowUpRight,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activePackages: 0,
    totalCustomers: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Fetch bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('final_amount, total_amount, payment_status, created_at, customer_name, package_title, booking_status');

        let totalRevenue = 0;
        let totalBookings = 0;
        if (bookingsData) {
          totalBookings = bookingsData.length;
          totalRevenue = bookingsData
            .filter(b => b.payment_status?.toLowerCase() === 'paid')
            .reduce((sum, b) => sum + Number(b.final_amount || b.total_amount || 0), 0);
          
          // Sort and set recent
          const sorted = [...bookingsData]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
          setRecentBookings(sorted);
        }

        // 2. Fetch packages count
        const { count: activeCount } = await supabase
          .from('Pakage')
          .select('*', { count: 'exact', head: true })
          .ilike('status', '%active%');

        // 3. Fetch customers count
        const { count: customersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalRevenue,
          totalBookings,
          activePackages: activeCount || 0,
          totalCustomers: customersCount || 0
        });
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#136b8a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#136b8a] to-teal-700 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 scale-150">
          <ShoppingBag size={250} />
        </div>
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, Admin 👋</h1>
          <p className="text-teal-100 mt-2 text-sm leading-relaxed">
            Here's what's happening with TripoMist bookings and sales today. Monitor active packages, check recent leads, or review customer activity.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <h3 className="text-2xl font-black text-gray-900">₹{stats.totalRevenue.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full w-fit">From Paid Bookings</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
            <h3 className="text-2xl font-black text-gray-900">{stats.totalBookings}</h3>
            <p className="text-[10px] text-gray-500 font-semibold">Customers reservations</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={24} />
          </div>
        </div>

        {/* Active Packages */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Active Packages</span>
            <h3 className="text-2xl font-black text-gray-900">{stats.activePackages}</h3>
            <p className="text-[10px] text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded-full w-fit">Active Status</p>
          </div>
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
            <Layers size={24} />
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Customers</span>
            <h3 className="text-2xl font-black text-gray-900">{stats.totalCustomers}</h3>
            <p className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full w-fit">Registered Profiles</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Charts & Activity Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings Chart Preview */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-lg">Sales Analytics</h3>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Yearly Activity</span>
          </div>
          
          {/* Custom SVG Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2 border-b border-gray-100 pb-2">
            {[
              { month: 'Jan', val: 12 },
              { month: 'Feb', val: 18 },
              { month: 'Mar', val: 24 },
              { month: 'Apr', val: 32 },
              { month: 'May', val: 40 },
              { month: 'Jun', val: 28 },
              { month: 'Jul', val: 45 },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-full relative bg-slate-50 group-hover:bg-slate-100 rounded-lg h-48 flex items-end overflow-hidden">
                  <div 
                    style={{ height: `${(d.val / 45) * 100}%` }}
                    className="w-full bg-[#136b8a] rounded-t-md hover:bg-teal-600 transition-all duration-500 relative"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
                      {d.val} bookings
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-950 uppercase">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings List */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Recent Bookings</h3>
              <Link to="/admin/bookings" className="text-xs text-[#136b8a] font-bold hover:underline flex items-center gap-0.5">
                View All <ArrowUpRight size={14} />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No recent bookings found.
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{b.customer_name}</h4>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{b.package_title}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-800 text-xs">₹{Number(b.final_amount || b.total_amount || 0).toLocaleString()}</span>
                      <div className={`text-[10px] font-bold capitalize mt-1 ${
                        b.booking_status?.toLowerCase() === 'confirmed' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>{b.booking_status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
