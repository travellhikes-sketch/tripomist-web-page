import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { generatePDFVoucher } from '../../utils/pdfGenerator';
import { 
  X, Check, XCircle, Copy, Download, Search, 
  Calendar, CreditCard, ChevronLeft, ChevronRight, User, Package, Clock,
  MoreVertical, Phone, MessageCircle
} from 'lucide-react';

import AdminBookingModal from '../../components/admin/AdminBookingModal';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [editBookingId, setEditBookingId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all'); // all | this | last | custom
  const [customMonth, setCustomMonth] = useState(''); // format YYYY-MM
  const [packageFilter, setPackageFilter] = useState('all');
  
  // Drawer state
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(25);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  useEffect(() => {
    fetchBookings();
  }, [monthFilter, customMonth]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });

      if (monthFilter !== 'all') {
        const now = new Date();
        let startDate, endDate;
        if (monthFilter === 'this') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        } else if (monthFilter === 'last') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (monthFilter === 'custom' && customMonth) {
          const [year, month] = customMonth.split('-').map(Number);
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 1);
        }
        if (startDate && endDate) {
          query = query.gte('created_at', startDate.toISOString()).lt('created_at', endDate.toISOString());
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
      setSelectedRowIds(new Set());
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings.');
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

      setBookings(prev => prev.map(b => 
        b.id === id ? { ...b, [field]: newValue } : b
      ));
      
      if (selectedBooking?.id === id) {
        setSelectedBooking(prev => ({ ...prev, [field]: newValue }));
      }
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert(`Failed to update ${field}.`);
    }
  };

  const handleBulkAction = async (status) => {
    if (selectedRowIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to mark ${selectedRowIds.size} bookings as ${status}?`)) return;

    try {
      setLoading(true);
      const idsArray = Array.from(selectedRowIds);
      
      for (const id of idsArray) {
         await supabase.from('bookings').update({ booking_status: status }).eq('id', id);
      }
      
      setBookings(prev => prev.map(b => 
        selectedRowIds.has(b.id) ? { ...b, booking_status: status } : b
      ));
      setSelectedRowIds(new Set());
    } catch (err) {
      console.error('Bulk update error:', err);
      alert('Failed to perform bulk update.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (booking, actionType) => {
    switch (actionType) {
      case 'confirm':
        await handleStatusUpdate(booking.id, 'booking_status', 'confirmed');
        break;
      case 'cancel':
        if (window.confirm('Are you sure you want to cancel this booking?')) {
          await handleStatusUpdate(booking.id, 'booking_status', 'cancelled');
        }
        break;
      case 'markPaid':
        await handleStatusUpdate(booking.id, 'payment_status', 'paid');
        break;
      case 'copyPhone':
        navigator.clipboard.writeText(booking.phone);
        alert('Phone number copied!');
        break;
      case 'copyEmail':
        navigator.clipboard.writeText(booking.email || '');
        alert('Email copied!');
        break;
      default:
        break;
    }
  };

  const exportToCSV = () => {
    if (filteredBookings.length === 0) return;
    const headers = ['Booking ID', 'Booking Date', 'Customer', 'Phone', 'Email', 'Package', 'Travel Date', 'Travellers', 'Amount', 'Payment Status', 'Booking Status', 'Razorpay ID'];
    const rows = filteredBookings.map(b => [
      b.booking_id,
      new Date(b.created_at).toLocaleDateString(),
      b.customer_name,
      b.phone,
      b.email || '',
      b.package_title,
      b.travel_date ? new Date(b.travel_date).toLocaleDateString() : '',
      b.travellers || 1,
      b.final_amount || b.total_amount || 0,
      b.payment_status,
      b.booking_status,
      b.razorpay_payment_id || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derive unique packages for filter
  const uniquePackages = useMemo(() => {
    return Array.from(new Set(bookings.map(b => b.package_title))).filter(Boolean);
  }, [bookings]);

  // Filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (b.booking_id?.toLowerCase() || '').includes(term) ||
        (b.customer_name?.toLowerCase() || '').includes(term) ||
        (b.phone || '').includes(term) ||
        (b.package_title?.toLowerCase() || '').includes(term);
        
      const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || b.payment_status === paymentFilter;
      const matchesPackage = packageFilter === 'all' || b.package_title === packageFilter;
      
      return matchesSearch && matchesStatus && matchesPayment && matchesPackage;
    });
  }, [bookings, searchTerm, statusFilter, paymentFilter, packageFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const indexOfLastBooking = validCurrentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);

  // Row selection handlers
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(currentBookings.map(b => b.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const toggleSelectRow = (id) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRowIds(newSet);
  };

  const getStatusBadge = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-rose-100 text-rose-700',
      completed: 'bg-slate-100 text-slate-700'
    };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${colors[status] || colors.new}`}>{status}</span>;
  };

  const getPaymentBadge = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      paid: 'bg-emerald-100 text-emerald-700',
      refunded: 'bg-purple-100 text-purple-700',
      failed: 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${colors[status] || colors.pending}`}>{status}</span>;
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Sticky Header & Toolbar */}
      <div className="sticky top-0 z-10 bg-slate-50 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bookings Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowManualBooking(true)}
              className="flex items-center gap-1.5 bg-[#136b8a] border border-[#136b8a] text-white px-3 py-1.5 rounded-md hover:bg-[#0f556e] transition-colors shadow-sm text-sm font-semibold"
            >
              New Booking
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm font-semibold"
            >
              <Download size={16} /> Export
            </button>
            <button 
              onClick={fetchBookings}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>

        <AdminBookingModal 
          isOpen={showManualBooking || !!editBookingId}
          onClose={() => { setShowManualBooking(false); setEditBookingId(null); }}
          onSuccess={() => { fetchBookings(); setEditBookingId(null); setShowManualBooking(false); setSelectedBooking(null); }}
          bookingId={editBookingId}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md flex items-center justify-between mb-4 text-sm">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Compact Filters Grid */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-sm">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ID, customer, phone..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#136b8a] transition-all"
            />
          </div>
          
          <select 
            value={packageFilter}
            onChange={(e) => { setPackageFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#136b8a] cursor-pointer"
          >
            <option value="all">All Packages</option>
            {uniquePackages.map((pkg, idx) => (
              <option key={idx} value={pkg}>{pkg}</option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#136b8a] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#136b8a] cursor-pointer"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#136b8a] cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="this">This Month</option>
            <option value="last">Last Month</option>
          </select>
        </div>
        
        {selectedRowIds.size > 0 && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2 px-4 flex items-center justify-between text-sm animate-fade-in">
            <span className="font-semibold text-blue-800">{selectedRowIds.size} bookings selected</span>
            <div className="flex gap-2">
               <button onClick={() => handleBulkAction('confirmed')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">Confirm Selected</button>
               <button onClick={() => handleBulkAction('cancelled')} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">Cancel Selected</button>
            </div>
          </div>
        )}
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-[#136b8a]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#136b8a] mb-3"></div>
              <p className="text-sm font-medium text-gray-500">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-base font-bold text-gray-900">No bookings found</h3>
              <p className="text-sm text-gray-500 mt-1">Adjust filters or search term to see results.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px] text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10 outline outline-1 outline-gray-200">
                <tr>
                  <th className="py-2.5 px-4 w-10 text-center">
                    <input type="checkbox" 
                      className="rounded border-gray-300 text-[#136b8a] focus:ring-[#136b8a]"
                      checked={currentBookings.length > 0 && selectedRowIds.size === currentBookings.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-gray-600">ID & Date</th>
                  <th className="py-2.5 px-4 font-semibold text-gray-600">Customer</th>
                  <th className="py-2.5 px-4 font-semibold text-gray-600">Package Details</th>
                  <th className="py-2.5 px-4 font-semibold text-gray-600 text-right">Amount</th>
                  <th className="py-2.5 px-4 font-semibold text-gray-600">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentBookings.map((booking) => (
                  <tr key={booking.id} className={`hover:bg-slate-50/70 transition-colors ${selectedRowIds.has(booking.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="py-2 px-4 text-center">
                      <input type="checkbox" 
                        className="rounded border-gray-300 text-[#136b8a] focus:ring-[#136b8a]"
                        checked={selectedRowIds.has(booking.id)}
                        onChange={() => toggleSelectRow(booking.id)}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <div className="font-bold text-[#136b8a] text-xs">{booking.booking_id}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {new Date(booking.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                    <td className="py-2 px-4 text-right">
                      <div className="font-bold text-gray-900">₹{Number(booking.final_amount || booking.total_amount || 0).toLocaleString()}</div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {getStatusBadge(booking.booking_status)}
                        {getPaymentBadge(booking.payment_status)}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right">
                       <button 
                         onClick={() => setSelectedBooking(booking)}
                         className="text-[#136b8a] hover:bg-slate-100 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border border-gray-200"
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
        
        {/* Compact Pagination */}
        {!loading && filteredBookings.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-gray-600">
              <span>Showing <b>{indexOfFirstBooking + 1}-{Math.min(indexOfLastBooking, filteredBookings.length)}</b> of <b>{filteredBookings.length}</b></span>
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select 
                  className="bg-white border border-gray-300 rounded px-1.5 py-0.5 outline-none"
                  value={bookingsPerPage}
                  onChange={(e) => {
                    setBookingsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={validCurrentPage === 1}
                  className="p-1 rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 font-semibold text-gray-700">Page {validCurrentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={validCurrentPage === totalPages}
                  className="p-1 rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer */}
      {selectedBooking && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedBooking(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-slate-50 shadow-2xl z-50 overflow-y-auto transform transition-transform duration-200 border-l border-gray-200 text-sm">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-base font-bold text-gray-900">Booking Details</h2>
                <p className="text-[#136b8a] font-mono text-xs font-bold">{selectedBooking.booking_id}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              
              {/* Quick Actions Header */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleQuickAction(selectedBooking, 'confirm')} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-1.5 rounded-md text-xs font-bold flex justify-center items-center gap-1 border border-emerald-200 transition-colors">
                  <Check size={14} /> Confirm
                </button>
                <button onClick={() => handleQuickAction(selectedBooking, 'cancel')} className="bg-rose-50 text-rose-700 hover:bg-rose-100 py-1.5 rounded-md text-xs font-bold flex justify-center items-center gap-1 border border-rose-200 transition-colors">
                  <XCircle size={14} /> Cancel
                </button>
                <button onClick={() => handleQuickAction(selectedBooking, 'markPaid')} className="col-span-2 bg-[#136b8a]/10 text-[#136b8a] hover:bg-[#136b8a]/20 py-1.5 rounded-md text-xs font-bold flex justify-center items-center gap-1 border border-[#136b8a]/20 transition-colors">
                  <CreditCard size={14} /> Mark Paid
                </button>
              </div>

              {/* Customer */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1"><User size={12}/> Customer</h3>
                  {selectedBooking.user_id ? (
                    <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Account Linked</span>
                  ) : (
                    <span className="text-[9px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Not Linked</span>
                  )}
                </div>
                <div className="font-semibold text-gray-900">{selectedBooking.customer_name}</div>
                
                <div className="mt-2 text-xs flex justify-between items-center">
                  <span className="text-gray-600">{selectedBooking.phone}</span>
                  <div className="flex gap-2">
                    <a href={`tel:+${selectedBooking.phone ? (selectedBooking.phone.replace(/\D/g, '').startsWith('91') ? selectedBooking.phone.replace(/\D/g, '') : `91${selectedBooking.phone.replace(/\D/g, '')}`) : ''}`} className="text-gray-400 hover:text-blue-600"><Phone size={14} /></a>
                    <a href={`https://wa.me/${selectedBooking.phone ? (selectedBooking.phone.replace(/\D/g, '').startsWith('91') ? selectedBooking.phone.replace(/\D/g, '') : `91${selectedBooking.phone.replace(/\D/g, '')}`) : ''}?text=${encodeURIComponent(`Hi ${selectedBooking.customer_name}, this is TripoMist. Regarding your booking for ${selectedBooking.package_title}...`)}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-green-600"><MessageCircle size={14} /></a>
                    <button onClick={() => handleQuickAction(selectedBooking, 'copyPhone')} className="text-gray-400 hover:text-[#136b8a]"><Copy size={14} /></button>
                  </div>
                </div>
                
                {selectedBooking.email && (
                  <div className="mt-2 text-xs flex justify-between items-center">
                    <span className="text-gray-600 truncate">{selectedBooking.email}</span>
                    <button onClick={() => handleQuickAction(selectedBooking, 'copyEmail')} className="text-gray-400 hover:text-[#136b8a]"><Copy size={14} /></button>
                  </div>
                )}
                
                {!selectedBooking.user_id && (
                  <button onClick={() => {
                    const msg = `Hi ${selectedBooking.customer_name}, your TripoMist booking has been added to our system.\n\nYou can view your booking, payment status and trip details by logging in to the TripoMist website using the same phone number or email used during booking.\n\nBooking ID: ${selectedBooking.booking_id || selectedBooking.booking_reference || selectedBooking.id}`;
                    navigator.clipboard.writeText(msg);
                    alert('Login instructions copied to clipboard!');
                  }} className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-md text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1">
                    <Copy size={12}/> Copy Login Instructions
                  </button>
                )}
              </div>

              {/* Package Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <h3 className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1"><Package size={12}/> Package Details</h3>
                <div className="font-semibold text-[#136b8a] text-sm">{selectedBooking.package_title}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Travel Date</span>
                    <span className="font-medium">{selectedBooking.travel_date ? new Date(selectedBooking.travel_date).toLocaleDateString() : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Travellers</span>
                    <span className="font-medium">{selectedBooking.travellers} Pax</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Sharing</span>
                    <span className="font-medium capitalize">{selectedBooking.selected_sharing || '-'}</span>
                  </div>
                </div>
                {selectedBooking.special_request && (
                  <div className="text-xs bg-orange-50 text-orange-800 p-2 rounded border border-orange-100 mt-2">
                    <span className="font-bold">Request:</span> {selectedBooking.special_request}
                  </div>
                )}
              </div>

              {/* Status & Billing */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3 text-xs">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-500">Booking Status</span>
                   {getStatusBadge(selectedBooking.booking_status)}
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-500">Payment Status</span>
                   {getPaymentBadge(selectedBooking.payment_status)}
                 </div>
                 <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                   <span className="font-semibold text-gray-700">Total Paid</span>
                   <span className="text-base font-bold text-[#136b8a]">₹{Number(selectedBooking.final_amount || selectedBooking.total_amount || 0).toLocaleString()}</span>
                 </div>
                 {selectedBooking.razorpay_payment_id && (
                   <div className="pt-2 border-t border-gray-100">
                     <span className="text-gray-500 block mb-1">Razorpay ID</span>
                     <span className="font-mono text-gray-800 break-all bg-gray-50 p-1 rounded border border-gray-100 block">{selectedBooking.razorpay_payment_id}</span>
                   </div>
                 )}
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
                Created: {new Date(selectedBooking.created_at).toLocaleString('en-GB')}
              </div>

              {/* Action Button */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button 
                  onClick={() => setEditBookingId(selectedBooking.id)}
                  className="w-full bg-[#136b8a] hover:bg-[#0f556e] text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <Edit size={16} /> Edit Booking
                </button>
                <button 
                  onClick={() => generatePDFVoucher(selectedBooking, 'download')}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <Download size={16} /> Voucher
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminBookings;
