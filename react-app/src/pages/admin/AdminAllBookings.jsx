import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { generatePDFVoucher } from '../../utils/pdfGenerator';
import {
  X, Check, XCircle, Copy, Download, Search,
  Calendar, CreditCard, ChevronLeft, ChevronRight, User, Package, Clock,
  MoreVertical, Phone, MessageCircle, Edit, Tag, Building,
  Globe, Mail, Users, Eye, EyeOff, Ticket
} from 'lucide-react';

import AdminBookingModal from '../../components/admin/AdminBookingModal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import ServiceRecoveryCreationModal from '../../components/admin/ServiceRecoveryCreationModal';
import AdminSecurityModal from '../../components/admin/AdminSecurityModal';
import VoucherIssueModal from '../../components/admin/VoucherIssueModal';

const AdminAllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [editBookingId, setEditBookingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Cancellation Modal State
  const [cancelModal, setCancelModal] = useState({ isOpen: false, booking: null });
  // Deletion Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, booking: null, password: '', error: '', loading: false });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');
  const [cancelResolution, setCancelResolution] = useState('Cancel Without Refund');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'online', 'manual'
  const [salesChannelFilter, setSalesChannelFilter] = useState('all');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [packageFilter, setPackageFilter] = useState('all');

  // Bulk Delete Modal State
  const [bulkDeleteModal, setBulkDeleteModal] = useState({ isOpen: false, password: '', error: '', loading: false, successCount: 0, failCount: 0 });

  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(25);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Drawer state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewDetailsBooking, setViewDetailsBooking] = useState(null);
  const [selectedTravellers, setSelectedTravellers] = useState([]);
  const [loadingTravellers, setLoadingTravellers] = useState(false);

  // Classification Modal State
  const [classificationModal, setClassificationModal] = useState({ isOpen: false, channel: 'unclassified', company: '', notes: '' });

  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'danger' });
  const [serviceRecoveryModal, setServiceRecoveryModal] = useState({ isOpen: false, booking: null });

  // Voucher Modal
  const [voucherModal, setVoucherModal] = useState({ isOpen: false, booking: null });

  useEffect(() => {
    if (!viewDetailsBooking) {
      setSelectedTravellers([]);
      return;
    }
    let isMounted = true;
    setLoadingTravellers(true);
    supabase.from('booking_travellers').select('*').eq('booking_id', viewDetailsBooking.id).order('is_primary', { ascending: false })
      .then(({ data, error }) => {
        if (isMounted) {
          if (!error) setSelectedTravellers(data || []);
          else setSelectedTravellers([]);
        }
      })
      .catch(() => {
        if (isMounted) setSelectedTravellers([]);
      })
      .finally(() => {
        if (isMounted) setLoadingTravellers(false);
      });
    return () => { isMounted = false; };
  }, [viewDetailsBooking]);

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
      setSelectedRowIds(new Set());
    } catch (err) {
      console.error('Error fetching all bookings:', err);
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

      if (viewDetailsBooking?.id === id) {
        setViewDetailsBooking(prev => ({ ...prev, [field]: newValue }));
      }
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert(`Failed to update ${field}.`);
    }
  };

  const handleDrawerConfirmPayment = async () => {
    if (!viewDetailsBooking) return;
    try {
      const existingPaid = Number(viewDetailsBooking.cash_paid_amount ?? viewDetailsBooking.advance_payment ?? 0);
      const fullPayable = Number(viewDetailsBooking.final_payable_amount ?? viewDetailsBooking.final_amount ?? viewDetailsBooking.total_amount ?? 0);
      const amt = existingPaid > 0 ? existingPaid : fullPayable;

      const { error: updateErr } = await supabase
        .from('bookings')
        .update({ payment_status: 'paid', cash_paid_amount: amt })
        .eq('id', viewDetailsBooking.id);

      if (updateErr) throw updateErr;

      setBookings(prev => prev.map(b =>
        b.id === viewDetailsBooking.id ? { ...b, payment_status: 'paid', cash_paid_amount: amt } : b
      ));

      setViewDetailsBooking(prev => ({ ...prev, payment_status: 'paid', cash_paid_amount: amt }));
      alert('Payment confirmed successfully!');
    } catch (err) {
      console.error('Confirm payment error:', err);
      alert(`Failed to confirm payment: ${err.message}`);
    }
  };

  const submitDelete = async () => {
    if (!deleteModal.password) {
      setDeleteModal(prev => ({ ...prev, error: 'Password required' }));
      return;
    }
    setDeleteModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Your admin session has expired. Please sign in again.");
      }

      const { data, error } = await supabase.functions.invoke('secure-delete-booking', {
        body: {
          booking_id: deleteModal.booking.id,
          current_password: deleteModal.password
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw new Error(error.message || "Unable to delete booking.");

      setBookings(prev => prev.filter(b => b.id !== deleteModal.booking.id));
      setDeleteModal({ isOpen: false, booking: null, password: '', error: '', loading: false });
      if (viewDetailsBooking?.id === deleteModal.booking.id) setViewDetailsBooking(null);
      alert("Booking deleted successfully.");
    } catch (err) {
      setDeleteModal(prev => ({ ...prev, loading: false, error: err.message || "Deletion failed" }));
    }
  };

  const submitClassification = async () => {
    if (!viewDetailsBooking) return;
    try {
      const updates = {
        sales_channel: classificationModal.channel,
        b2b_partner_company: classificationModal.channel === 'b2b' ? classificationModal.company : null,
        b2b_notes: classificationModal.channel === 'b2b' ? classificationModal.notes : null
      };

      const { error: updateErr } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', viewDetailsBooking.id);

      if (updateErr) throw updateErr;

      setBookings(prev => prev.map(b =>
        b.id === viewDetailsBooking.id ? { ...b, ...updates } : b
      ));

      setViewDetailsBooking(prev => ({ ...prev, ...updates }));
      setClassificationModal({ isOpen: false, channel: 'unclassified', company: '', notes: '' });
      alert('Classification updated successfully!');
    } catch (err) {
      console.error('Classification error:', err);
      alert(`Failed to update classification: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      confirmed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      completed: 'bg-blue-100 text-blue-800 border border-blue-200',
      cancelled: 'bg-rose-100 text-rose-800 border border-rose-200',
      pending: 'bg-amber-100 text-amber-800 border border-amber-200',
      new: 'bg-amber-100 text-amber-800 border border-amber-200'
    };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${colors[status] || colors.pending}`}>{status}</span>;
  };

  const getPaymentBadge = (status) => {
    const colors = {
      paid: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      pending: 'bg-amber-100 text-amber-800 border border-amber-200',
      unpaid: 'bg-amber-100 text-amber-800 border border-amber-200',
      refunded: 'bg-purple-100 text-purple-800 border border-purple-200',
      failed: 'bg-rose-100 text-rose-800 border border-rose-200'
    };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${colors[status] || colors.pending}`}>{status}</span>;
  };

  const getSourceBadge = (source) => {
    if (source === 'manual') {
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1"><User size={12}/> Manual</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1"><Globe size={12}/> Online</span>;
  };

  // Unique packages for filter
  const uniquePackages = useMemo(() => {
    return Array.from(new Set(bookings.map(b => b.package_title))).filter(Boolean);
  }, [bookings]);

  // Filtering
  const filteredBookings = useMemo(() => {
    let results = bookings.filter(b => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (b.booking_id?.toLowerCase() || '').includes(term) ||
        (b.customer_name?.toLowerCase() || '').includes(term) ||
        (b.phone || '').includes(term) ||
        (b.package_title?.toLowerCase() || '').includes(term);

      const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || b.payment_status === paymentFilter;
      const matchesPackage = packageFilter === 'all' || b.package_title === packageFilter;
      const matchesSales = salesChannelFilter === 'all' || b.sales_channel === salesChannelFilter || (!b.sales_channel && salesChannelFilter === 'unclassified');
      
      const isManual = b.booking_source === 'manual';
      const matchesSource = sourceFilter === 'all' || (sourceFilter === 'manual' && isManual) || (sourceFilter === 'online' && !isManual);

      return matchesSearch && matchesStatus && matchesPayment && matchesPackage && matchesSales && matchesSource;
    });

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      results = results.filter(b => {
        const bDate = new Date(b.created_at);
        bDate.setHours(0, 0, 0, 0);
        return bDate >= from;
      });
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      results = results.filter(b => {
        const bDate = new Date(b.created_at);
        return bDate <= to;
      });
    }
    return results;
  }, [bookings, searchTerm, statusFilter, paymentFilter, packageFilter, salesChannelFilter, sourceFilter, fromDate, toDate]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));

  const indexOfLastBooking = validCurrentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);

  const toggleSelectAll = () => {
    if (selectedRowIds.size === currentBookings.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(currentBookings.map(b => b.id)));
    }
  };

  const toggleSelectRow = (id) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRowIds(newSet);
  };

  const exportToCSV = () => {
    const headers = ['Booking ID', 'Source', 'Customer Name', 'Phone', 'Package', 'Travel Date', 'Travellers', 'Amount', 'Payment Status', 'Booking Status'];
    const rows = filteredBookings.map(b => [
      b.booking_id || '',
      b.booking_source === 'manual' ? 'Manual' : 'Online',
      b.customer_name || '',
      b.phone || '',
      b.package_title || '',
      b.travel_date ? new Date(b.travel_date).toLocaleDateString() : '',
      b.travellers || 1,
      b.final_payable_amount ?? b.final_amount ?? b.total_amount ?? 0,
      b.payment_status || '',
      b.booking_status || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `all_bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex flex-col h-full animate-fade-in overflow-x-hidden">
        {/* Sticky Header & Toolbar */}
        <div className="sticky top-0 z-10 bg-slate-50 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">All Bookings</h1>
              <p className="text-xs text-gray-500 mt-0.5">Comprehensive view of all online and manual bookings</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManualBooking(true)}
                className="flex items-center gap-1.5 bg-[#01AFD1] border border-[#01AFD1] text-white px-3 py-1.5 rounded-md hover:bg-[#0092b3] transition-colors shadow-sm text-sm font-semibold"
              >
                + New Booking
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm font-semibold"
              >
                <Download size={16} /> Export
              </button>
              <button
                onClick={fetchAllBookings}
                className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm font-semibold"
              >
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md flex items-center justify-between mb-4 text-sm">
              <span>{error}</span>
              <button onClick={() => setError(null)}><X size={16} /></button>
            </div>
          )}

          {/* Compact Filters Grid */}
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-sm">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search ID, customer, phone..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] transition-all"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] cursor-pointer font-semibold text-[#01AFD1]"
            >
              <option value="all">All Sources (Online & Manual)</option>
              <option value="online">Online Bookings Only</option>
              <option value="manual">Manual Bookings Only</option>
            </select>

            <select
              value={salesChannelFilter}
              onChange={(e) => { setSalesChannelFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] cursor-pointer"
            >
              <option value="all">All Sales Channels</option>
              <option value="unclassified">Unclassified</option>
              <option value="b2c">B2C</option>
              <option value="b2b">B2B</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] cursor-pointer"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>

            <div className="flex gap-2 lg:col-span-6 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-gray-500 font-medium text-xs">From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-[#01AFD1]"/>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-500 font-medium text-xs">To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-[#01AFD1]"/>
              </div>
              {(fromDate || toDate) && (
                <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-sm font-semibold text-[#01AFD1] hover:text-[#0092b3] ml-2">Clear Dates</button>
              )}
            </div>
          </div>
        </div>

        {/* Table Data */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-[#01AFD1]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#01AFD1] mb-3"></div>
                <p className="text-sm font-medium text-gray-500">Loading all bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="text-base font-bold text-gray-900">No bookings found</h3>
                <p className="text-sm text-gray-500 mt-1">Adjust filters or search term to see results.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[950px] text-sm">
                <thead className="bg-slate-50 sticky top-0 z-10 outline outline-1 outline-gray-200">
                  <tr>
                    <th className="py-2.5 px-4 w-10 text-center">
                      <input type="checkbox"
                        className="rounded border-gray-300 text-[#01AFD1] focus:ring-[#01AFD1]"
                        checked={currentBookings.length > 0 && selectedRowIds.size === currentBookings.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-gray-600">ID & Created Date</th>
                    <th className="py-2.5 px-4 font-semibold text-gray-600">Booking Type</th>
                    <th className="py-2.5 px-4 font-semibold text-gray-600">Customer</th>
                    <th className="py-2.5 px-4 font-semibold text-gray-600">Package Details</th>
                    <th className="py-2.5 px-4 font-semibold text-gray-600 text-right">Amount</th>
                    <th className="py-2.5 px-4 font-semibold text-gray-600">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-gray-600 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentBookings.map((booking) => (
                    <tr key={booking.id} className={`hover:bg-slate-50/70 transition-colors ${selectedRowIds.has(booking.id) ? 'bg-[#01AFD1]/10/30' : ''}`}>
                      <td className="py-2 px-4 text-center">
                        <input type="checkbox"
                          className="rounded border-gray-300 text-[#01AFD1] focus:ring-[#01AFD1]"
                          checked={selectedRowIds.has(booking.id)}
                          onChange={() => toggleSelectRow(booking.id)}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <div className="font-bold text-[#01AFD1] text-xs">{booking.booking_id}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {getSourceBadge(booking.booking_source)}
                      </td>
                      <td className="py-2 px-4">
                        <div className="font-semibold text-gray-900">{booking.customer_name}</div>
                        <div className="text-xs text-gray-500">{booking.phone}</div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="font-medium text-gray-800 text-xs truncate max-w-[200px]" title={booking.package_title}>{booking.package_title}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Travel: {booking.travel_date ? new Date(booking.travel_date).toLocaleDateString() : 'N/A'} • {booking.travellers || booking.travellers_count || 1} pax
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="font-medium text-gray-900">
                          ₹{Number(booking.final_payable_amount ?? booking.final_amount ?? booking.total_amount ?? 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {getStatusBadge(booking.booking_status)}
                          {getPaymentBadge(booking.payment_status)}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <button
                          onClick={() => setViewDetailsBooking(booking)}
                          className="px-3 py-1 bg-slate-100 hover:bg-[#01AFD1] hover:text-white text-gray-700 text-xs font-semibold rounded transition-colors"
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

          {/* Pagination Footer */}
          {!loading && filteredBookings.length > 0 && (
            <div className="py-2.5 px-4 bg-slate-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-gray-500 font-medium">
                <span>Total Bookings: <strong className="text-gray-900">{filteredBookings.length}</strong></span>
                <div className="flex items-center gap-1">
                  <span>Per page:</span>
                  <select
                    value={bookingsPerPage}
                    onChange={(e) => { setBookingsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-white border border-gray-200 rounded px-1.5 py-0.5 font-semibold text-gray-700"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={validCurrentPage === 1}
                  className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-gray-600 font-medium">Page {validCurrentPage} of {totalPages || 1}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={validCurrentPage === totalPages || totalPages === 0}
                  className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Booking Modal */}
      <AdminBookingModal
        isOpen={showManualBooking || !!editBookingId}
        onClose={() => {
          setShowManualBooking(false);
          setEditBookingId(null);
        }}
        onSuccess={() => {
          setShowManualBooking(false);
          setEditBookingId(null);
          setViewDetailsBooking(null);
          fetchAllBookings();
        }}
        bookingId={editBookingId}
      />

      {/* View Details Drawer */}
      {viewDetailsBooking && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[80]" onClick={() => setViewDetailsBooking(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[90] overflow-y-auto transform transition-transform duration-200 border-l border-gray-200 text-sm">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
                  {getSourceBadge(viewDetailsBooking.booking_source)}
                </div>
                <p className="text-sm text-gray-500 font-mono">{viewDetailsBooking.booking_reference || viewDetailsBooking.booking_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditBookingId(viewDetailsBooking.id);
                    setShowManualBooking(true);
                  }}
                  className="p-2 text-[#01AFD1] hover:bg-gray-50 rounded-full transition-colors"
                  title="Edit Booking"
                >
                  <Edit size={18} />
                </button>
                <button onClick={() => setViewDetailsBooking(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 space-y-8">

              {/* BOOKING */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">BOOKING</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Package</span>
                    <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{viewDetailsBooking.package_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Travel Date</span>
                    <span className="font-medium text-gray-900">{viewDetailsBooking.travel_date ? new Date(viewDetailsBooking.travel_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Overall Sharing</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {viewDetailsBooking.sharing_allocation 
                        ? Object.entries(typeof viewDetailsBooking.sharing_allocation === 'string' ? JSON.parse(viewDetailsBooking.sharing_allocation) : viewDetailsBooking.sharing_allocation).filter(([k, v]) => v > 0).map(([k, v]) => `${k} (${v})`).join(', ')
                        : viewDetailsBooking.selected_sharing || viewDetailsBooking.sharing_type || 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Booking Source</span>
                    <span className="font-medium text-gray-900 capitalize">{viewDetailsBooking.booking_source || 'Online'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Sales Channel</span>
                    <span className="font-medium text-gray-900 capitalize flex items-center gap-2">
                      {viewDetailsBooking.sales_channel === 'b2b' ? (
                        <span>B2B {viewDetailsBooking.b2b_partner_company ? `(${viewDetailsBooking.b2b_partner_company})` : ''}</span>
                      ) : viewDetailsBooking.sales_channel === 'b2c' ? (
                        <span>B2C</span>
                      ) : (
                        <span>Unclassified</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-500">Booking Status</span>
                    {getStatusBadge(viewDetailsBooking.booking_status)}
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-500">Payment Status</span>
                    {getPaymentBadge(viewDetailsBooking.payment_status)}
                  </div>
                </div>
              </div>

              {/* PAYMENT */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">PAYMENT</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Price</span>
                    <span className="font-medium text-gray-900">₹{Number(viewDetailsBooking.total_amount || viewDetailsBooking.final_amount || 0).toLocaleString()}</span>
                  </div>
                  {Number(viewDetailsBooking.manual_discount_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Discount</span>
                      <span className="font-medium text-emerald-600">-₹{Number(viewDetailsBooking.manual_discount_amount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-medium text-emerald-600">₹{Number(viewDetailsBooking.payment_status === 'paid' ? (viewDetailsBooking.final_amount || viewDetailsBooking.total_amount || 0) : (viewDetailsBooking.advance_payment || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-50 pt-2">
                    <span className="text-gray-500 font-semibold">Remaining Due</span>
                    <span className="font-bold text-amber-600">₹{Math.max(0, Number(viewDetailsBooking.final_amount || viewDetailsBooking.total_amount || 0) - Number(viewDetailsBooking.payment_status === 'paid' ? (viewDetailsBooking.final_amount || viewDetailsBooking.total_amount || 0) : (viewDetailsBooking.advance_payment || 0))).toLocaleString()}</span>
                  </div>
                  {viewDetailsBooking.payment_method && (
                    <div className="flex justify-between border-t border-gray-50 pt-2">
                      <span className="text-gray-500">Payment Method</span>
                      <span className="font-medium text-gray-900 uppercase">{viewDetailsBooking.payment_method}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CUSTOMER */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">CUSTOMER</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-900">{viewDetailsBooking.customer_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium text-gray-900">{viewDetailsBooking.customer_phone || viewDetailsBooking.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900">{viewDetailsBooking.customer_email || viewDetailsBooking.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Travellers List */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1"><Users size={14}/> All Travellers ({selectedTravellers.length})</h3>
                {loadingTravellers ? (
                  <div className="p-4 text-center text-gray-500 text-sm animate-pulse">Loading travellers...</div>
                ) : selectedTravellers.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTravellers.map((t, idx) => (
                      <div key={t.id || idx} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm relative overflow-hidden">
                        {t.is_primary && (
                          <div className="absolute top-0 right-0 bg-[#01AFD1] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">PRIMARY</div>
                        )}
                        <p className="font-bold text-gray-900 mb-1">{t.full_name} {t.age || t.gender ? <span className="text-gray-400 font-normal text-xs ml-1">({[t.age ? `${t.age} yrs` : '', t.gender].filter(Boolean).join(', ')})</span> : null}</p>

                        <div className="grid grid-cols-2 gap-y-2 mt-3 text-xs">
                           <div>
                             <span className="text-gray-400 block mb-0.5">Phone</span>
                             <span className="font-medium text-gray-800">{t.phone || '-'}</span>
                           </div>
                           <div>
                             <span className="text-gray-400 block mb-0.5">Email</span>
                             <span className="font-medium text-gray-800 line-clamp-1" title={t.email}>{t.email || '-'}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-4 text-center text-gray-500 text-xs">
                    No individual traveller records attached.
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
                Created: {new Date(viewDetailsBooking.created_at).toLocaleString('en-GB')}
              </div>

              {/* BOOKING CONTROLS */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex flex-col gap-2">
                  {viewDetailsBooking.payment_status !== 'paid' && (
                    <button
                      onClick={handleDrawerConfirmPayment}
                      className="w-full bg-[#01AFD1]/10 hover:bg-[#01AFD1]/20 text-[#01AFD1] py-2.5 rounded-lg font-bold transition-colors text-sm"
                    >
                      Confirm Payment
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCancelModal({ isOpen: true, booking: viewDetailsBooking });
                      setCancelReason('');
                      setCancelNotes('');
                      setCancelResolution('Cancel Without Refund');
                    }}
                    className="w-full text-rose-600 hover:bg-rose-50 py-2.5 rounded-lg font-bold transition-colors text-sm border border-rose-100"
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={() => setVoucherModal({ isOpen: true, booking: viewDetailsBooking })}
                    className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 py-2.5 rounded-lg font-bold transition-colors text-sm border border-amber-200 flex items-center justify-center gap-2"
                  >
                    <Ticket size={16} /> Cancel Traveller & Issue Voucher
                  </button>
                  <button
                    onClick={() => {
                      setDeleteModal({ isOpen: true, booking: viewDetailsBooking, password: '', error: '', loading: false });
                    }}
                    className="w-full text-gray-500 hover:text-red-600 py-2 text-xs font-semibold underline transition-colors"
                  >
                    Delete Booking (Admin Only)
                  </button>
                  <button
                    onClick={() => {
                      setClassificationModal({
                        isOpen: true,
                        channel: viewDetailsBooking.sales_channel || 'unclassified',
                        company: viewDetailsBooking.b2b_partner_company || '',
                        notes: viewDetailsBooking.b2b_notes || ''
                      });
                    }}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg font-bold transition-colors text-sm border border-gray-300 mt-2"
                  >
                    Change Classification
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => generatePDFVoucher(viewDetailsBooking, 'download')}
                  className="w-full bg-[#01AFD1] hover:bg-[#0092b3] text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm col-span-2 shadow-sm"
                >
                  <Download size={16} /> Download Invoice
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && deleteModal.booking && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete Booking</h3>
            <p className="text-sm text-gray-600">Please enter admin password to confirm deletion of <strong>{deleteModal.booking.booking_id}</strong>.</p>
            {deleteModal.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded">{deleteModal.error}</p>
            )}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Admin Password"
                value={deleteModal.password}
                onChange={(e) => setDeleteModal(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#01AFD1]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModal({ isOpen: false, booking: null, password: '', error: '', loading: false })}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitDelete}
                disabled={deleteModal.loading}
                className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteModal.loading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Classification Modal */}
      {classificationModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Change Sales Classification</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sales Channel</label>
                <select
                  value={classificationModal.channel}
                  onChange={(e) => setClassificationModal(prev => ({ ...prev, channel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="unclassified">Unclassified</option>
                  <option value="b2c">B2C (Direct Customer)</option>
                  <option value="b2b">B2B (Partner / Agent)</option>
                </select>
              </div>
              {classificationModal.channel === 'b2b' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Partner Company Name</label>
                  <input
                    type="text"
                    placeholder="Company / Agent Name"
                    value={classificationModal.company}
                    onChange={(e) => setClassificationModal(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setClassificationModal({ isOpen: false, channel: 'unclassified', company: '', notes: '' })}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitClassification}
                className="px-4 py-2 bg-[#01AFD1] text-white text-sm font-semibold rounded-lg hover:bg-[#0092b3]"
              >
                Save Classification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Issue Modal */}
      <VoucherIssueModal
        isOpen={voucherModal.isOpen}
        onClose={() => setVoucherModal({ isOpen: false, booking: null })}
        booking={voucherModal.booking}
        travellers={selectedTravellers}
        onSuccess={() => {
          if (viewDetailsBooking) {
            supabase.from('booking_travellers').select('*').eq('booking_id', viewDetailsBooking.id).order('is_primary', { ascending: false })
              .then(({ data }) => setSelectedTravellers(data || []));
          }
          fetchAllBookings();
        }}
      />
    </>
  );
};

export default AdminAllBookings;
