import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';

export default function MyAccount() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login?redirect=/my-account');
        return;
      }
      setUser(session.user);

      // Fetch bookings for statistics
      const { data, error } = await supabase
        .from('bookings')
        .select('id, travel_date, booking_status, payment_status')
        .eq('user_id', session.user.id);

      if (!error && data) {
        setBookings(data);
      }
      setLoading(false);
    }
    loadDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-10 h-10 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-semibold text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const name = user.user_metadata?.full_name || 'Traveler';
  const email = user.email;
  const initial = name.charAt(0).toUpperCase();
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const photoUrl = user.user_metadata?.avatar_url;

  // Calculate statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalBookings = bookings.length;
  const upcomingTrips = bookings.filter(b => {
    if (b.booking_status?.toLowerCase() === 'cancelled') return false;
    const tDate = b.travel_date ? new Date(b.travel_date) : null;
    return tDate && tDate >= today && b.booking_status?.toLowerCase() !== 'completed';
  }).length;

  const completedTrips = bookings.filter(b => {
    if (b.booking_status?.toLowerCase() === 'cancelled') return false;
    const tDate = b.travel_date ? new Date(b.travel_date) : null;
    return b.booking_status?.toLowerCase() === 'completed' || (tDate && tDate < today);
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#136b8a] to-teal-600 pt-28 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1400&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="max-w-5xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-[#136b8a] shadow-xl overflow-hidden border-4 border-white">
              {photoUrl ? (
                <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {name}!</h1>
              <p className="text-teal-100 mt-1 font-medium">{email}</p>
              <p className="text-white/80 text-xs mt-2 bg-black/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                Member since {joinedDate}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </section>

      {/* Main content with Stats & Quick Links */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 -mt-16 pb-20 relative z-20">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Upcoming Trips</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{upcomingTrips}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Completed Trips</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{completedTrips}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Bookings</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalBookings}</h3>
            </div>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* My Trips */}
          <Link to="/my-trips" className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-3xl">luggage</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">My Trips</h3>
            <p className="text-gray-500 text-sm">View, track, and manage your package bookings</p>
          </Link>

          {/* Profile */}
          <Link to="/profile" className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Profile</h3>
            <p className="text-gray-500 text-sm">Update your contact details and avatar</p>
          </Link>

          {/* Support */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">support_agent</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Support</h3>
            <p className="text-gray-500 text-sm mb-4">Get assistance with your bookings</p>
            <div className="flex gap-3">
              <a href="mailto:support@tripomist.com" className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-700 transition-colors" title="Email Support">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </a>
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="w-10 h-10 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center text-green-700 transition-colors" title="WhatsApp Support">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </a>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
