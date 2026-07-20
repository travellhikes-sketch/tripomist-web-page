import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  ArrowUpRight,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Bell,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    totalBookings: 0,
    totalCustomers: 0,
    todayBookings: 0,
    upcomingTrips: 0,
    pendingPayments: 0,
    confirmedBookings: 0,
    cancelledBookings: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingDepartures, setUpcomingDepartures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        // Fetch bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*');
          
        // Fetch users (customers)
        const { count: customersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        let totalRevenue = 0;
        let thisMonthRevenue = 0;
        let todayBookings = 0;
        let upcomingTrips = 0;
        let pendingPayments = 0;
        let confirmedBookings = 0;
        let cancelledBookings = 0;
        
        const departuresMap = {}; // key: date_package

        if (bookingsData) {
          bookingsData.forEach(b => {
            const amount = Number(b.final_amount || b.total_amount || 0);
            const bookingDateStr = b.created_at ? b.created_at.split('T')[0] : '';
            const travelDateStr = b.travel_date || '';

            // Revenue calculation
            if (b.payment_status?.toLowerCase() === 'paid') {
              totalRevenue += amount;
              if (b.created_at && b.created_at >= thisMonthStart) {
                thisMonthRevenue += amount;
              }
            }

            // Today's bookings
            if (bookingDateStr === todayStr) {
              todayBookings++;
            }

            // Upcoming Trips & Departures Grouping
            if (travelDateStr >= todayStr && b.booking_status?.toLowerCase() !== 'cancelled') {
              upcomingTrips++;
              
              const depKey = `${travelDateStr}_${b.package_title}`;
              if (!departuresMap[depKey]) {
                departuresMap[depKey] = {
                  package: b.package_title,
                  date: travelDateStr,
                  travellers: 0,
                  bookings: 0
                };
              }
              departuresMap[depKey].travellers += Number(b.travellers || 1);
              departuresMap[depKey].bookings += 1;
            }

            // Pending Payments
            if (b.payment_status?.toLowerCase() === 'pending') {
              pendingPayments++;
            }

            // Status counts
            if (b.booking_status?.toLowerCase() === 'confirmed') {
              confirmedBookings++;
            } else if (b.booking_status?.toLowerCase() === 'cancelled') {
              cancelledBookings++;
            }
          });

          // Sort and set recent bookings (Recent Activity)
          const sorted = [...bookingsData]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 8);
          setRecentBookings(sorted);
          
          // Sort upcoming departures
          const sortedDeps = Object.values(departuresMap).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
          setUpcomingDepartures(sortedDeps);
        }

        setStats({
          totalRevenue,
          thisMonthRevenue,
          totalBookings: bookingsData ? bookingsData.length : 0,
          totalCustomers: customersCount || 0,
          todayBookings,
          upcomingTrips,
          pendingPayments,
          confirmedBookings,
          cancelledBookings
        });
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const getRelativeTime = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  const getDaysRemaining = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Compact Dashboard Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {getGreeting()}, Admin 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here’s what’s happening with TripoMist today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm font-semibold text-gray-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-gray-100">
            {currentDate}
          </div>
          <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <div className="w-9 h-9 bg-[#136b8a] text-white rounded-lg flex items-center justify-center shadow-sm">
            <UserIcon size={18} />
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">This Month</span>
            <h3 className="text-2xl font-bold text-[#136b8a] mt-1">₹{stats.thisMonthRevenue.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-[#136b8a] rounded-lg"><Calendar size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBookings}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><ShoppingBag size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Customers</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</h3>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Users size={20} /></div>
        </div>
      </div>

      {/* Secondary Compact Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Today's Bookings", val: stats.todayBookings, color: "text-[#136b8a] bg-blue-50 border-blue-100" },
          { label: "Upcoming Trips", val: stats.upcomingTrips, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { label: "Pending Payments", val: stats.pendingPayments, color: "text-amber-600 bg-amber-50 border-amber-100" },
          { label: "Confirmed", val: stats.confirmedBookings, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          { label: "Cancelled", val: stats.cancelledBookings, color: "text-rose-600 bg-rose-50 border-rose-100" }
        ].map((s, idx) => (
          <div key={idx} className={`p-3 rounded-lg border text-center flex flex-col justify-center items-center shadow-sm ${s.color}`}>
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-80 mb-0.5">{s.label}</span>
            <span className="text-lg font-bold">{s.val}</span>
          </div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Departures */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-sm">Upcoming Departures</h3>
            <Link to="/admin/bookings" className="text-xs text-[#136b8a] font-semibold hover:underline flex items-center">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="p-4 flex-1">
            {upcomingDepartures.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No upcoming trips scheduled.</div>
            ) : (
              <div className="space-y-3">
                {upcomingDepartures.map((dep, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="min-w-0 flex-1 pr-4">
                      <h4 className="font-semibold text-gray-900 text-sm truncate" title={dep.package}>{dep.package}</h4>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(dep.date).toLocaleDateString()}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="flex items-center gap-1"><Users size={12}/> {dep.travellers} pax ({dep.bookings} bookings)</span>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{getDaysRemaining(dep.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-sm">Recent Activity</h3>
            <Link to="/admin/bookings" className="text-xs text-[#136b8a] font-semibold hover:underline flex items-center">
              Manage <ChevronRight size={14} />
            </Link>
          </div>
          <div className="p-4 flex-1 overflow-auto max-h-[400px]">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No recent activity.</div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {b.booking_status === 'cancelled' ? (
                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><XCircle size={12}/></div>
                      ) : b.payment_status === 'paid' ? (
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle size={12}/></div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><ShoppingBag size={12}/></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{b.customer_name}</span> 
                        {b.booking_status === 'cancelled' ? ' cancelled booking for ' : ' booked '}
                        <span className="font-medium text-gray-700">{b.package_title}</span>
                      </p>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>₹{Number(b.final_amount || b.total_amount || 0).toLocaleString()}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className={`capitalize font-semibold ${b.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>{b.payment_status}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>{getRelativeTime(b.created_at)}</span>
                      </div>
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
