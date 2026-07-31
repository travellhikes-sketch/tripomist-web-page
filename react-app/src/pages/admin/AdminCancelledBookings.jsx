import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { X, Search, Calendar, ChevronLeft, ChevronRight, User, Package, AlertCircle } from 'lucide-react';
import AdminBookingModal from '../../components/admin/AdminBookingModal';

const AdminCancelledBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(25);

  useEffect(() => {
    fetchCancelledBookings();
  }, [monthFilter]);

  const fetchCancelledBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('bookings').select('*').eq('booking_status', 'cancelled').order('updated_at', { ascending: false });

      if (monthFilter !== 'all') {
        const now = new Date();
        let startDate, endDate;
        if (monthFilter === 'this') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        } else if (monthFilter === 'last') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        if (startDate && endDate) {
          query = query.gte('updated_at', startDate.toISOString()).lt('updated_at', endDate.toISOString());
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching cancelled bookings:', err);
      setError('Failed to load cancelled bookings.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const term = searchTerm.toLowerCase();
      return (
        (b.booking_id?.toLowerCase() || '').includes(term) ||
        (b.customer_name?.toLowerCase() || '').includes(term) ||
        (b.phone || '').includes(term) ||
        (b.package_title?.toLowerCase() || '').includes(term)
      );
    });
  }, [bookings, searchTerm]);

  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const indexOfLastBooking = validCurrentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="sticky top-0 z-10 bg-slate-50 pb-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Cancelled Bookings</h1>
          <button onClick={fetchCancelledBookings} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 text-sm font-semibold">
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md flex items-center gap-2 mb-4 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ID, customer, phone..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#136b8a]"
            />
          </div>
          <select 
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#136b8a]"
          >
            <option value="all">All Time</option>
            <option value="this">This Month</option>
            <option value="last">Last Month</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-rose-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600 mb-3"></div>
              <p className="text-sm font-medium text-gray-500">Loading cancelled bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-base font-bold text-gray-900">No cancelled bookings found</h3>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10 outline outline-1 outline-gray-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold text-gray-600">ID & Cancel Date</th>
                  <th className="py-2.5 px-4 font-semibold text-gray-600">Customer</th>
                  <th className="py-2.5 px-4 font-semibold text-gray-600">Package Details</th>
                  <th className="py-2.5 px-4 font-semibold text-gray-600">Refund Status</th>
                  <th className="py-2.5 px-4 font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-rose-50/50 transition-colors">
                    <td className="py-2 px-4">
                      <div className="font-bold text-rose-600 text-xs">{booking.booking_id}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {new Date(booking.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="font-semibold text-gray-900">{booking.customer_name}</div>
                      <div className="text-xs text-gray-500">{booking.phone}</div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="font-medium text-gray-800 text-xs truncate max-w-[200px]" title={booking.package_title}>{booking.package_title}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {booking.travel_date ? new Date(booking.travel_date).toLocaleDateString() : 'N/A'} • {booking.travellers} pax
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${booking.payment_status === 'refunded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {booking.payment_status === 'refund_pending' || booking.payment_status === 'pending' ? 'Pending Refund' : booking.payment_status === 'no_refund' ? 'No Refund' : booking.payment_status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right">
                       <button 
                         onClick={() => setSelectedBooking(booking.id)}
                         className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border border-rose-200"
                       >
                         View Details
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AdminBookingModal 
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        bookingId={selectedBooking}
      />
    </div>
  );
};

export default AdminCancelledBookings;
