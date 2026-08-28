import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';
import { getPackageDuration } from '../utils/formatters';
import { generatePDFVoucher } from '../utils/pdfGenerator';
import { Users, Map, CreditCard } from 'lucide-react';

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
        .select('*, booking_travellers(*)')
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
      <div className="min-h-screen bg-gray-50 flex flex-col ">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#01AFD1] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading booking details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col ">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-20 w-full text-center">
          <div className="bg-red-50 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Booking Unavailable</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
          <Link to="/my-trips" className="bg-[#01AFD1] text-white px-6 py-3 rounded-xl font-bold inline-block">
            Back to My Trips
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const totalAmount = Number(booking.total_amount || 0);
  const manualDiscount = Number(booking.manual_discount_amount || 0);
  const finalPayable = Number(booking.final_amount || totalAmount);

  const amountPaid = booking.payment_status?.toLowerCase() === 'paid' ? finalPayable : Number(booking.advance_payment || 0);
  const remaining = Math.max(finalPayable - amountPaid, 0);

  const bookingStatus = booking.booking_status?.toLowerCase();
  const isCancelled = bookingStatus === 'cancelled';
  
  const packageTrackState = booking.package_track_state?.toLowerCase() || 'booking_placed';
  const trackStages = [
    { id: 'booking_placed', label: 'Booking Placed' },
    { id: 'booking_confirmed', label: 'Booking Confirmed' },
    { id: 'trip_scheduled', label: 'Trip Scheduled' },
    { id: 'full_payment_received', label: 'Full Payment Received' },
    { id: 'trip_completed', label: 'Trip Completed' }
  ];

  let currentStageIndex = trackStages.findIndex(s => s.id === packageTrackState);
  if (currentStageIndex === -1) currentStageIndex = 0;

  // Truth guard
  if (remaining > 0 && currentStageIndex >= 3) {
    currentStageIndex = 2; // Cap at Trip Scheduled
  }

  const pickupPoint = booking.pickup_point || 
    (booking.booking_travellers && booking.booking_travellers.find(t => t.is_primary)?.pickup_point) || 
    (booking.booking_travellers && booking.booking_travellers[0]?.pickup_point) || 
    'Not specified';
    
  const sharingType = booking.selected_sharing || 
    (booking.booking_travellers && booking.booking_travellers.find(t => t.is_primary)?.sharing_type) || 
    (booking.booking_travellers && booking.booking_travellers[0]?.sharing_type) || 
    'Not specified';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col ">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-r from-[#01AFD1] to-teal-600 pt-24 pb-8 relative overflow-hidden">
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
              <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                <button
                  onClick={() => generatePDFVoucher(booking, 'download')}
                  className="bg-white text-[#01AFD1] hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download Invoice
                </button>
              </div>
          </div>
        </div>
      </section>

      {/* Main Details Panel */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 mt-6 pb-20 relative z-20">

        {/* Unified Flat Details Page */}
        <div className="bg-white">
          
          {/* 1. Traveller Details */}
          <div className="p-6 md:p-8 pb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Users size={24} className="text-[#01AFD1]" />
              Traveller Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Full Name</p>
                <p className="font-semibold text-gray-800 mt-1">{booking.customer_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                <p className="font-semibold text-gray-800 mt-1">{booking.customer_email || booking.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
                <p className="font-semibold text-gray-800 mt-1">{booking.phone ? `+91 ${booking.phone}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Travellers</p>
                <p className="font-semibold text-gray-800 mt-1">{booking.travellers || 1} Person(s)</p>
              </div>
            </div>
          </div>

          {/* 2. Package Details */}
          <div className="p-6 md:p-8 pb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Map size={24} className="text-[#01AFD1]" />
              Package Details
            </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Package Title</p>
                  <p className="font-semibold text-gray-800 mt-1">{booking.package_title || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Duration</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {getPackageDuration(booking.destination, booking.package_title)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Departure Date</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {booking.travel_date ? (() => {
                      const parts = booking.travel_date.split('-');
                      if (parts.length !== 3) return booking.travel_date;
                      const monthNames = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ];
                      return `${parseInt(parts[2], 10)} ${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
                    })() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sharing Type</p>
                  <p className="font-semibold text-gray-800 mt-1 capitalize">
                    {sharingType}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pickup Point</p>
                  <p className="font-semibold text-gray-800 mt-1 capitalize">
                    {pickupPoint}
                  </p>
                </div>
              </div>
              {booking.special_request && (
                <div className="mt-5 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Special Preferences / Requests</p>
                  <p className="text-gray-700 italic">"{booking.special_request}"</p>
                </div>
              )}
          </div>

          {/* 3. Payment Details */}
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <CreditCard size={24} className="text-[#01AFD1]" />
              Payment Details
            </h3>
            {/* Unified Booking Status Badge Removed from here */}

              <div className="space-y-3 text-sm pb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-semibold text-gray-800">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                {manualDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Allowed</span>
                    <span className="font-bold">-₹{manualDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-gray-700">Final Payable</span>
                  <span className="font-bold text-gray-900">
                    ₹{finalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div className="flex justify-between mt-2">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-bold text-emerald-700">
                    ₹{amountPaid.toLocaleString('en-IN')}
                  </span>
                </div>
                
                {remaining > 0 && (
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-gray-700">Remaining</span>
                    <span className="font-bold text-rose-600">
                      ₹{remaining.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Payment Status</span>
                  <span className={`font-semibold capitalize ${booking.payment_status?.toLowerCase() === 'paid' ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {booking.payment_status || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {booking.payment_method || 'Online'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-400 break-all space-y-2 mt-4">
                {booking.razorpay_payment_id && (
                  <div>Razorpay Payment ID:<br/><span className="text-gray-600 font-semibold">{booking.razorpay_payment_id}</span></div>
                )}
                <div>Booking Date:<br/>
                  <span className="text-gray-600 font-semibold">
                    {booking.created_at ? new Date(booking.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
