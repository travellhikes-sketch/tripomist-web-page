import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';

const CustomerTrips = () => {
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

  const now = new Date();
  
  const filteredTrips = bookings.filter(b => {
    const isCancelled = b.booking_status === 'cancelled';
    const isPast = new Date(b.travel_date) < now;
    
    if (activeTab === 'cancelled') return isCancelled;
    if (activeTab === 'completed') return isPast && !isCancelled;
    return !isPast && !isCancelled; // upcoming
  });

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'confirmed') return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded"><CheckCircle size={12}/> Confirmed</span>;
    if (s === 'cancelled') return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded"><XCircle size={12}/> Cancelled</span>;
    return <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded"><Clock size={12}/> Pending</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a]"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
        <p className="text-gray-500 mt-1">View and manage all your past and upcoming travels.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 w-fit">
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'upcoming' ? 'bg-[#136b8a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'completed' ? 'bg-[#136b8a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          Completed
        </button>
        <button 
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'cancelled' ? 'bg-[#136b8a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          Cancelled
        </button>
      </div>

      {/* Trip List */}
      <div className="space-y-4">
        {filteredTrips.length === 0 ? (
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
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-[#136b8a] transition-colors">{trip.package_title}</h3>
                    {getStatusBadge(trip.booking_status)}
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
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Booking ID: <span className="font-mono font-bold text-gray-700">{trip.booking_id || trip.booking_reference || trip.id}</span></p>
                  </div>
                  <Link 
                    to={`/account/trips/${trip.id}`} 
                    className="flex items-center gap-1 text-[#136b8a] font-bold text-sm hover:underline"
                  >
                    View Details <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default CustomerTrips;
