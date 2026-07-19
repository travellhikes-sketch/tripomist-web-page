import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings. Make sure you are logged in as an admin and the bookings table exists.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, field, newValue) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ [field]: newValue })
        .eq('id', id);

      if (error) throw error;

      // Optimistic update
      setBookings(bookings.map(b => 
        b.id === id ? { ...b, [field]: newValue } : b
      ));
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert(`Failed to update ${field}.`);
    }
  };

  const handleDelete = async (id, bookingId) => {
    if (!window.confirm(`Are you sure you want to delete booking ${bookingId}?`)) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBookings(bookings.filter(b => b.id !== id));
    } catch (err) {
      console.error("Error deleting booking:", err);
      alert("Failed to delete booking.");
    }
  };

  // Filtering
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      (b.booking_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (b.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (b.phone || '').includes(searchTerm) ||
      (b.package_title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (b.destination?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || b.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Pagination Logic
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'refunded': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 mt-1">Manage customer booking enquiries and payments.</p>
        </div>
        <button 
          onClick={fetchBookings}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
          <span className="material-symbols-outlined">error</span>
          <div className="flex-1">
            <h3 className="font-bold">Error loading bookings</h3>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input 
            type="text" 
            placeholder="Search by ID, name, phone, or package..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a] transition-all"
          />
        </div>
        <div className="w-full md:w-64">
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a] transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="w-full md:w-64">
          <select 
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a] transition-all cursor-pointer"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <svg className="animate-spin h-10 w-10 text-[#136b8a] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-medium">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-gray-400">event_busy</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No bookings found</h3>
            <p className="text-gray-500">We couldn't find any bookings matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Booking ID & Date</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Customer</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Trip Details</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Booking Status</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Payment Status</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                    
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#136b8a]">{booking.booking_id}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(booking.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      {booking.source && (
                        <div className="text-[10px] uppercase font-bold text-gray-400 mt-2">Via {booking.source}</div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{booking.customer_name}</div>
                      <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        {booking.phone}
                      </div>
                      {booking.email && (
                        <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">mail</span>
                          {booking.email}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{booking.package_title}</div>
                      <div className="text-sm text-gray-600 mt-1 flex gap-3">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_month</span> {new Date(booking.travel_date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span> {booking.travellers}</span>
                      </div>
                      <div className="font-bold text-[#136b8a] mt-2">₹{booking.total_amount?.toLocaleString()}</div>
                      {booking.special_request && (
                        <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-2 inline-block max-w-full truncate" title={booking.special_request}>
                          Note: {booking.special_request}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <select
                        value={booking.booking_status}
                        onChange={(e) => handleStatusUpdate(booking.id, 'booking_status', e.target.value)}
                        className={`text-sm font-semibold px-3 py-1.5 rounded-full border appearance-none cursor-pointer outline-none ${getStatusColor(booking.booking_status)}`}
                      >
                        <option value="new">New</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-4 px-6">
                      <select
                        value={booking.payment_status}
                        onChange={(e) => handleStatusUpdate(booking.id, 'payment_status', e.target.value)}
                        className={`text-sm font-semibold px-3 py-1.5 rounded-full border appearance-none cursor-pointer outline-none ${getPaymentStatusColor(booking.payment_status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleDelete(booking.id, booking.booking_id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Booking"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{indexOfFirstBooking + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(indexOfLastBooking, filteredBookings.length)}</span> of <span className="font-semibold text-gray-900">{filteredBookings.length}</span> bookings
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-[#136b8a] text-white border border-[#136b8a]' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminBookings;
