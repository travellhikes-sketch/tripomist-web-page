import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';

// Helper to get standard duration
export function getPackageDuration(destination, packageTitle) {
  const dest = (destination || packageTitle || '').toLowerCase();
  if (dest.includes('ladakh')) return '6N/7D';
  if (dest.includes('spiti')) return '5N/6D';
  if (dest.includes('kashmir')) return '4N/5D';
  if (dest.includes('andaman')) return '5N/6D';
  if (dest.includes('meghalaya')) return '6N/7D';
  if (dest.includes('manali') || dest.includes('kasol') || dest.includes('himachal')) return '4N/5D';
  if (dest.includes('jibhi')) return '5N/6D';
  if (dest.includes('chopta') || dest.includes('tungnath')) return '3N/4D';
  if (dest.includes('kedarnath')) return '4N/5D';
  if (dest.includes('udaipur')) return '3N/4D';
  if (dest.includes('kerala')) return '5N/6D';
  if (dest.includes('goa')) return '3N/4D';
  return '5N/6D';
}

const statusColors = {
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  new: 'bg-gray-100 text-gray-700 border-gray-200',
};

const paymentColors = {
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-purple-100 text-purple-700 border-purple-200',
};

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

      // Fetch bookings for statistics and next upcoming trip
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', session.user.id);

      if (!error && bookingsData) {
        // Collect package IDs to fetch real images from Supabase Pakage table
        const packageIds = [...new Set(bookingsData.map(b => b.package_id).filter(Boolean))];
        let packageMap = {};
        if (packageIds.length > 0) {
          const { data: packagesData } = await supabase
            .from('Pakage')
            .select('id, banner_image, image_url')
            .in('id', packageIds);
          if (packagesData) {
            packagesData.forEach(p => {
              packageMap[p.id] = p;
            });
          }
        }

        const bookingsWithImages = bookingsData.map(b => {
          const pkg = b.package_id ? packageMap[b.package_id] : null;
          return {
            ...b,
            banner_image: pkg?.banner_image || null,
            image_url: pkg?.image_url || null
          };
        });

        setBookings(bookingsWithImages);
      }
      setLoading(false);
    }
    loadDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-10 h-10 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-semibold text-gray-600">Loading your dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  const name = user.user_metadata?.full_name || 'Traveler';
  const firstName = name.split(' ')[0];
  const email = user.email;
  const initial = name.charAt(0).toUpperCase();
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const photoUrl = user.user_metadata?.avatar_url;

  // Calculate statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalBookings = bookings.length;
  
  const upcomingTripsList = bookings.filter(b => {
    if (b.booking_status?.toLowerCase() === 'cancelled') return false;
    const tDate = b.travel_date ? new Date(b.travel_date) : null;
    return tDate && tDate >= today && b.booking_status?.toLowerCase() !== 'completed';
  });

  const upcomingTrips = upcomingTripsList.length;

  const completedTrips = bookings.filter(b => {
    if (b.booking_status?.toLowerCase() === 'cancelled') return false;
    const tDate = b.travel_date ? new Date(b.travel_date) : null;
    return b.booking_status?.toLowerCase() === 'completed' || (tDate && tDate < today);
  }).length;

  // Calculate Amount Spent from successful bookings only (payment_status === paid)
  const amountSpent = bookings
    .filter(b => b.payment_status?.toLowerCase() === 'paid')
    .reduce((sum, b) => sum + Number(b.final_amount || 0), 0);

  // Fetch nearest upcoming confirmed trip
  const confirmedUpcoming = bookings
    .filter(b => {
      if (b.booking_status?.toLowerCase() !== 'confirmed') return false;
      const tDate = b.travel_date ? new Date(b.travel_date) : null;
      return tDate && tDate >= today;
    })
    .sort((a, b) => new Date(a.travel_date) - new Date(b.travel_date));

  const nextUpcomingTrip = confirmedUpcoming[0] || null;

  let daysLeft = null;
  if (nextUpcomingTrip && nextUpcomingTrip.travel_date) {
    const tDate = new Date(nextUpcomingTrip.travel_date);
    const diffTime = tDate.getTime() - today.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get Supabase package image URL
  const nextTripImg = nextUpcomingTrip ? (nextUpcomingTrip.banner_image || nextUpcomingTrip.image_url) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#136b8a]/95 to-teal-600/90 pt-28 pb-32 relative overflow-hidden">
        {/* Local styled placeholder background pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-950/20 opacity-40 mix-blend-overlay"></div>
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
              <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {firstName} 👋</h1>
              <p className="text-teal-50 text-base font-semibold mt-1">Ready for your next adventure?</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                <span className="text-white/80 text-xs bg-black/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  Member since {joinedDate}
                </span>
                <span className="text-white text-xs bg-[#0f556e] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 font-bold shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">explore</span>
                  {daysLeft !== null ? `Next adventure in ${daysLeft} days` : 'Your next adventure is waiting'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 text-sm cursor-pointer">
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 -mt-16 pb-24 relative z-20">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Amount Spent</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">₹{amountSpent.toLocaleString('en-IN')}</h3>
            </div>
          </div>
        </div>

        {/* Next Upcoming Trip Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#136b8a]">flight_takeoff</span>
            Next Upcoming Trip
          </h2>

          {nextUpcomingTrip ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                {/* Image panel */}
                <div className="md:w-64 md:flex-shrink-0 relative min-h-[180px] md:min-h-0">
                  {nextTripImg ? (
                    <>
                      <img
                        src={nextTripImg}
                        alt={nextUpcomingTrip.package_title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/10"></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#136b8a] to-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-white/80">luggage</span>
                    </div>
                  )}
                  {daysLeft !== null && (
                    <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10">
                      Starts in {daysLeft} days
                    </div>
                  )}
                </div>

                {/* Details panel */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-xl font-extrabold text-gray-900 leading-tight">
                          {nextUpcomingTrip.package_title}
                        </h3>
                        {nextUpcomingTrip.destination && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[16px] text-gray-400">location_on</span>
                            {nextUpcomingTrip.destination}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200 capitalize">
                          {nextUpcomingTrip.booking_status}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200 capitalize">
                          {nextUpcomingTrip.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-5 pb-5 border-b border-gray-100">
                      <div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Departure Date</span>
                        <span className="font-bold text-gray-800 mt-1 block">
                          {new Date(nextUpcomingTrip.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Duration</span>
                        <span className="font-semibold text-gray-800 mt-1 block">
                          {getPackageDuration(nextUpcomingTrip.destination, nextUpcomingTrip.package_title)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Sharing Type</span>
                        <span className="font-semibold text-gray-800 mt-1 block">
                          {nextUpcomingTrip.selected_sharing || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Booking ID</span>
                        <span className="font-mono font-bold text-[#136b8a] mt-1 block">
                          {nextUpcomingTrip.booking_id || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <Link
                      to={`/my-trip/${nextUpcomingTrip.id}`}
                      className="bg-[#136b8a] hover:bg-[#0f556e] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                    >
                      View Booking
                    </Link>
                    <Link
                      to={`/my-trip/${nextUpcomingTrip.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                    >
                      View Trip Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-[#136b8a]">explore</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No upcoming trips yet.</h3>
              <p className="text-gray-500 text-sm mb-5">Start planning your next adventure.</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">map</span>
                Explore Trips
              </Link>
            </div>
          )}
        </section>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* My Trips Card */}
          <Link to="/my-trips" className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-3xl">luggage</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">My Trips</h3>
            <p className="text-gray-500 text-sm">View upcoming, past, and cancelled package bookings</p>
          </Link>

          {/* Profile Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 overflow-hidden border-2 border-transparent group-hover:border-purple-200">
              {photoUrl ? (
                <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold">{initial}</span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-0.5">{name}</h3>
            <p className="text-gray-400 text-xs font-medium mb-4">{email}</p>
            <Link to="/profile" className="bg-[#136b8a] hover:bg-[#0f556e] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
              Edit Profile
            </Link>
          </div>

          {/* Support Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">support_agent</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Support</h3>
            <p className="text-gray-500 text-sm mb-4">Get assistance with your bookings</p>
            
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <a href="https://wa.me/919990802608" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 px-3 bg-green-50 hover:bg-green-100 rounded-xl text-green-700 transition-colors text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">chat</span>
                WhatsApp
              </a>
              <a href="tel:+919990802608" className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-700 transition-colors text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">call</span>
                Call
              </a>
              <a href="mailto:info@tripomist.com" className="flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-50 hover:bg-orange-100 rounded-xl text-orange-700 transition-colors text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">mail</span>
                Email
              </a>
              <button 
                onClick={() => window.dispatchEvent(new Event('open-chatbot'))}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-teal-50 hover:bg-teal-100 rounded-xl text-teal-750 transition-colors text-xs font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">support_agent</span>
                Live Chat
              </button>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
