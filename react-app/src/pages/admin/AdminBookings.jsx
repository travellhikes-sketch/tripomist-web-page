import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { generatePDFVoucher } from '../../utils/pdfGenerator';
import {
  X, Check, XCircle, Copy, Download, Search,
  Calendar, CreditCard, ChevronLeft, ChevronRight, User, Package, Clock,
  MoreVertical, Phone, MessageCircle, Edit, Tag, Building,
  Globe, Mail, Users
} from 'lucide-react';

import AdminBookingModal from '../../components/admin/AdminBookingModal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import ServiceRecoveryCreationModal from '../../components/admin/ServiceRecoveryCreationModal';
import AdminSecurityModal from '../../components/admin/AdminSecurityModal';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [editBookingId, setEditBookingId] = useState(null);
  
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
  const [salesChannelFilter, setSalesChannelFilter] = useState('all');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [packageFilter, setPackageFilter] = useState('all');

  // Bulk Delete Modal State
  const [bulkDeleteModal, setBulkDeleteModal] = useState({ isOpen: false, password: '', error: '', loading: false, successCount: 0, failCount: 0 });

  // Drawer state
  const [selectedBooking, setSelectedBooking] = useState(null); // preserved for legacy logic if needed
  const [viewDetailsBooking, setViewDetailsBooking] = useState(null);
  const [selectedTravellers, setSelectedTravellers] = useState([]);
  const [loadingTravellers, setLoadingTravellers] = useState(false);

  // Classification Modal State
  const [classificationModal, setClassificationModal] = useState({ isOpen: false, channel: 'unclassified', company: '', notes: '' });

  useEffect(() => {
    if (!viewDetailsBooking) {
      setSelectedTravellers([]);
      return;
    }
    let isMounted = true;
    setLoadingTravellers(true);
    supabase.from('booking_travellers').select('*').eq('booking_id', viewDetailsBooking.id)
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
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });

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
        {
          const existingPaid = Number(booking.cash_paid_amount ?? booking.advance_payment ?? 0);
          const fullPayable = Number(booking.final_payable_amount ?? booking.final_amount ?? booking.total_amount ?? 0);
          const amt = existingPaid > 0 ? existingPaid : fullPayable;

          const { error: updateErr } = await supabase
            .from('bookings')
            .update({ payment_status: 'paid', cash_paid_amount: amt })
            .eq('id', booking.id);

          if (updateErr) {
            alert(`Failed to mark paid: ${updateErr.message}`);
            break;
          }

          setBookings(prev => prev.map(b =>
            b.id === booking.id ? { ...b, payment_status: 'paid', cash_paid_amount: amt } : b
          ));

          if (selectedBooking?.id === booking.id) {
            setSelectedBooking(prev => ({ ...prev, payment_status: 'paid', cash_paid_amount: amt }));
          }
        }
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
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        let message = "Unable to delete booking.";
        try {
          if (error.context) {
            const payload = await error.context.json();
            if (payload?.error) {
              message = payload.error;
            }
          }
        } catch (_) {
          // fallback
        }
        throw new Error(message);
      }

      setBookings(prev => prev.filter(b => b.id !== deleteModal.booking.id));
      setViewDetailsBooking(null);
      setDeleteModal({ isOpen: false, booking: null, password: '', error: '', loading: false });
      fetchBookings();
      alert("Booking deleted successfully.");
    } catch (err) {
      setDeleteModal(prev => ({ ...prev, error: err.message, loading: false }));
    }
  };

  const submitBulkDelete = async () => {
    if (!bulkDeleteModal.password) {
      setBulkDeleteModal(prev => ({ ...prev, error: 'Password required' }));
      return;
    }
    setBulkDeleteModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Your admin session has expired. Please sign in again.");
      }

      const idsToDelete = Array.from(selectedRowIds);
      let successCount = 0;
      let failCount = 0;
      
      for (const id of idsToDelete) {
        const { data, error } = await supabase.functions.invoke('secure-delete-booking', {
          body: {
            booking_id: id,
            current_password: bulkDeleteModal.password
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) {
          let message = "Unable to delete booking.";
          try { if (error.context) { const payload = await error.context.json(); if (payload?.error) message = payload.error; } } catch (_) {}
          
          if (message === "Incorrect delete password." || message === "Booking Delete Password has not been configured yet." || message.includes("session has expired") || message.includes("Admin access required")) {
            if (successCount === 0 && failCount === 0) {
              throw new Error(message);
            }
          }
          failCount++;
        } else {
          successCount++;
        }
      }

      setBulkDeleteModal({ isOpen: false, password: '', error: '', loading: false, successCount: 0, failCount: 0 });
      setSelectedRowIds(new Set());
      fetchBookings();
      
      if (failCount === 0) {
        alert(`${successCount} bookings deleted successfully.`);
      } else {
        alert(`${successCount} bookings deleted. ${failCount} could not be deleted.`);
      }

    } catch (err) {
      setBulkDeleteModal(prev => ({ ...prev, error: err.message, loading: false }));
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
    
    const { error: bookingError } = await supabase.from('bookings').update(payload).eq('id', booking.id);
    if (bookingError) throw bookingError;

    // Handle Contribution Ledger
    if (newChannel === 'unclassified') {
      await supabase.from('booking_contributions').delete().eq('booking_id', booking.id);
    } else {
      // Find latest rate for this channel
      const channelLabel = newChannel === 'b2b' ? 'B2B' : 'B2C';
      const { data: rates } = await supabase
        .from('business_contribution_rates')
        .select('*')
        .eq('sales_channel', channelLabel)
        .order('effective_from', { ascending: false })
        .limit(1);
        
      if (rates && rates.length > 0) {
        const activeRate = rates[0];
        
        await supabase.from('booking_contributions').upsert({
          booking_id: booking.id,
          sales_channel: channelLabel,
          rate_id: activeRate.id,
          contribution_amount: activeRate.amount,
        }, { onConflict: 'booking_id' });
      }
    }

    await fetchBookings();

    // Update viewDetailsBooking state so drawer displays updated details
    setViewDetailsBooking(prev => {
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

    setLoading(true);
    try {
      const b = cancelModal.booking;

      let mappedRefundStatus = 'Refund Pending';
      if (cancelResolution === 'Cancel Without Refund') {
        mappedRefundStatus = 'No Refund';
      } else if (cancelResolution === 'Refund Pending') {
        mappedRefundStatus = 'Refund Pending';
      } else if (cancelResolution === 'Partial Refund') {
        mappedRefundStatus = 'Partially Refunded';
      } else if (cancelResolution === 'Fully Refunded') {
        mappedRefundStatus = 'Fully Refunded';
      }

      const { error } = await supabase.rpc('admin_cancel_booking', {
          p_booking_id: b.id,
          p_cancellation_reason: cancelReason,
          p_cancellation_notes: cancelNotes,
          p_refund_status: mappedRefundStatus
      });

      if (error) throw error;

      alert('Booking cancelled successfully.');
      fetchBookings();
      setCancelModal({ isOpen: false, booking: null });
      if (viewDetailsBooking && viewDetailsBooking.id === b.id) {
        setViewDetailsBooking(prev => ({ ...prev, booking_status: 'cancelled' }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to cancel booking: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkProblem = (booking) => {
    setCancelModal({ isOpen: false, booking: null });
    setServiceRecoveryModal({ isOpen: true, booking });
  };

  const handleDrawerConfirmPayment = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Confirm Payment',
      message: 'Are you sure you want to mark this booking as fully paid?',
      type: 'amber',
      onConfirm: async () => {
        try {
          const fullPayable = Number(viewDetailsBooking.final_payable_amount ?? viewDetailsBooking.final_amount ?? viewDetailsBooking.total_amount ?? 0);
          const { error } = await supabase
            .from('bookings')
            .update({
               payment_status: 'paid',
               advance_payment: fullPayable,
               remaining_payment: 0
            })
            .eq('id', viewDetailsBooking.id);

          if (error) throw error;

          fetchBookings();
          setViewDetailsBooking(prev => ({
            ...prev,
            payment_status: 'paid',
            advance_payment: fullPayable,
            remaining_payment: 0
          }));
        } catch (err) {
          console.error(err);
          alert('Failed to update payment status.');
        }
      }
    });
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

      return matchesSearch && matchesStatus && matchesPayment && matchesPackage && matchesSales;
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
  }, [bookings, searchTerm, statusFilter, paymentFilter, packageFilter, salesChannelFilter, fromDate, toDate]);

  useEffect(() => {
    if (selectedRowIds.size > 0) {
      const filteredIds = new Set(filteredBookings.map(b => b.id));
      const newSelected = new Set([...selectedRowIds].filter(id => filteredIds.has(id)));
      if (newSelected.size !== selectedRowIds.size) {
        setSelectedRowIds(newSelected);
      }
    }
  }, [filteredBookings, selectedRowIds]);

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
      new: 'bg-[#01AFD1]/20 text-[#0092b3]',
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
    <>
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
              className="flex items-center gap-1.5 bg-[#01AFD1] border border-[#01AFD1] text-white px-3 py-1.5 rounded-md hover:bg-[#0092b3] transition-colors shadow-sm text-sm font-semibold"
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
            value={salesChannelFilter}
            onChange={(e) => { setSalesChannelFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] cursor-pointer"
          >
            <option value="all">All Sales Types</option>
            <option value="unclassified">Unclassified</option>
            <option value="b2c">B2C</option>
            <option value="b2b">B2B</option>
          </select>

          <select
            value={packageFilter}
            onChange={(e) => { setPackageFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] cursor-pointer"
          >
            <option value="all">All Packages</option>
            {uniquePackages.map((pkg, idx) => (
              <option key={idx} value={pkg}>{pkg}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] cursor-pointer"
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
            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] cursor-pointer"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
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
            {fromDate && toDate && new Date(fromDate) > new Date(toDate) && (
              <span className="text-red-500 text-xs ml-2 font-semibold">From date cannot be after To date.</span>
            )}
          </div>
        </div>

        {selectedRowIds.size > 0 && (
          <div className="mt-3 bg-[#01AFD1]/10 border border-[#01AFD1]/30 rounded-lg p-2 px-4 flex items-center justify-between text-sm animate-fade-in">
            <span className="font-semibold text-blue-800">{selectedRowIds.size} bookings selected</span>
            <div className="flex gap-2">
               <button onClick={() => handleBulkAction('confirmed')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">Confirm Selected</button>
               <button onClick={() => setBulkDeleteModal({ isOpen: true, password: '', error: '', loading: false })} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">Delete Selected</button>
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
             <p className="text-lg font-bold text-[#01AFD1]">₹{Number(summaryStats.b2bValue ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase">B2C Sales Value</p>
            <div className="font-bold text-emerald-600">₹{Number(summaryStats.b2cValue ?? 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-[#01AFD1]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#01AFD1] mb-3"></div>
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
      className="rounded border-gray-300 text-[#01AFD1] focus:ring-[#01AFD1]"
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
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setViewDetailsBooking(booking);
        }}
        className="text-[#01AFD1] hover:bg-slate-100 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border border-gray-200"
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
      </div>

      {/* Booking Details Drawer */}
      {viewDetailsBooking && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[80]" onClick={() => setViewDetailsBooking(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[90] overflow-y-auto transform transition-transform duration-200 border-l border-gray-200 text-sm">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
                <p className="text-sm text-gray-500">{viewDetailsBooking.booking_reference || viewDetailsBooking.booking_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditBookingId(viewDetailsBooking.id);
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
                    <span className="text-gray-500">Booking Source</span>
                    <span className="font-medium text-gray-900 capitalize">{viewDetailsBooking.booking_source || 'Unknown'}</span>
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
                    <span className="font-medium text-gray-900">₹{Number(viewDetailsBooking.total_amount || 0).toLocaleString()}</span>
                  </div>
                  {Number(viewDetailsBooking.manual_discount_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Discount</span>
                      <span className="font-medium text-emerald-600">-₹{Number(viewDetailsBooking.manual_discount_amount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(viewDetailsBooking.manual_discount_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Final Payable</span>
                      <span className="font-medium text-gray-900">₹{Number(viewDetailsBooking.final_amount || viewDetailsBooking.total_amount || 0).toLocaleString()}</span>
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
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1"><Users size={14}/> All Travellers ({viewDetailsBooking.travellers_count || selectedTravellers.length})</h3>
                {loadingTravellers ? (
                  <div className="p-4 text-center text-gray-500 text-sm animate-pulse">Loading travellers...</div>
                ) : selectedTravellers.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTravellers.map((t, idx) => (
                      <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm relative overflow-hidden">
                        {t.is_primary && (
                          <div className="absolute top-0 right-0 bg-[#01AFD1] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">PRIMARY</div>
                        )}
                        <p className="font-bold text-gray-900 mb-1">{t.full_name} <span className="text-gray-400 font-normal text-xs ml-1">({t.age} yrs, {t.gender})</span></p>

                        <div className="grid grid-cols-2 gap-y-2 mt-3 text-xs">
                           <div>
                             <span className="text-gray-400 block mb-0.5">Phone</span>
                             <span className="font-medium text-gray-800">{t.phone || '-'}</span>
                           </div>
                           <div>
                             <span className="text-gray-400 block mb-0.5">Email</span>
                             <span className="font-medium text-gray-800 line-clamp-1" title={t.email}>{t.email || '-'}</span>
                           </div>
                           <div>
                             <span className="text-gray-400 block mb-0.5">{t.id_document_type || 'ID Document'}</span>
                             <span className="font-medium text-gray-800 uppercase">{t.id_document_number || '-'}</span>
                           </div>
                           <div>
                             <span className="text-gray-400 block mb-0.5">Sharing Type</span>
                             <span className="font-medium text-gray-800 capitalize">{t.sharing_type || '-'}</span>
                           </div>
                           <div className="col-span-2 mt-1">
                             <span className="text-gray-400 block mb-0.5">Pickup Point</span>
                             <span className="font-medium text-gray-800">{t.pickup_point || '-'}</span>
                           </div>
                           {t.emergency_contact_name && (
                             <div className="col-span-2 bg-rose-50/50 p-2 rounded border border-rose-100 mt-2">
                               <span className="text-rose-400 block mb-0.5 text-[10px] font-bold uppercase">Emergency Contact</span>
                               <span className="font-medium text-gray-800">{t.emergency_contact_name} {t.emergency_contact_phone ? `(${t.emergency_contact_phone})` : ''}</span>
                             </div>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-6 text-center text-gray-500 text-sm">
                    No individual traveller records found.
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
                  className="w-full bg-slate-800  text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm col-span-2"
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
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#01AFD1] outline-none shadow-sm"
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
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#01AFD1] outline-none shadow-sm"
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
        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#01AFD1] outline-none font-medium text-gray-800"
      >
        <option value="Cancel Without Refund">Cancel Without Refund</option>
        <option value="Refund Pending">Refund Pending</option>
        <option value="Partial Refund">Partial Refund</option>
        <option value="Fully Refunded">Fully Refunded</option>
      </select>
    </div>
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

      {/* Delete Booking Modal */}
      {deleteModal.isOpen && deleteModal.booking && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-red-700 px-6 py-4 flex justify-between items-center text-white">
               <h3 className="text-lg font-bold">Secure Delete Booking</h3>
               <button onClick={() => setDeleteModal({ isOpen: false, booking: null, password: '', error: '', loading: false })} className="text-red-100 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
                <strong>WARNING:</strong> This action permanently removes this booking and cannot be undone.
              </div>
              <div className="text-sm text-gray-700">
                <p><strong>Booking ID:</strong> {deleteModal.booking.booking_id || deleteModal.booking.booking_reference || deleteModal.booking.id}</p>
                <p><strong>Package:</strong> {deleteModal.booking.package_title || 'N/A'}</p>
                <p><strong>Customer:</strong> {deleteModal.booking.customer_name || 'N/A'}</p>
              </div>
              {deleteModal.error === "Booking Delete Password has not been configured yet." ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm flex flex-col gap-3">
                  <p className="font-medium">{deleteModal.error}</p>
                  <button 
                    onClick={() => {
                      setDeleteModal({ isOpen: false, booking: null, password: '', error: '', loading: false });
                      setShowSecurityModal(true);
                    }}
                    className="bg-white border border-amber-300 text-amber-800 px-4 py-2 rounded-lg font-bold hover:bg-amber-100 transition-colors w-max"
                  >
                    Set Password
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Booking Delete Password *</label>
                    <input 
                      type="password"
                      value={deleteModal.password}
                      onChange={e => setDeleteModal(prev => ({ ...prev, password: e.target.value, error: '' }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-red-700 outline-none"
                      placeholder="Enter delete password"
                    />
                    {deleteModal.error && <p className="text-red-600 text-xs mt-1 font-semibold">{deleteModal.error}</p>}
                  </div>
                </>
              )}
            </div>
            <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button disabled={deleteModal.loading} onClick={() => setDeleteModal({ isOpen: false, booking: null, password: '', error: '', loading: false })} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              {deleteModal.error !== "Booking Delete Password has not been configured yet." && (
                <button disabled={deleteModal.loading} onClick={submitDelete} className="px-5 py-2 text-sm font-bold text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors shadow-sm disabled:opacity-50">
                  {deleteModal.loading ? 'Deleting...' : 'Delete Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Booking Modal */}
      {bulkDeleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-red-700 px-6 py-4 flex justify-between items-center text-white">
               <h3 className="text-lg font-bold">Delete Selected Bookings</h3>
               <button disabled={bulkDeleteModal.loading} onClick={() => setBulkDeleteModal({ isOpen: false, password: '', error: '', loading: false })} className="text-red-100 hover:text-white disabled:opacity-50"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
                <strong>WARNING:</strong> You are about to permanently delete {selectedRowIds.size} selected bookings. This action cannot be undone.
              </div>
              
              {bulkDeleteModal.error === "Booking Delete Password has not been configured yet." ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm flex flex-col gap-3">
                  <p className="font-medium">{bulkDeleteModal.error}</p>
                  <button 
                    onClick={() => {
                      setBulkDeleteModal({ isOpen: false, password: '', error: '', loading: false });
                      setShowSecurityModal(true);
                    }}
                    className="bg-white border border-amber-300 text-amber-800 px-4 py-2 rounded-lg font-bold hover:bg-amber-100 transition-colors w-max"
                  >
                    Set Password
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Booking Delete Password *</label>
                    <input 
                      type="password"
                      value={bulkDeleteModal.password}
                      onChange={e => setBulkDeleteModal(prev => ({ ...prev, password: e.target.value, error: '' }))}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-red-700 outline-none"
                      placeholder="Enter delete password"
                      disabled={bulkDeleteModal.loading}
                    />
                    {bulkDeleteModal.error && <p className="text-red-600 text-xs mt-1 font-semibold">{bulkDeleteModal.error}</p>}
                  </div>
                </>
              )}
            </div>
            <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button disabled={bulkDeleteModal.loading} onClick={() => setBulkDeleteModal({ isOpen: false, password: '', error: '', loading: false })} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">Cancel</button>
              {bulkDeleteModal.error !== "Booking Delete Password has not been configured yet." && (
                <button disabled={bulkDeleteModal.loading || selectedRowIds.size === 0} onClick={submitBulkDelete} className="px-5 py-2 text-sm font-bold text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors shadow-sm disabled:opacity-50">
                  {bulkDeleteModal.loading ? 'Deleting...' : `Delete ${selectedRowIds.size} Bookings`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showSecurityModal && (
        <AdminSecurityModal
          onClose={() => setShowSecurityModal(false)}
        />
      )}

      {/* Modals outside sticky header to prevent stacking context overlap */}
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

      {/* Classification Modal */}
      {classificationModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-[#01AFD1] px-6 py-4 flex justify-between items-center text-white">
               <h3 className="text-lg font-bold">Change Classification</h3>
               <button onClick={() => setClassificationModal({ isOpen: false })} className="text-white/80 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1">Sales Channel</label>
                 <select
                   value={classificationModal.channel}
                   onChange={e => setClassificationModal(prev => ({ ...prev, channel: e.target.value }))}
                   className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#01AFD1] outline-none"
                 >
                   <option value="unclassified">Unclassified</option>
                   <option value="b2c">B2C – Service Provided by TripoMist</option>
                   <option value="b2b">B2B – Transferred/Sold to Partner</option>
                 </select>
               </div>
               {classificationModal.channel === 'b2b' && (
                 <>
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Agency / Company Name *</label>
                     <input
                       type="text"
                       value={classificationModal.company}
                       onChange={e => setClassificationModal(prev => ({ ...prev, company: e.target.value }))}
                       className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#01AFD1] outline-none"
                       placeholder="Partner Company Name"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                     <textarea
                       value={classificationModal.notes}
                       onChange={e => setClassificationModal(prev => ({ ...prev, notes: e.target.value }))}
                       className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#01AFD1] outline-none"
                       placeholder="Additional details..."
                       rows="2"
                     />
                   </div>
                 </>
               )}
            </div>
            <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setClassificationModal({ isOpen: false })} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Abort</button>
              <button
                onClick={async () => {
                  if (classificationModal.channel === 'b2b' && !classificationModal.company.trim()) {
                    alert('Agency / Company Name is required for B2B.');
                    return;
                  }
                  await classifyBooking(viewDetailsBooking, classificationModal.channel, classificationModal.company, classificationModal.notes);
                  setClassificationModal({ isOpen: false });
                }}
                className="px-5 py-2 text-sm font-bold text-white bg-[#01AFD1] rounded-lg hover:bg-[#0092b3] transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBookings;
