import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Phone, Search, RefreshCw, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const AdminItineraryLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [callbackFilter, setCallbackFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('itinerary_download_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching itinerary leads:', err);
      setError('Failed to load leads. Ensure the table exists and you have admin access.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('itinerary_download_leads')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    if (phone.length === 10) return `+91 ${phone.substring(0, 5)} ${phone.substring(5)}`;
    return phone;
  };

  const toggleRow = (phone) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(phone)) {
      newExpanded.delete(phone);
    } else {
      newExpanded.add(phone);
    }
    setExpandedRows(newExpanded);
  };

  // 1. Filter Leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (lead.phone || '').includes(searchTerm) ||
                          (lead.package_title?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    let matchesCallback = true;
    if (callbackFilter === 'yes') matchesCallback = lead.expecting_callback === true;
    if (callbackFilter === 'no') matchesCallback = lead.expecting_callback === false;

    return matchesSearch && matchesStatus && matchesCallback;
  });

  // 2. Group Leads by Phone
  // Underlying records are individual itinerary interaction events.
  // The Admin UI consolidates them by normalized customer identity (phone -> email -> id)
  // so the same real customer appears once, while preserving ALL their package/download history.
  const normalizePhone = (phone) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) return clean;
    if (clean.length === 12 && clean.startsWith('91')) return clean.substring(2);
    if (clean.length === 11 && clean.startsWith('0')) return clean.substring(1);
    return phone; // Fallback: don't falsely normalize arbitrary/malformed numbers
  };

  const groupedLeadsMap = new Map();
  filteredLeads.forEach(lead => {
    let key = lead.id;
    const normPhone = normalizePhone(lead.phone);
    if (normPhone) {
      key = normPhone;
    } else if (lead.email) {
      key = lead.email.trim().toLowerCase();
    }

    if (!groupedLeadsMap.has(key)) {
      groupedLeadsMap.set(key, {
        key,
        primaryLead: lead,
        activities: [],
        totalDownloads: 0,
        hasCallback: false
      });
    }
    const group = groupedLeadsMap.get(key);
    group.activities.push(lead);
    group.totalDownloads++;
    if (lead.expecting_callback) group.hasCallback = true;
  });

  const groupedLeads = Array.from(groupedLeadsMap.values());

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Itinerary Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Manage leads from PDF downloads</p>
        </div>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-200">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, phone or package..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
        </select>
        <select
          value={callbackFilter}
          onChange={(e) => setCallbackFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">Any Callback</option>
          <option value="yes">Callback Requested</option>
          <option value="no">No Callback</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Lead Info</th>
                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                <th className="px-6 py-4 whitespace-nowrap">Latest Package</th>
                <th className="px-6 py-4 whitespace-nowrap">Latest Date</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading leads...
                    </div>
                  </td>
                </tr>
              ) : groupedLeads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No leads found matching your filters.
                  </td>
                </tr>
              ) : (
                groupedLeads.map((group) => {
                  const { key, primaryLead, activities, totalDownloads, hasCallback } = group;
                  const isExpanded = expandedRows.has(key);

                  return (
                    <React.Fragment key={key}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{primaryLead.full_name}</div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                            <Phone size={12} />
                            {formatPhone(primaryLead.phone)}
                          </div>
                          {hasCallback && (
                            <div className="inline-flex items-center gap-1 mt-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              Callback Requested
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-800 font-medium">
                          {primaryLead.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{primaryLead.package_title || 'N/A'}</div>
                          {totalDownloads > 1 && (
                            <button 
                              onClick={() => toggleRow(key)}
                              className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {totalDownloads} Views
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">
                            {new Date(primaryLead.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(primaryLead.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={primaryLead.status || 'new'}
                            onChange={(e) => handleStatusUpdate(primaryLead.id, e.target.value)}
                            className={`text-xs font-bold rounded-full px-3 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:outline-none ${
                              primaryLead.status === 'contacted'
                                ? 'bg-emerald-100 text-emerald-700 focus:ring-emerald-500'
                                : 'bg-blue-100 text-blue-700 focus:ring-blue-500'
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={`https://wa.me/${primaryLead.phone}?text=Hi%20${encodeURIComponent(primaryLead.full_name)}%2C%20saw%20you%20downloaded%20the%20itinerary%20for%20${encodeURIComponent(primaryLead.package_title || '')}.%20How%20can%20we%20help%3F`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                            </svg>
                          </a>
                        </td>
                      </tr>
                      {isExpanded && activities.slice(1).map(act => (
                        <tr key={act.id} className="bg-slate-50 border-t border-slate-100 text-xs">
                          <td className="px-6 py-2 pl-12">
                            <span className="text-gray-400">Previous Download</span>
                          </td>
                          <td className="px-6 py-2 text-gray-500">
                            {act.email}
                          </td>
                          <td className="px-6 py-2">
                            <div className="font-medium text-gray-600">{act.package_title || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-2 text-gray-500" colSpan="3">
                            {new Date(act.created_at).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminItineraryLeads;


