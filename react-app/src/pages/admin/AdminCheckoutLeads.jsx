import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Phone,
  Mail,
  MessageCircle,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const LEADS_PER_PAGE = 15;

const STATUS_COLORS = {
  checkout_started: 'bg-blue-100 text-blue-700',
  payment_pending: 'bg-yellow-100 text-yellow-700',
  converted: 'bg-emerald-100 text-emerald-700',
  contacted: 'bg-purple-100 text-purple-700',
  not_interested: 'bg-gray-100 text-gray-500',
};

const PAYMENT_COLORS = {
  not_started: 'bg-gray-100 text-gray-500',
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-600',
};

const STEP_LABELS = {
  popup_submitted: 'Popup Submitted',
  checkout_opened: 'Checkout Opened',
  sharing_selected: 'Sharing Selected',
  razorpay_opened: 'Razorpay Opened',
  payment_success: 'Payment Success',
  payment_failed: 'Payment Failed',
};

const AdminCheckoutLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('checkout_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to load checkout leads. Make sure you are logged in as an admin and the table exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, field, newValue) => {
    try {
      const { error } = await supabase
        .from('checkout_leads')
        .update({ [field]: newValue })
        .eq('id', id);

      if (error) throw error;
      setLeads(leads.map(l => l.id === id ? { ...l, [field]: newValue } : l));
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert(`Failed to update.`);
    }
  };

  const isPossiblyAbandoned = (lead) => {
    if (lead.lead_status === 'converted') return false;
    if (lead.lead_status === 'contacted') return false;
    if (lead.lead_status === 'not_interested') return false;
    const lastActivity = new Date(lead.last_activity_at || lead.created_at);
    const now = new Date();
    return (now - lastActivity) > 30 * 60 * 1000; // 30 minutes
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      (l.lead_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (l.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (l.phone || '').includes(searchTerm) ||
      (l.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (l.package_title?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || l.lead_status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const leadDateStr = l.created_at ? l.created_at.split('T')[0] : '';
      matchesDate = leadDateStr === dateFilter;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const currentLeads = filteredLeads.slice(
    (currentPage - 1) * LEADS_PER_PAGE,
    currentPage * LEADS_PER_PAGE
  );

  const statusCounts = {
    all: leads.length,
    checkout_started: leads.filter(l => l.lead_status === 'checkout_started').length,
    payment_pending: leads.filter(l => l.lead_status === 'payment_pending').length,
    converted: leads.filter(l => l.lead_status === 'converted').length,
    contacted: leads.filter(l => l.lead_status === 'contacted').length,
    not_interested: leads.filter(l => l.lead_status === 'not_interested').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checkout Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track customers who started the booking process
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'checkout_started', label: 'Checkout Started' },
          { key: 'payment_pending', label: 'Payment Pending' },
          { key: 'converted', label: 'Converted' },
          { key: 'contacted', label: 'Contacted' },
          { key: 'not_interested', label: 'Not Interested' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => { setStatusFilter(f.key); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label} ({statusCounts[f.key] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email, package..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Filter by Day:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          />
          {dateFilter && (
            <button
              onClick={() => { setDateFilter(''); setCurrentPage(1); }}
              className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-55 px-2 py-1.5 rounded-lg border border-red-200 transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Lead</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Package</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Travel Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Step</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Payment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-400">
                    No leads found
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {/* Lead Number */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-gray-800">{lead.lead_number}</span>
                      {isPossiblyAbandoned(lead) && (
                        <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">
                          <Clock size={10} /> Abandoned?
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{lead.customer_name}</div>
                      <div className="text-xs text-gray-500">{lead.phone}</div>
                      {lead.email && <div className="text-xs text-gray-400">{lead.email}</div>}
                    </td>

                    {/* Package */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 max-w-[140px] truncate">{lead.package_title || '—'}</div>
                      {lead.destination && <div className="text-xs text-gray-400">{lead.destination}</div>}
                      {lead.selected_sharing && <div className="text-xs text-gray-400">{lead.selected_sharing}</div>}
                    </td>

                    {/* Travel Date */}
                    <td className="px-4 py-3 text-gray-700">
                      {lead.travel_date
                        ? new Date(lead.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                      {lead.travellers && <div className="text-xs text-gray-400">{lead.travellers} traveller(s)</div>}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {lead.estimated_amount ? `₹${Number(lead.estimated_amount).toLocaleString('en-IN')}` : '—'}
                    </td>

                    {/* Current Step */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-600">
                        {STEP_LABELS[lead.current_step] || lead.current_step}
                      </span>
                    </td>

                    {/* Lead Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_COLORS[lead.lead_status] || 'bg-gray-100 text-gray-500'}`}>
                        {(lead.lead_status || '').replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${PAYMENT_COLORS[lead.payment_status] || 'bg-gray-100 text-gray-500'}`}>
                        {(lead.payment_status || '').replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      <br />
                      {new Date(lead.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Call */}
                        <a
                          href={`tel:+${formatPhone(lead.phone)}`}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Call"
                        >
                          <Phone size={14} />
                        </a>

                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/${formatPhone(lead.phone)}?text=${encodeURIComponent(`Hi ${lead.customer_name}, this is TripoMist. We noticed you were interested in ${lead.package_title || 'a trip'}. Can we help you complete your booking?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </a>

                        {/* Email */}
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your ${lead.package_title || 'Trip'} Booking`)}`}
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                            title="Email"
                          >
                            <Mail size={14} />
                          </a>
                        )}

                        {/* Mark Contacted */}
                        {lead.lead_status !== 'contacted' && lead.lead_status !== 'converted' && (
                          <button
                            onClick={() => handleStatusUpdate(lead.id, 'lead_status', 'contacted')}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                            title="Mark Contacted"
                          >
                            <UserCheck size={14} />
                          </button>
                        )}

                        {/* Mark Not Interested */}
                        {lead.lead_status !== 'not_interested' && lead.lead_status !== 'converted' && (
                          <button
                            onClick={() => handleStatusUpdate(lead.id, 'lead_status', 'not_interested')}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Mark Not Interested"
                          >
                            <UserX size={14} />
                          </button>
                        )}

                        {/* Open Booking (when converted) */}
                        {lead.lead_status === 'converted' && (
                          <a
                            href="/admin/bookings"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                            title="View Booking"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(currentPage - 1) * LEADS_PER_PAGE + 1}–{Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCheckoutLeads;
