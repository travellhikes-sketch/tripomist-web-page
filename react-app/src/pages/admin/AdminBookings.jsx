import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { generatePDFVoucher } from '../../utils/pdfGenerator';
import {
  X, Check, XCircle, Copy, Download, Search,
  Calendar, CreditCard, ChevronLeft, ChevronRight, User, Package, Clock,
  MoreVertical, Phone, MessageCircle, Edit, Tag, Building
} from 'lucide-react';

import AdminBookingModal from '../../components/admin/AdminBookingModal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import ServiceRecoveryCreationModal from '../../components/admin/ServiceRecoveryCreationModal';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [editBookingId, setEditBookingId] = useState(null);

  // Cancellation Modal State
  const [cancelModal, setCancelModal] = useState({ isOpen: false, booking: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');
  const [cancelResolution, setCancelResolution] = useState('Cancel Without Refund');
  const [voucherAmount, setVoucherAmount] = useState('');
  const [voucherExpiry, setVoucherExpiry] = useState('');
  const [voucherNotes, setVoucherNotes] = useState('');
  const [confirmVoucherAmount, setConfirmVoucherAmount] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [salesChannelFilter, setSalesChannelFilter] = useState('all');

  const [monthFilter, setMonthFilter] = useState('all'); // all | this | last | custom
  const [customMonth, setCustomMonth] = useState(''); // format YYYY-MM
  const [packageFilter, setPackageFilter] = useState('all');

  // Drawer state
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(25);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'danger' });
  const [serviceRecoveryModal, setServiceRecoveryModal] = useState({ isOpen: false, booking: null });
  // Classification UI state
  const [classificationChannel, setClassificationChannel] = useState('');
  const [b2bCompany, setB2bCompany] = useState('');
  const [b2bNotes, setB2bNotes] = useState('');

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

  const handleBulkAction = (status) => {
    if (selectedRowIds.size === 0) return;
    setConfirmModalConfig({
      isOpen: true,
      title: 'Bulk Action',
      message: `Are you sure you want to mark ${selectedRowIds.size} bookings as ${status}?`,
      type: 'amber',
      onConfirm: async () => {
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
      }
    });
  };

  const handleQuickAction = async (booking, actionType) => {
    switch (actionType) {
      case 'confirm':
        await handleStatusUpdate(booking.id, 'booking_status', 'confirmed');
        break;
      case 'cancel':
        // Close any existing drawer and Service Recovery modal before opening Cancel modal
        setSelectedBooking(null);
        setServiceRecoveryModal({ isOpen: false, booking: null });
        setCancelModal({ isOpen: true, booking });
        setCancelReason('');
        setCancelNotes('');
        setCancelResolution('Cancel Without Refund');
        // Default coupon amount to paid amount
        const paid = Number(booking.final_payable_amount ?? booking.final_amount ?? booking.total_amount ?? 0);
        setVoucherAmount(paid > 0 ? paid.toString() : '');
        setVoucherExpiry('');
        setVoucherNotes('');
        setConfirmVoucherAmount(false);
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

const classifyBooking = async (booking, newChannel, companyArg, notesArg) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) { alert(`Auth error: ${userError?.message || 'Admin session not found'}`); return; }
    const payload = {
      sales_channel: newChannel,
      classified_by: user ? user.id : null,
      classified_at: new Date().toISOString()
    };
    if (newChannel === 'b2b') {
      const company = (companyArg || '').trim();
      if (!company) { alert('Partner/Company name required for B2B classification.'); return; }
      payload.b2b_partner_company = company;
      payload.b2b_notes = (notesArg || '').trim() || null;
    } else {
      payload.b2b_partner_company = null;
      payload.b2b_notes = null;
    }
    if (newChannel === 'unclassified') {
      payload.classified_by = null;
      payload.classified_at = null;
    }
    const { error } = await supabase.from('bookings').update(payload).eq('id', booking.id);
    if (error) throw error;
    await fetchBookings();

    // Update selectedBooking state so drawer displays updated details
    setSelectedBooking(prev => {
      if (prev && prev.id === booking.id) {
        return {
          ...prev,
          sales_channel: payload.sales_channel,
          b2b_partner_company: payload.b2b_partner_company,
          b2b_notes: payload.b2b_notes,
          classified_by: payload.classified_by,
          classified_at: payload.classified_at
        };
      }
      return prev;
    });
    alert('Classification saved successfully.');
  } catch (err) {
    console.error('Classification update error:', err);
    alert('Failed to update classification: ' + err.message);
  }
};



  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      alert("Please provide a cancellation reason.");
      return;
    }

    if (cancelResolution === 'Convert Paid Amount to Coupon') {
        if (!voucherAmount || isNaN(voucherAmount) || parseFloat(voucherAmount) <= 0) {
            alert("Please enter a valid positive coupon amount.");
            return;
        }
        const maxCoupon = parseFloat(cancelModal.booking.final_payable_amount || cancelModal.booking.final_amount || cancelModal.booking.total_amount || 0);
        if (parseFloat(voucherAmount) > maxCoupon) {
            alert(`Coupon amount cannot be greater than the actual paid amount (₹${maxCoupon}).`);
            return;
        }
        if (!voucherExpiry) {
            alert("Please select a coupon expiry date.");
            return;
        }
        if (new Date(voucherExpiry) <= new Date()) {
            alert("Coupon expiry date must be in the future.");
            return;
        }
        if (!confirmVoucherAmount) {
            alert("Please confirm the coupon amount.");
            return;
        }
    }

    setLoading(true);
    try {
      const b = cancelModal.booking;
      const isVoucher = cancelResolution === 'Convert Paid Amount to Coupon';

      const { data, error } = await supabase.rpc('admin_cancel_booking_with_coupon', {
          p_booking_id: b.id,
          p_cancellation_reason: cancelReason,
          p_cancellation_notes: cancelNotes,
          p_refund_status: cancelResolution,
          p_issue_coupon: isVoucher,
          p_coupon_amount: isVoucher ? parseFloat(voucherAmount) : null,
          p_coupon_expiry: isVoucher ? new Date(voucherExpiry).toISOString() : null,
          p_coupon_notes: isVoucher ? voucherNotes : null
      });

      if (error) throw error;

      if (isVoucher && data?.voucher_code) {
        window.prompt('Voucher code generated! Copy to clipboard:', data.voucher_code);
      } else {
        alert('Booking cancelled successfully.');
      }
      fetchBookings();
      setCancelModal({ isOpen: false, booking: null });
      setSelectedBooking(null);
    } catch (err) {
      console.error(err);
      alert('Failed to cancel booking: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkProblem = (booking) => {
    setCancelModal({ isOpen: false, booking: null });
    setSelectedBooking(null);
    setServiceRecoveryModal({ isOpen: true, booking });
  };

  const exportToCSV = () => {
    if (filteredBookings.length === 0) return;
    const headers = ['Booking ID', 'Booking Date', 'Customer', 'Phone', 'Email', 'Package', 'Travel Date', 'Travellers', 'Amount', 'Payment Status', 'Booking Status', 'Sales Channel', 'Partner Company', 'Razorpay ID'];
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
      b.sales_channel || 'unclassified',
      b.b2b_partner_company || '',
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
      const matchesSales = salesChannelFilter === 'all' || b.sales_channel === salesChannelFilter || (!b.sales_channel && salesChannelFilter === 'unclassified');

      return matchesSearch && matchesStatus && matchesPayment && matchesPackage && matchesSales;
    });
  }, [bookings, searchTerm, statusFilter, paymentFilter, packageFilter, salesChannelFilter]);

  // Summary Stats
  const summaryStats = useMemo(() => {
    let b2bCount = 0, b2cCount = 0, unclassifiedCount = 0, b2bValue = 0, b2cValue = 0;
    filteredBookings.forEach(b => {
      const amt = Number(b.final_amount || b.total_amount || 0);
      if (b.sales_channel === 'b2b') {
        b2bCount++;
        b2bValue += amt;
      } else if (b.sales_channel === 'b2c') {
        b2cCount++;
        b2cValue += amt;
      } else {
        unclassifiedCount++;
      }
    });
    return { b2bCount, b2cCount, unclassifiedCount, b2bValue, b2cValue };
  }, [filteredBookings]);

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
    <div className="flex flex-col h-full animate-fade-in overflow-x-hidden">
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

        <ConfirmModal
          isOpen={confirmModalConfig.isOpen}
          onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          onConfirm={confirmModalConfig.onConfirm}
          type={confirmModalConfig.type}
        />

        <ServiceRecoveryCreationModal
          isOpen={serviceRecoveryModal.isOpen}
          onClose={() => setServiceRecoveryModal({ isOpen: false, booking: null })}
          booking={serviceRecoveryModal.booking}
          onSuccess={(data) => {
            if (data?.voucher_code) {
              window.prompt('Service recovery voucher generated! Copy to clipboard:', data.voucher_code);
            } else {
              alert('Service recovery case created successfully.');
            }
            fetchBookings();
          }}
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
            value={salesChannelFilter}
            onChange={(e) => { setSalesChannelFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#136b8a] cursor-pointer"
          >
            <option value="all">All Sales Types</option>
            <option value="unclassified">Unclassified</option>
            <option value="b2c">B2C</option>
            <option value="b2b">B2B</option>
          </select>

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

        {/* Summary Stats Row */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 px-1">
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase">Total B2B Bookings</p>
            <p className="text-lg font-bold text-gray-900">{summaryStats.b2bCount}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase">Total B2C Bookings</p>
            <p className="text-lg font-bold text-gray-900">{summaryStats.b2cCount}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase">B2B Sales Value</p>
             <p className="text-lg font-bold text-[#136b8a]">₹{Number(summaryStats.b2bValue ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase">B2C Sales Value</p>
            <div className="font-bold text-emerald-600">₹{Number(summaryStats.b2cValue ?? 0).toLocaleString()}</div>
          </div>
        </div>
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
  <th className="py-2.5 px-4 font-semibold text-gray-600">Action</th>
<th className="py-2.5 px-4 font-semibold text-gray-600">Classification</th>
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
    <td className="py-2 px-4">
      <div className="flex flex-col gap-1.5 items-start">
        {booking.sales_channel === 'b2b' && <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-purple-100 text-purple-800">B2B</span>}
        {booking.sales_channel === 'b2c' && <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-indigo-100 text-indigo-800">B2C</span>}
        {!(booking.sales_channel === 'b2b' || booking.sales_channel === 'b2c') && <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-gray-100 text-gray-800">Unclassified</span>}
      </div>
    </td>
    <td className="py-2 px-4 text-right">
      <button
        onClick={() => {
          setSelectedBooking(booking);
          setClassificationChannel(booking.sales_channel || 'unclassified');
          setB2bCompany(booking.b2b_partner_company || '');
          setB2bNotes(booking.b2b_notes || '');
        }}
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
<button onClick={() => handleMarkProblem(selectedBooking)} className="col-span-2 bg-amber-50 text-amber-700 hover:bg-amber-100 py-1.5 rounded-md text-xs font-bold flex justify-center items-center gap-1 border border-amber-200 transition-colors mt-1">
   Problem Faced (Service Recovery)
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
    <a href={`https://wa.me/${selectedBooking.phone ? (selectedBooking.phone.replace(/\D/g, '').startsWith('91') ? selectedBooking.phone.replace(/\D/g, '') : `91${selectedBooking.phone.replace(/\D/g, '')}`) : ''}?text=${encodeURIComponent(`Hi ${selectedBooking.customer_name}, this is TripoMist. Regarding your booking for ${selectedBooking.package_title}...`)}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-green-600">
      <MessageCircle size={14} />
    </a>
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

              {/* Sales Classification */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
<h3 className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center gap-1"><Tag size={12}/> Sales Classification</h3>
<div className="grid grid-cols-1 gap-3">
  <div>
    <label className="text-xs font-semibold text-gray-700 block mb-1">Sales Type</label>
    <select
      value={classificationChannel}
      onChange={(e) => setClassificationChannel(e.target.value)}
      className="w-full text-xs p-2 border border-gray-300 rounded"
    >
      <option value="unclassified">Unclassified</option>
      <option value="b2c">B2C - Service Provided by TripoMist</option>
      <option value="b2b">B2B - Transferred/Sold to Partner</option>
    </select>
  </div>
  {classificationChannel === 'b2b' && (
    <>
      <div>
         <label className="text-xs font-semibold text-gray-700 block mb-1 flex items-center gap-1"><Building size={12}/> Partner Company *</label>
         <input
           type="text"
           value={b2bCompany}
           onChange={(e) => setB2bCompany(e.target.value)}
           className="w-full text-xs p-2 border border-gray-300 rounded focus:border-[#136b8a] outline-none"
           placeholder="Enter agency name"
         />
      </div>
      <div>
         <label className="text-xs font-semibold text-gray-700 block mb-1">B2B Notes</label>
         <input
           type="text"
           value={b2bNotes}
           onChange={(e) => setB2bNotes(e.target.value)}
           className="w-full text-xs p-2 border border-gray-300 rounded focus:border-[#136b8a] outline-none"
           placeholder="Optional notes"
         />
      </div>
    </>
  )}
  <button
    onClick={() => classifyBooking(selectedBooking, classificationChannel, b2bCompany, b2bNotes)}
    className="w-full bg-[#136b8a] text-white text-xs font-bold py-2 rounded hover:bg-[#0f556e] transition-colors"
  >
    Save Classification
  </button>
</div>
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
      {/* Cancel Modal */}
      {cancelModal.isOpen && cancelModal.booking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-rose-600 px-6 py-4 flex justify-between items-center text-white">
               <h3 className="text-lg font-bold">Cancel Booking</h3>
               <button onClick={() => setCancelModal({ isOpen: false, booking: null })} className="text-rose-100 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">

              {/* Read Only Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm shadow-sm">
 <div><span className="block text-xs text-gray-500 uppercase font-semibold">Reference</span><span className="font-bold text-gray-900">{cancelModal.booking.booking_id}</span></div>
 <div><span className="block text-xs text-gray-500 uppercase font-semibold">Customer</span><span className="font-semibold">{cancelModal.booking.customer_name}</span></div>
 <div className="md:col-span-2"><span className="block text-xs text-gray-500 uppercase font-semibold">Package</span><span className="font-medium truncate block" title={cancelModal.booking.package_title}>{cancelModal.booking.package_title}</span></div>

 <div><span className="block text-xs text-gray-500 uppercase font-semibold">Travel Date</span><span>{cancelModal.booking.travel_date ? new Date(cancelModal.booking.travel_date).toLocaleDateString() : '-'}</span></div>
 <div><span className="block text-xs text-gray-500 uppercase font-semibold">Total Cost</span><span className="font-bold">₹{Number(cancelModal.booking.total_amount || 0).toLocaleString()}</span></div>
 <div><span className="block text-xs text-gray-500 uppercase font-semibold">Total Paid</span><span className="font-bold text-emerald-600">₹{Number(cancelModal.booking.final_amount || cancelModal.booking.total_amount || 0).toLocaleString()}</span></div>
 <div><span className="block text-xs text-gray-500 uppercase font-semibold">Status</span>{getPaymentBadge(cancelModal.booking.payment_status)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-4">
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Cancellation Reason *</label>
      <textarea
        value={cancelReason}
        onChange={e => setCancelReason(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#136b8a] outline-none shadow-sm"
        rows="3"
        required
        placeholder="Why is this booking being cancelled?"
      />
    </div>
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Internal Cancellation Notes</label>
      <textarea
        value={cancelNotes}
        onChange={e => setCancelNotes(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#136b8a] outline-none shadow-sm"
        rows="2"
        placeholder="Visible only to admins"
      />
    </div>
 </div>

 <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">Cancellation Resolution *</label>
      <select
        value={cancelResolution}
        onChange={e => setCancelResolution(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#136b8a] outline-none font-medium text-gray-800"
      >
        <option value="Cancel Without Refund">Cancel Without Refund</option>
        <option value="Convert Paid Amount to Coupon">Convert Paid Amount to Coupon</option>
        <option value="Refund Pending">Refund Pending</option>
        <option value="Partial Refund">Partial Refund</option>
        <option value="Fully Refunded">Fully Refunded</option>
      </select>
    </div>

    {cancelResolution === 'Convert Paid Amount to Coupon' && (
      <div className="mt-4 p-4 border border-emerald-200 bg-emerald-50 rounded-lg space-y-3 animate-fade-in">
        <div>
           <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Coupon Amount (₹) *</label>
           <input
             type="number"
             min="0"
             value={voucherAmount}
             onChange={e => setVoucherAmount(e.target.value)}
             className="w-full border border-emerald-300 rounded-md p-2 text-sm focus:border-emerald-500 outline-none"
             placeholder="e.g. 5000"
           />
        </div>
        <div>
           <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Validity / Expiry Date *</label>
           <input
             type="date"
             value={voucherExpiry}
             onChange={e => setVoucherExpiry(e.target.value)}
             className="w-full border border-emerald-300 rounded-md p-2 text-sm focus:border-emerald-500 outline-none"
             min={new Date().toISOString().split('T')[0]}
           />
        </div>
        <div>
           <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Coupon Notes</label>
           <input
             type="text"
             value={voucherNotes}
             onChange={e => setVoucherNotes(e.target.value)}
             className="w-full border border-emerald-300 rounded-md p-2 text-sm focus:border-emerald-500 outline-none"
             placeholder="Optional"
           />
        </div>
        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-emerald-200">
           <input
             type="checkbox"
             id="confirmVoucher"
             checked={confirmVoucherAmount}
             onChange={e => setConfirmVoucherAmount(e.target.checked)}
             className="mt-1"
           />
           <label htmlFor="confirmVoucher" className="text-xs text-emerald-900 font-medium cursor-pointer">
             I confirm that the coupon amount is exactly equal to the amount paid by the customer, and should be issued.
           </label>
        </div>
      </div>
    )}
 </div>
              </div>
            </div>

            <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setCancelModal({ isOpen: false, booking: null })} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Abort</button>
              <button onClick={submitCancel} className="px-5 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2">
 <XCircle size={16} /> Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
