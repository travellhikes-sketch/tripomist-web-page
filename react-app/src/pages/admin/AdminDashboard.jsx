import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  CreditCard,
  Bell,
  User as UserIcon,
  ChevronRight,
  Plus,
  Download,
  ListTodo,
  Phone,
  MessageCircle,
  AlertCircle,
  X
} from 'lucide-react';
import AdminManualBookingModal from '../../components/admin/AdminManualBookingModal';

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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Booking Modal State
  const [showManualBooking, setShowManualBooking] = useState(false);
  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // Fetch bookings, leads, customers
      const [bookingsRes, leadsRes, usersRes] = await Promise.all([
        supabase.from('bookings').select('*'),
        supabase.from('checkout_leads').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      const bookingsData = bookingsRes.data || [];
      const leadsData = leadsRes.data || [];
      
      let totalRevenue = 0, thisMonthRevenue = 0, todayBookings = 0;
      let upcomingTrips = 0, pendingPayments = 0, confirmedBookings = 0, cancelledBookings = 0;
      const departuresMap = {};
      const generatedTasks = [];

      bookingsData.forEach(b => {
        const amount = Number(b.final_amount || b.total_amount || 0);
        const bookingDateStr = b.created_at ? b.created_at.split('T')[0] : '';
        const travelDateStr = b.travel_date || '';

        if (b.payment_status?.toLowerCase() === 'paid') {
          totalRevenue += amount;
          if (b.created_at && b.created_at >= thisMonthStart) thisMonthRevenue += amount;
        }

        if (bookingDateStr === todayStr) todayBookings++;

        if (travelDateStr >= todayStr && b.booking_status?.toLowerCase() !== 'cancelled') {
          upcomingTrips++;
          const depKey = `${travelDateStr}_${b.package_title}`;
          if (!departuresMap[depKey]) {
            departuresMap[depKey] = {
              package: b.package_title,
              date: travelDateStr,
              travellers: 0,
              bookings: [],
              id: depKey
            };
          }
          departuresMap[depKey].travellers += Number(b.travellers || 1);
          departuresMap[depKey].bookings.push(b);
        }

        if (b.payment_status?.toLowerCase() === 'pending' && b.booking_status?.toLowerCase() !== 'cancelled') {
          pendingPayments++;
          generatedTasks.push({
            id: `pay_${b.id}`,
            priority: 1,
            type: 'pending_payment',
            title: `Pending Payment: ${b.customer_name}`,
            desc: `₹${amount.toLocaleString('en-IN')} for ${b.package_title}`,
            phone: b.phone,
            actionData: b
          });
        }

        if (b.booking_status?.toLowerCase() === 'confirmed') confirmedBookings++;
        else if (b.booking_status?.toLowerCase() === 'cancelled') cancelledBookings++;
        
        if (b.booking_status?.toLowerCase() === 'new' || b.booking_status === null) {
          generatedTasks.push({
            id: `unconf_${b.id}`,
            priority: 3,
            type: 'unconfirmed_booking',
            title: `Unconfirmed Booking: ${b.customer_name}`,
            desc: `Needs review for ${b.package_title}`,
            phone: b.phone,
            actionData: b
          });
        }
      });

      // Process Leads for tasks
      leadsData.forEach(l => {
        if (l.lead_status !== 'converted' && l.lead_status !== 'contacted' && l.lead_status !== 'not_interested') {
          const lastActivity = new Date(l.last_activity_at || l.created_at);
          if ((today - lastActivity) > 30 * 60 * 1000) { // 30 mins
            generatedTasks.push({
              id: `lead_${l.id}`,
              priority: 2,
              type: 'new_lead',
              title: `Abandoned Cart: ${l.customer_name || 'Guest'}`,
              desc: `Left at ${l.current_step} for ${l.package_title || 'a trip'}`,
              phone: l.phone,
              actionData: l
            });
          }
        }
      });

      const sortedDeps = Object.values(departuresMap).sort((a, b) => new Date(a.date) - new Date(b.date));
      setUpcomingDepartures(sortedDeps.slice(0, 5));

      sortedDeps.forEach(dep => {
        const diff = Math.ceil((new Date(dep.date) - today) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 3) {
          generatedTasks.push({
            id: `trip_${dep.id}`,
            priority: 4,
            type: 'upcoming_trip',
            title: `Trip within 3 days: ${dep.package}`,
            desc: `Departs ${new Date(dep.date).toLocaleDateString()} with ${dep.travellers} pax`,
            phone: null,
            actionData: dep
          });
        }
      });

      generatedTasks.sort((a, b) => a.priority - b.priority);
      setTasks(generatedTasks);

      const sortedBookings = [...bookingsData]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8);
      setRecentBookings(sortedBookings);

      setStats({
        totalRevenue,
        thisMonthRevenue,
        totalBookings: bookingsData.length,
        totalCustomers: usersRes.count || 0,
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
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  };

  const handleAction = async (task, action) => {
    try {
      if (action === 'mark_paid' && task.type === 'pending_payment') {
        await supabase.from('bookings').update({ payment_status: 'paid' }).eq('id', task.actionData.id);
        loadDashboardData();
      } else if (action === 'confirm' && task.type === 'unconfirmed_booking') {
        await supabase.from('bookings').update({ booking_status: 'confirmed' }).eq('id', task.actionData.id);
        loadDashboardData();
      } else if (action === 'mark_contacted' && task.type === 'new_lead') {
        await supabase.from('checkout_leads').update({ lead_status: 'contacted' }).eq('id', task.actionData.id);
        loadDashboardData();
      }
    } catch (err) {
      console.error('Action failed:', err);
      alert('Failed to perform action.');
    }
  };

  const exportTripCSV = (dep) => {
    if (!dep.bookings || dep.bookings.length === 0) return;
    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Travellers', 'Sharing', 'Payment Status'];
    const rows = dep.bookings.map(b => [
      b.booking_id,
      b.customer_name,
      b.phone,
      b.travellers || 1,
      b.selected_sharing || 'N/A',
      b.payment_status
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `manifest_${dep.package}_${dep.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Quick Actions Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {getGreeting()}, Admin 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here’s your daily operations center.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/packages" className="px-3 py-2 text-sm font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-colors text-gray-700">
            <Plus size={16}/> Add Package
          </Link>
          <button onClick={() => setShowManualBooking(true)} className="px-3 py-2 text-sm font-semibold bg-[#136b8a] text-white rounded-lg hover:bg-[#0f556e] flex items-center gap-1.5 transition-colors">
            <Plus size={16}/> New Booking
          </button>
          <Link to="/admin/bookings" className="px-3 py-2 text-sm font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-colors text-gray-700">
            <ListTodo size={16}/> All Bookings
          </Link>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Revenue</span>
          <h3 className="text-xl font-bold text-gray-900 mt-1">₹{stats.totalRevenue.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">This Month</span>
          <h3 className="text-xl font-bold text-[#136b8a] mt-1">₹{stats.thisMonthRevenue.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Bookings</span>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{stats.totalBookings}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Customers</span>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</h3>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Daily Task Queue (Priority) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-red-50/30 rounded-t-xl">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500"/> Action Required Queue
              </h3>
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{tasks.length} pending</span>
            </div>
            <div className="p-0">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">All caught up! No pending actions.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            task.priority === 1 ? 'bg-red-100 text-red-700' :
                            task.priority === 2 ? 'bg-orange-100 text-orange-700' :
                            task.priority === 3 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>P{task.priority}</span>
                          <h4 className="font-semibold text-gray-900 text-sm">{task.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500">{task.desc}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {task.phone && (
                          <>
                            <a href={`tel:+${formatPhone(task.phone)}`} className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"><Phone size={14}/></a>
                            <a href={`https://wa.me/${formatPhone(task.phone)}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-green-100 hover:bg-green-200 text-green-700 transition-colors"><MessageCircle size={14}/></a>
                          </>
                        )}
                        {task.type === 'pending_payment' && (
                          <button onClick={() => handleAction(task, 'mark_paid')} className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors">Mark Paid</button>
                        )}
                        {task.type === 'unconfirmed_booking' && (
                          <button onClick={() => handleAction(task, 'confirm')} className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors">Confirm</button>
                        )}
                        {task.type === 'new_lead' && (
                          <button onClick={() => handleAction(task, 'mark_contacted')} className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors">Mark Contacted</button>
                        )}
                        {task.type === 'upcoming_trip' && (
                          <button onClick={() => exportTripCSV(task.actionData)} className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors">Export CSV</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Upcoming Departures Module */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-sm">Upcoming Departures</h3>
            </div>
            <div className="p-4">
              {upcomingDepartures.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No upcoming trips scheduled.</div>
              ) : (
                <div className="space-y-3">
                  {upcomingDepartures.map((dep, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{dep.package}</h4>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded"><Calendar size={12}/> {new Date(dep.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1 font-medium"><Users size={12}/> {dep.travellers} pax ({dep.bookings.length} bookings)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          const phones = dep.bookings.map(b => formatPhone(b.phone)).filter(Boolean).join(',');
                          navigator.clipboard.writeText(phones);
                          alert('Phone numbers copied for group message!');
                        }} className="text-xs font-bold px-2.5 py-1.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-md transition-colors flex items-center gap-1"><MessageCircle size={12}/> Copy Phones</button>
                        <button onClick={() => exportTripCSV(dep)} className="text-xs font-bold px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-1"><Download size={12}/> CSV</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Stats & Recent */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Today's Bookings", val: stats.todayBookings, color: "text-[#136b8a] bg-blue-50 border-blue-100" },
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Recent Bookings</h3>
            </div>
            <div className="p-4 overflow-auto max-h-[400px]">
              {recentBookings.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No recent activity.</div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 font-semibold">{b.customer_name}</p>
                        <p className="text-xs text-gray-600 truncate">{b.package_title}</p>
                        <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-1">
                          <span className={`capitalize font-bold ${b.booking_status === 'confirmed' ? 'text-green-600' : 'text-amber-600'}`}>{b.booking_status}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>₹{Number(b.final_amount || b.total_amount || 0).toLocaleString()}</span>
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

      <AdminManualBookingModal 
        isOpen={showManualBooking} 
        onClose={() => setShowManualBooking(false)} 
        onSuccess={loadDashboardData} 
      />
    </div>
  );
};

export default AdminDashboard;
