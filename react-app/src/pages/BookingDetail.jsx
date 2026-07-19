import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${color} capitalize`}>
      {status || 'Unknown'}
    </span>
  );
}

export default function BookingDetail() {
  const { slug } = useParams(); // Using slug as id variable from route /my-trip/:slug
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBooking() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      // Fetch booking by UUID (id)
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', slug)
        .eq('user_id', session.user.id)
        .single();

      if (fetchError || !data) {
        setError('Booking not found or you do not have permission to view it.');
      } else {
        setBooking(data);
      }
      setLoading(false);
    }
    fetchBooking();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-20 w-full text-center">
          <div className="bg-red-50 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Booking Unavailable</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
          <Link to="/my-trips" className="bg-[#136b8a] text-white px-6 py-3 rounded-xl font-bold inline-block">
            Back to My Trips
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      {/* Package Banner Header */}
      <section className="bg-gradient-to-r from-[#136b8a] to-teal-600 pt-28 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1400&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="text-center md:text-left">
            <Link to="/my-trips" className="inline-flex items-center gap-2 text-teal-100 hover:text-white transition-colors mb-4 text-sm font-semibold">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to My Trips
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">
              {booking.package_title || booking.destination || 'Trip Details'}
            </h1>
            {booking.destination && (
              <p className="text-teal-50 text-lg flex items-center justify-center md:justify-start gap-1">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                {booking.destination}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-center md:items-end">
            <StatusBadge status={booking.booking_status} colorMap={statusColors} />
            <StatusBadge status={booking.payment_status} colorMap={paymentColors} />
          </div>
        </div>
      </section>

      {/* Detailed Card */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 -mt-24 pb-20 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          
          <div className="grid grid-cols-1 md:grid-cols-2 p-8 gap-10">
            {/* Left Column */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#136b8a]">info</span>
                Trip Overview
              </h3>
              
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Booking ID</p>
                  <p className="font-bold text-gray-900 text-lg">{booking.booking_id || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Travel Date</p>
                  <p className="font-semibold text-gray-800 text-base">
                    {booking.travel_date ? new Date(booking.travel_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Travellers</p>
                    <p className="font-semibold text-gray-800 text-base">{booking.travellers || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Sharing</p>
                    <p className="font-semibold text-gray-800 text-base">{booking.selected_sharing || '—'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Booked On</p>
                  <p className="font-semibold text-gray-800 text-base">
                    {booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#136b8a]">payments</span>
                Payment Summary
              </h3>

              <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Base Package Amount</span>
                  <span className="font-semibold text-gray-800">
                    {booking.total_amount ? `₹${Number(booking.total_amount).toLocaleString('en-IN')}` : '—'}
                  </span>
                </div>
                
                {booking.final_amount > booking.total_amount && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Taxes & Fees</span>
                    <span className="font-medium text-gray-700">
                      ₹{(booking.final_amount - booking.total_amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-gray-900 font-bold text-lg">Total Paid</span>
                  <span className="font-bold text-emerald-700 text-xl">
                    {booking.final_amount ? `₹${Number(booking.final_amount).toLocaleString('en-IN')}` : '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Payment Reference</p>
                  <div className="flex items-center gap-2 font-mono text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100 w-fit">
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    {booking.razorpay_payment_id || 'Not available'}
                  </div>
                </div>

                {booking.special_request && (
                  <div>
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Special Request</p>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                      "{booking.special_request}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border-t border-gray-100 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">contact_support</span>
              Need help? <a href="mailto:support@tripomist.com" className="text-[#136b8a] font-bold hover:underline">Contact Support</a>
            </p>
            <Link to="/" className="bg-[#136b8a] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0f556e] transition-colors w-full sm:w-auto text-center">
              Explore More Trips
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
