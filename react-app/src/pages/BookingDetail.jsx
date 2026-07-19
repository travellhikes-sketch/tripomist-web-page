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
  const { slug } = useParams();
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
        <div className="flex-1 flex flex-col items-center justify-center py-20">
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

  // Calculate pricing breakdown
  const finalPrice = Number(booking.final_amount || 0);
  const basePrice = Number(booking.total_amount || 0) || Math.round(finalPrice / 1.05);
  const gstPrice = finalPrice - basePrice;

  // Check timeline statuses
  const isBooked = true;
  const isPaid = booking.payment_status?.toLowerCase() === 'paid';
  const isConfirmed = booking.booking_status?.toLowerCase() === 'confirmed' || booking.booking_status?.toLowerCase() === 'completed';

  const downloadPlaceholder = (type) => {
    alert(`${type} will be available for download once booking details are finalized by the operations team.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-r from-[#136b8a] to-teal-600 pt-28 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1400&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="max-w-5xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
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
          <div className="flex flex-col gap-2 items-center md:items-end bg-black/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">Status Overview</div>
            <div className="flex gap-2 mt-1">
              <StatusBadge status={booking.booking_status} colorMap={statusColors} />
              <StatusBadge status={booking.payment_status} colorMap={paymentColors} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Details Panel */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 -mt-24 pb-20 relative z-20">
        
        {/* Booking Timeline */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#136b8a]">route</span>
            Booking Timeline
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 relative">
            {/* Steps */}
            {[
              { label: 'Booking Initiated', desc: 'Details captured', active: isBooked, done: isBooked },
              { label: 'Payment Completed', desc: 'Securely received via Razorpay', active: isPaid, done: isPaid },
              { label: 'Booking Confirmed', desc: 'Confirmed by operator', active: isConfirmed, done: isConfirmed },
              { label: 'Voucher Issued', desc: 'Travel credentials ready', active: isConfirmed, done: false }
            ].map((step, idx) => (
              <div key={idx} className="flex gap-3 sm:flex-col items-start sm:items-center text-left sm:text-center group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all ${
                  step.done 
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' 
                    : step.active 
                    ? 'bg-[#136b8a] text-white' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.done ? '✓' : idx + 1}
                </div>
                <div>
                  <p className={`font-bold text-sm ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left / Middle Span: Package and Traveller Details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Package Details */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#136b8a]">explore</span>
                Package Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Package Title</p>
                  <p className="font-semibold text-gray-800 mt-1">{booking.package_title || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Destination</p>
                  <p className="font-semibold text-gray-800 mt-1">{booking.destination || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Travel Date</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {booking.travel_date ? new Date(booking.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sharing Category</p>
                  <p className="font-semibold text-gray-800 mt-1">{booking.selected_sharing || '—'}</p>
                </div>
              </div>
            </div>

            {/* Traveller Details */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#136b8a]">group</span>
                Traveller Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Primary Traveller Name</p>
                  <p className="font-semibold text-gray-800 mt-1">{booking.customer_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Travellers</p>
                  <p className="font-semibold text-gray-800 mt-1">{booking.travellers || 1} Person(s)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Contact Email</p>
                  <p className="font-semibold text-gray-800 mt-1">{booking.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Contact Phone</p>
                  <p className="font-semibold text-gray-800 mt-1">+91 {booking.phone || '—'}</p>
                </div>
              </div>

              {booking.special_request && (
                <div className="mt-5 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Special Preferences / Requests</p>
                  <p className="text-gray-700 italic">"{booking.special_request}"</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Payments & Documents */}
          <div className="space-y-6">
            
            {/* Payment Summary */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#136b8a]">payments</span>
                Payment Summary
              </h3>

              <div className="space-y-3 text-sm pb-4 border-b border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Base Price</span>
                  <span className="font-medium text-gray-800">₹{basePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST (5%)</span>
                  <span className="font-medium text-gray-800">₹{gstPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-4">
                <span className="font-bold text-gray-900 text-base">Total Amount Paid</span>
                <span className="font-bold text-emerald-700 text-lg">₹{finalPrice.toLocaleString('en-IN')}</span>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-mono text-gray-400 break-all space-y-1">
                <div>RPAY ID: {booking.razorpay_payment_id || '—'}</div>
                <div>BOOK ID: {booking.booking_id || '—'}</div>
              </div>
            </div>

            {/* Travel Documents */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#136b8a]">folder_zip</span>
                Documents
              </h3>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => downloadPlaceholder('Booking Invoice')}
                  className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-[#136b8a]/5 hover:text-[#136b8a] text-gray-700 border border-gray-200/60 rounded-xl transition-all text-sm font-semibold group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-[#136b8a]">receipt_long</span>
                    Download Invoice
                  </span>
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>

                <button
                  onClick={() => downloadPlaceholder('Travel Voucher')}
                  className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-[#136b8a]/5 hover:text-[#136b8a] text-gray-700 border border-gray-200/60 rounded-xl transition-all text-sm font-semibold group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-[#136b8a]">confirmation_number</span>
                    Download Voucher
                  </span>
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>
              </div>
            </div>

            {/* Need Help Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 text-sm text-center">
              <span className="material-symbols-outlined text-3xl text-[#136b8a] mb-2 block">contact_support</span>
              <p className="font-semibold text-gray-900">Questions about your trip?</p>
              <p className="text-xs text-gray-500 mt-1">Get in touch with our operations desk anytime.</p>
              <a href="mailto:support@tripomist.com" className="mt-3 inline-block bg-[#136b8a] hover:bg-[#0f556e] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
                Email Operations
              </a>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
