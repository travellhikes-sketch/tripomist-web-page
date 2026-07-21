import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import { 
  Map, 
  CreditCard, 
  CalendarClock, 
  Search,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const CustomerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimForm, setClaimForm] = useState({ booking_id: '' });
  const [claimStatus, setClaimStatus] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('travel_date', { ascending: false });
        
      if (!error && data) {
        setBookings(data);
      }
    }
    setLoading(false);
  };

  const upcomingTrips = bookings.filter(b => new Date(b.travel_date) >= new Date() && b.booking_status !== 'cancelled');
  const pastTrips = bookings.filter(b => new Date(b.travel_date) < new Date() && b.booking_status !== 'cancelled');
  const latestTrip = upcomingTrips.length > 0 ? upcomingTrips[upcomingTrips.length - 1] : (pastTrips.length > 0 ? pastTrips[0] : null);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimStatus('loading');
    
    try {
      const { data, error } = await supabase.rpc('claim_booking', {
        p_booking_id: claimForm.booking_id
      });
      
      if (error) throw error;
      
      if (data?.success) {
        setClaimStatus('success');
        fetchBookings(); // Refresh list
        setTimeout(() => setShowClaimModal(false), 2000);
      } else {
        setClaimStatus('error');
      }
    } catch (err) {
      console.error(err);
      setClaimStatus('error');
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'cancelled': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a]"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-500 mt-1">Manage your trips, payments, and profile from one place.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Map size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Trips</p>
          <h3 className="text-2xl font-bold text-gray-900">{bookings.length}</h3>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CalendarClock size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Upcoming</p>
          <h3 className="text-2xl font-bold text-gray-900">{upcomingTrips.length}</h3>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800 mb-1">Booked over Phone/WhatsApp?</p>
              <p className="text-xs text-gray-500 max-w-[200px]">Link your manual booking to view it here.</p>
            </div>
            <button 
              onClick={() => setShowClaimModal(true)}
              className="bg-[#136b8a] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#0f556e] transition-colors flex items-center gap-1 shrink-0"
            >
              <Search size={14} /> Find My Booking
            </button>
          </div>
        </div>
      </div>

      {/* Latest Trip */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Latest Trip</h2>
          {bookings.length > 0 && (
            <Link to="/account/trips" className="text-sm text-[#136b8a] font-semibold hover:underline flex items-center">
              View all <ChevronRight size={16} />
            </Link>
          )}
        </div>
        
        {latestTrip ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/3 bg-gray-100 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-200">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border mb-3 w-fit ${getStatusColor(latestTrip.booking_status)}`}>
                {latestTrip.booking_status === 'confirmed' && <CheckCircle size={14} />}
                {latestTrip.booking_status === 'cancelled' && <XCircle size={14} />}
                {latestTrip.booking_status === 'new' && <Clock size={14} />}
                {latestTrip.booking_status}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{latestTrip.package_title}</h3>
              <p className="text-sm font-semibold text-gray-500 mb-4">{new Date(latestTrip.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              
              <Link to={`/account/trips/${latestTrip.id}`} className="mt-auto w-full text-center bg-gray-900 text-white font-bold py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm">
                View Itinerary
              </Link>
            </div>
            <div className="md:w-2/3 p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                <p className="font-mono font-bold text-gray-900 text-sm">{latestTrip.booking_id || latestTrip.booking_reference || latestTrip.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Travellers</p>
                <p className="font-bold text-gray-900 text-sm">{latestTrip.travellers} Person(s)</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                <p className="font-bold text-gray-900 text-sm">₹{latestTrip.total_amount?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                <p className="font-bold text-gray-900 text-sm capitalize">{latestTrip.payment_status}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Map size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No trips yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">Looks like you haven't booked any trips with us yet, or they haven't been linked to your account.</p>
            <Link to="/" className="bg-[#136b8a] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#0f556e] transition-colors">
              Explore Packages
            </Link>
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Find My Booking</h3>
              <p className="text-sm text-gray-500 mb-6">Enter your phone number and the Booking ID you received over WhatsApp/Email.</p>
              
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Booking ID</label>
                  <input required type="text" placeholder="e.g. MNL123456" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={claimForm.booking_id} onChange={e=>setClaimForm({...claimForm, booking_id: e.target.value})}/>
                </div>

                {claimStatus === 'error' && (
                  <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-xs flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Booking Not Found</p>
                      <p className="mt-1">No booking matches your ID, or the booking is already claimed.</p>
                    </div>
                  </div>
                )}
                
                {claimStatus === 'success' && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs flex items-start gap-2">
                    <CheckCircle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Booking Claimed!</p>
                      <p className="mt-1">The booking has been successfully linked to your account.</p>
                    </div>
                  </div>
                )}
                
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowClaimModal(false)} className="flex-1 px-4 py-2 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm">Cancel</button>
                  <button type="submit" disabled={claimStatus === 'loading'} className="flex-1 px-4 py-2 font-bold text-white bg-[#136b8a] hover:bg-[#0f556e] rounded-lg transition-colors text-sm disabled:opacity-50">
                    {claimStatus === 'loading' ? 'Searching...' : 'Find Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;
