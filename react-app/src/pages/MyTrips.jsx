import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';
import { getPackageDuration } from './MyAccount';
import { generatePDFVoucher } from '../utils/pdfGenerator';

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
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'

  useEffect(() => {
    async function loadBookings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login?redirect=/my-trips');
        return;
      }
      setUser(session.user);

      const { data: bookingsData, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('travel_date', { ascending: true });

      if (fetchError) {
        setError(fetchError.message || 'Failed to load your bookings.');
      } else if (bookingsData) {
        // Fetch real package images from Supabase
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
    loadBookings();
  }, [navigate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter bookings based on activeTab
  const filteredBookings = bookings.filter((b) => {
    const tDate = b.travel_date ? new Date(b.travel_date) : null;
    const status = b.booking_status?.toLowerCase();

    if (activeTab === 'cancelled') {
      return status === 'cancelled';
    }
    if (activeTab === 'completed') {
      return status === 'completed' || (tDate && tDate < today && status !== 'cancelled');
    }
    // Default 'upcoming'
    return status !== 'cancelled' && status !== 'completed' && (!tDate || tDate >= today);
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* Hero Header */}
      <section className="relative w-full bg-[#136b8a] pt-28 pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-950/20 opacity-30 mix-blend-overlay" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <span className="material-symbols-outlined text-white/80 text-5xl mb-4 block">luggage</span>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">My Trips</h1>
          <p className="text-teal-100 text-lg max-w-xl mx-auto">
            All your adventures in one place.
          </p>
        </div>
      </section>

      {/* Tabs Menu */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 flex gap-8">
          {['upcoming', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 text-sm font-bold border-b-2 uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? 'border-[#136b8a] text-[#136b8a]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab} ({
                bookings.filter((b) => {
                  const tDate = b.travel_date ? new Date(b.travel_date) : null;
                  const status = b.booking_status?.toLowerCase();
                  if (tab === 'cancelled') return status === 'cancelled';
                  if (tab === 'completed') return status === 'completed' || (tDate && tDate < today && status !== 'cancelled');
                  return status !== 'cancelled' && status !== 'completed' && (!tDate || tDate >= today);
                }).length
              })
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10">
        {/* Loading Skeletons */}
        {loading && (
          <div className="flex flex-col gap-5">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row gap-6 animate-pulse">
                <div className="md:w-44 h-32 md:h-auto bg-gray-200 rounded-xl"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 flex items-start gap-3 mb-8">
            <span className="material-symbols-outlined text-2xl">error</span>
            <div>
              <h3 className="font-bold mb-1">Failed to load bookings</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 py-20 px-4 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-4xl text-[#136b8a]">explore</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No {activeTab} trips found</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-sm mx-auto">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming trips scheduled. Start planning now!"
                : activeTab === 'completed'
                ? "You haven't completed any trips with us yet."
                : "No cancelled bookings found."}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-lg">map</span>
                Explore Trips
              </Link>
            )}
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="flex flex-col gap-5">
            {filteredBookings.map((booking) => {
              const travelDateObj = booking.travel_date ? new Date(booking.travel_date) : null;
              let tripDaysLeft = null;
              if (activeTab === 'upcoming' && travelDateObj) {
                const diffTime = travelDateObj.getTime() - today.getTime();
                tripDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }

              const tripImg = booking.banner_image || booking.image_url;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Left: package image */}
                    <div className="md:w-48 md:flex-shrink-0 relative min-h-[120px] md:min-h-0">
                      {tripImg ? (
                        <>
                          <img
                            src={tripImg}
                            alt={booking.package_title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/10"></div>
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#136b8a] to-teal-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-white/80">luggage</span>
                        </div>
                      )}
                      
                      {tripDaysLeft !== null && (
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10">
                          {tripDaysLeft} days left
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 md:py-4 md:px-5">
                      {/* Top row */}
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-0.5">
                            {booking.package_title || booking.destination || 'Trip'}
                          </h3>
                          {booking.destination && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">location_on</span>
                              {booking.destination}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge status={booking.booking_status} colorMap={statusColors} />
                          <StatusBadge status={booking.payment_status} colorMap={paymentColors} />
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-4 text-xs md:text-sm mb-3">
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5">Booking ID</span>
                          <span className="font-bold text-[#136b8a]">{booking.booking_id || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5">Travel Date</span>
                          <span className="font-semibold text-gray-800">
                            {booking.travel_date ? (() => {
                              const parts = booking.travel_date.split('-');
                              if (parts.length !== 3) return booking.travel_date;
                              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                              return `${parseInt(parts[2], 10)} ${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
                            })() : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5">Duration</span>
                          <span className="font-semibold text-gray-800">
                            {getPackageDuration(booking.destination, booking.package_title)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5">Sharing</span>
                          <span className="font-semibold text-gray-800">{booking.selected_sharing || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5">Amount Paid</span>
                          <span className="font-bold text-emerald-700 text-sm md:text-base">
                            {booking.final_amount ? `₹${Number(booking.final_amount).toLocaleString('en-IN')}` : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-wide mb-0.5">Booked On</span>
                          <span className="font-semibold text-gray-800">
                            {booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Payment reference */}
                      {booking.razorpay_payment_id && (
                        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-2.5 py-1 w-fit border border-gray-100">
                          <span className="material-symbols-outlined text-[12px]">receipt_long</span>
                          Payment Ref: {booking.razorpay_payment_id}
                        </div>
                      )}
                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-3">
                        <Link 
                          to={`/my-trip/${booking.id}`}
                          className="bg-[#136b8a] text-white px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-[#0f556e] transition-colors"
                        >
                          View Details
                        </Link>
                        <button 
                          onClick={() => generatePDFVoucher(booking, 'download')}
                          className="bg-white border border-gray-200 text-[#136b8a] px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Download Voucher
                        </button>
                        <button 
                          onClick={() => generatePDFVoucher(booking, 'open')}
                          className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          View Voucher
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
