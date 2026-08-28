import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Link, useOutletContext } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Ticket,
  Copy
} from 'lucide-react';
import { getStatusBadge, getPaymentBadge } from '../../utils/statusHelpers';

function formatMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('en-IN')
    : '0';
}

const CustomerTrips = () => {
  const { heroImage } = useOutletContext() || {};
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, completed, cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error: linkError } = await supabase.rpc('link_my_bookings');
      if (linkError) {
        console.error('Failed to link historical bookings:', linkError.message);
      }

      const { data: bData, error: bErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('travel_date', { ascending: false });

      if (!bErr && bData) setBookings(bData);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Voucher code copied to clipboard!');
  };

  const now = new Date();

  const filteredTrips = bookings.filter(b => {
    const isCancelled = b.booking_status === 'cancelled';
    const isPast = new Date(b.travel_date) < now;

    if (activeTab === 'upcoming') return !isPast && !isCancelled;
    if (activeTab === 'completed') return isPast && !isCancelled;
    if (activeTab === 'cancelled') return isCancelled;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01AFD1]"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden min-h-[160px] flex flex-col justify-center p-8 bg-[#01AFD1]">
        {heroImage && (
          <>
            <img src={heroImage} alt="Dashboard Hero" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </>
        )}
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white">My Trips</h1>
          <p className="text-gray-200 mt-2 text-sm">View and manage all your past and upcoming travels.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 w-fit">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'upcoming' ? 'bg-[#01AFD1] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'completed' ? 'bg-[#01AFD1] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'cancelled' ? 'bg-[#01AFD1] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          Cancelled
        </button>
      </div>

      {/* Trip List */}
      <div className="space-y-4">
        {activeTab !== 'vouchers' && (
          filteredTrips.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <MapPin size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No {activeTab} trips found</h3>
              <p className="text-gray-500 text-sm max-w-sm">When you book a trip, it will appear here.</p>
            </div>
          ) : (
            filteredTrips.map(trip => (
              <div key={trip.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col md:flex-row">
                <div className="md:w-48 bg-slate-100 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-200">
                  <MapPin size={40} className="text-slate-300" />
                </div>

                <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-[#01AFD1] transition-colors">{trip.package_title}</h3>
                      {getStatusBadge(trip.booking_status === 'cancelled' ? 'cancelled' : (new Date(trip.travel_date) < now ? 'completed' : 'confirmed'))}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar size={16} className="text-gray-400" />
                        {new Date(trip.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users size={16} className="text-gray-400" />
                        {trip.travellers} Person(s)
                      </div>
                    </div>

                    {trip.booking_status === 'cancelled' && (
                      <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 mt-2 space-y-1.5 text-sm">
                        {trip.cancellation_reason && (
                          <p className="text-rose-900"><span className="font-semibold">Reason:</span> {trip.cancellation_reason}</p>
                        )}
                        {trip.cancelled_at && (
                          <p className="text-rose-800"><span className="font-semibold">Cancelled On:</span> {new Date(trip.cancelled_at).toLocaleDateString('en-IN')}</p>
                        )}
                        {trip.refund_status && (
                          <p className="text-rose-800"><span className="font-semibold">Refund Status:</span> {trip.refund_status}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Booking ID: <span className=" font-bold text-gray-700">{trip.booking_id || trip.booking_reference || trip.id}</span></p>
                    </div>
                    <Link
                      to={`/account/trips/${trip.id}`}
                      className="flex items-center gap-1 text-[#01AFD1] font-bold text-sm hover:underline"
                    >
                      View Details <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

    </div>
  );
};

export default CustomerTrips;
