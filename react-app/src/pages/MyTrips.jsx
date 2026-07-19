import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';

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

function StatusBadge({ status, colorMap }) {
  const color = colorMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color} capitalize`}>
      {status || 'Unknown'}
    </span>
  );
}

export default function MyTrips() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadBookings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login?redirect=/my-trips');
        return;
      }
      setUser(session.user);

      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message || 'Failed to load your bookings.');
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    }
    loadBookings();
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative w-full bg-[#136b8a] pt-28 pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <span className="material-symbols-outlined text-white/80 text-5xl mb-4 block">luggage</span>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">My Trips</h1>
          <p className="text-teal-100 text-lg max-w-xl mx-auto">
            All your confirmed adventures with TripoMist, in one place.
          </p>
        </div>
      </section>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <svg className="animate-spin h-10 w-10 text-[#136b8a] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="font-medium">Loading your trips...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 flex items-start gap-3 mb-8">
            <span className="material-symbols-outlined text-2xl">error</span>
            <div>
              <h3 className="font-bold mb-1">Failed to load bookings</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && bookings.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 py-20 px-4 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-4xl text-[#136b8a]">explore</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No bookings yet</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-sm mx-auto">
              No bookings yet. Explore our trips and plan your next adventure.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-lg">map</span>
              Explore Trips
            </Link>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && bookings.length > 0 && (
          <div className="flex flex-col gap-5">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left: image strip */}
                  <div className="md:w-44 md:flex-shrink-0 bg-gradient-to-br from-[#136b8a] to-teal-600 flex items-center justify-center p-6 min-h-[120px] md:min-h-0">
                    <span className="material-symbols-outlined text-5xl text-white/80">luggage</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 md:p-6">
                    {/* Top row */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-0.5">
                          {booking.package_title || booking.destination || 'Trip'}
                        </h3>
                        {booking.destination && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {booking.destination}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={booking.booking_status} colorMap={statusColors} />
                        <StatusBadge status={booking.payment_status} colorMap={paymentColors} />
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-0.5">Booking ID</span>
                        <span className="font-bold text-[#136b8a]">{booking.booking_id || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-0.5">Travel Date</span>
                        <span className="font-semibold text-gray-800">
                          {booking.travel_date ? new Date(booking.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-0.5">Travellers</span>
                        <span className="font-semibold text-gray-800">{booking.travellers || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-0.5">Sharing</span>
                        <span className="font-semibold text-gray-800">{booking.selected_sharing || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-0.5">Amount Paid</span>
                        <span className="font-bold text-emerald-700 text-base">
                          {booking.final_amount ? `₹${Number(booking.final_amount).toLocaleString('en-IN')}` : '—'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-0.5">Booked On</span>
                        <span className="font-semibold text-gray-800">
                          {booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Payment reference */}
                    {booking.razorpay_payment_id && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-1.5 w-fit border border-gray-100">
                        <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                        Payment Ref: {booking.razorpay_payment_id}
                      </div>
                    )}
                    {/* Action Buttons */}
                    <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-3">
                      <Link 
                        to={`/my-trip/${booking.id}`}
                        className="bg-[#136b8a] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#0f556e] transition-colors"
                      >
                        View Details
                      </Link>
                      <Link 
                        to="/"
                        className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                      >
                        Explore More Trips
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
