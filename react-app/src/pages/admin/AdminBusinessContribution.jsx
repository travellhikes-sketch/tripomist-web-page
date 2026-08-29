import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { IndianRupee, Settings, Plus, X, HandCoins, Filter, Check, AlertTriangle } from 'lucide-react';

export default function AdminBusinessContribution() {
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [missingBookings, setMissingBookings] = useState([]);
  const [error, setError] = useState(null);

  // Settings Modal
  const [showSettings, setShowSettings] = useState(false);
  
  // New Rate State
  const [showNewRate, setShowNewRate] = useState(false);
  const [newRateChannel, setNewRateChannel] = useState('B2B');
  const [newRateAmount, setNewRateAmount] = useState('');
  const [newRateEffective, setNewRateEffective] = useState(() => new Date().toISOString().slice(0, 16));

  // Filters State
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState((currentDate.getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear().toString());
  const [filterChannel, setFilterChannel] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Rates
      const { data: ratesData, error: ratesError } = await supabase
        .from('business_contribution_rates')
        .select('*')
        .order('effective_from', { ascending: false });
      
      if (ratesError) {
        console.error("Rates Query Error:", ratesError);
        throw ratesError;
      }
      setRates(ratesData || []);

      // Fetch Contributions
      const { data: contribsData, error: contribsError } = await supabase
        .from('booking_contributions')
        .select(`
          *,
          booking:bookings(id, booking_id, customer_name, b2b_partner_company, destination)
        `)
        .order('accrued_at', { ascending: false });
      if (contribsError) throw contribsError;
      setContributions(contribsData || []);

      // Fetch missing bookings
      const { data: bData, error: bError } = await supabase
        .from('bookings')
        .select('id, booking_id, sales_channel, customer_name, b2b_partner_company, created_at')
        .in('sales_channel', ['b2b', 'b2c']);
      
      if (!bError && bData && contribsData) {
        const contribBookingIds = new Set(contribsData.map(c => c.booking_id));
        const missing = bData.filter(b => !contribBookingIds.has(b.id));
        setMissingBookings(missing);
      }

    } catch (err) {
      console.error("EXACT ERROR:", err);
      setError('Failed to fetch data: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleAddRate = async (e) => {
    e.preventDefault();
    if (!newRateAmount || isNaN(newRateAmount) || Number(newRateAmount) < 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('business_contribution_rates').insert({
        sales_channel: newRateChannel,
        amount: parseFloat(newRateAmount),
        effective_from: new Date(newRateEffective).toISOString(),
        created_by: user.id
      });
      if (error) throw error;
      
      setShowNewRate(false);
      setNewRateAmount('');
      fetchData();
    } catch (err) {
      alert('Error creating rate');
      console.error(err);
    }
  };

  const markAsPaid = async (contributionIds) => {
    const isBulk = Array.isArray(contributionIds);
    const count = isBulk ? contributionIds.length : 1;
    const totalAmount = isBulk 
      ? contributions.filter(c => contributionIds.includes(c.id)).reduce((acc, c) => acc + Number(c.contribution_amount), 0)
      : contributions.find(c => c.id === contributionIds)?.contribution_amount;

    if (!window.confirm(`Are you sure you want to mark ${count} contribution(s) totaling ₹${Number(totalAmount).toLocaleString()} as paid?`)) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const idsToUpdate = isBulk ? contributionIds : [contributionIds];
      
      const promises = idsToUpdate.map(id => 
        supabase.from('booking_contributions').update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: user.id
        }).eq('id', id)
      );

      await Promise.all(promises);
      setSelectedIds(new Set());
      fetchData();
    } catch (err) {
      alert('Error marking as paid');
    }
  };

  const generateMissingContributions = async () => {
    if (!missingBookings.length) return;
    if (!window.confirm(`Generate contributions for ${missingBookings.length} historical bookings based on CURRENT active rates?`)) return;

    setLoading(true);
    try {
      // Fetch latest rates
      const { data: latestRates } = await supabase.from('business_contribution_rates').select('*').order('effective_from', { ascending: false });
      
      const getLatestRate = (channel) => latestRates?.find(r => r.sales_channel === channel);

      for (const b of missingBookings) {
        const channelLabel = b.sales_channel === 'b2b' ? 'B2B' : 'B2C';
        const rate = getLatestRate(channelLabel);
        if (rate) {
          await supabase.from('booking_contributions').upsert({
            booking_id: b.id,
            sales_channel: channelLabel,
            rate_id: rate.id,
            contribution_amount: rate.amount,
            accrued_at: b.created_at
          }, { onConflict: 'booking_id' });
        }
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to generate missing contributions');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (e, filteredData) => {
    if (e.target.checked) {
      const unpaid = filteredData.filter(c => c.status === 'unpaid').map(c => c.id);
      setSelectedIds(new Set(unpaid));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const currentB2BRate = rates.find(r => r.sales_channel === 'B2B')?.amount;
  const currentB2CRate = rates.find(r => r.sales_channel === 'B2C')?.amount;

  const filteredContributions = useMemo(() => {
    return contributions.filter(c => {
      const d = new Date(c.accrued_at);
      const mMatch = filterMonth === 'All' || (d.getMonth() + 1).toString() === filterMonth;
      const yMatch = filterYear === 'All' || d.getFullYear().toString() === filterYear;
      const cMatch = filterChannel === 'All' || c.sales_channel === filterChannel;
      const sMatch = filterStatus === 'All' || c.status === filterStatus.toLowerCase();
      return mMatch && yMatch && cMatch && sMatch;
    });
  }, [contributions, filterMonth, filterYear, filterChannel, filterStatus]);

  const summary = useMemo(() => {
    let total = 0, paid = 0, unpaid = 0;
    filteredContributions.forEach(c => {
      const amt = Number(c.contribution_amount);
      total += amt;
      if (c.status === 'paid') paid += amt;
      if (c.status === 'unpaid') unpaid += amt;
    });
    return { total, paid, unpaid, count: filteredContributions.length };
  }, [filteredContributions]);

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col relative overflow-x-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            Charity Contribution
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track contributions from B2B and B2C bookings.</p>
        </div>
        
        <button 
          onClick={() => setShowSettings(true)}
          className="px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm"
        >
          <Settings size={16} /> Contribution Settings
        </button>
      </div>

      <div className="p-6 overflow-y-auto space-y-6 max-w-7xl mx-auto w-full">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

        <div className="space-y-6">
          {missingBookings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-amber-900">Contribution Not Generated</h4>
                  <p className="text-sm text-amber-700 mt-0.5">Found {missingBookings.length} historical bookings that are classified but lack contribution records.</p>
                </div>
              </div>
              <button 
                onClick={generateMissingContributions}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
              >
                Generate Missing Contributions
              </button>
            </div>
          )}

          {/* Simple Monthly Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <span className="text-xs font-medium text-gray-500">This Month</span>
              <p className="text-xl font-semibold text-gray-900 mt-1">₹{summary.total.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <span className="text-xs font-medium text-gray-500">Paid</span>
              <p className="text-xl font-semibold text-gray-900 mt-1">₹{summary.paid.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <span className="text-xs font-medium text-gray-500">Unpaid</span>
              <p className="text-xl font-semibold text-gray-900 mt-1">₹{summary.unpaid.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <span className="text-xs font-medium text-gray-500">Bookings</span>
              <p className="text-xl font-semibold text-gray-900 mt-1">{summary.count}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-1.5 w-full sm:w-auto">
                  <Filter size={16} className="text-gray-400" />
                  <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none">
                    <option value="All">All Months</option>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i+1} value={(i+1).toString()}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                    ))}
                  </select>
                  <span className="text-gray-300">|</span>
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none">
                    <option value="All">All Years</option>
                    {[...new Set(contributions.map(c => new Date(c.accrued_at).getFullYear()))].sort().reverse().map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
                
                <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 bg-white outline-none">
                  <option value="All">All Channels</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 bg-white outline-none">
                  <option value="All">All Statuses</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              
              {selectedIds.size > 0 && (
                <button 
                  onClick={() => markAsPaid(Array.from(selectedIds))}
                  className="bg-[#01AFD1] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-[#0092b3] transition-colors"
                >
                  <Check size={16} /> Mark {selectedIds.size} as Paid
                </button>
              )}
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-gray-500 uppercase text-xs font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-[#01AFD1] focus:ring-[#01AFD1]"
                        checked={filteredContributions.length > 0 && selectedIds.size === filteredContributions.filter(c => c.status === 'unpaid').length && selectedIds.size > 0}
                        onChange={(e) => toggleSelectAll(e, filteredContributions)}
                      />
                    </th>
                    <th className="px-4 py-3">Booking ID</th>
                    <th className="px-4 py-3">Customer / Partner</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3 text-right">Contribution</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && contributions.length === 0 ? (
                    <tr><td colSpan="9" className="px-6 py-8 text-center text-gray-500 font-medium">Loading records...</td></tr>
                  ) : filteredContributions.length === 0 ? (
                    <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-500">No contributions match your filters.</td></tr>
                  ) : (
                    filteredContributions.map(c => (
                      <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(c.id) ? 'bg-[#01AFD1]/10/50' : ''}`}>
                        <td className="px-4 py-3 text-center">
                          {c.status === 'unpaid' && (
                            <input 
                              type="checkbox"
                              className="rounded border-gray-300 text-[#01AFD1] focus:ring-[#01AFD1]"
                              checked={selectedIds.has(c.id)}
                              onChange={() => toggleSelect(c.id)}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#01AFD1]">{c.booking?.booking_id || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-900">
                          {c.sales_channel === 'B2B' ? c.booking?.b2b_partner_company : c.booking?.customer_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]" title={c.booking?.destination}>{c.booking?.destination || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${c.sales_channel === 'B2B' ? 'bg-[#01AFD1]/10 text-[#0092b3] border-[#01AFD1]/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {c.sales_channel}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 text-right">₹{Number(c.contribution_amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(c.accrued_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 text-center">
                          {c.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 text-xs font-medium">
                              <Check size={12} /> Paid
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 text-amber-700 text-xs font-medium">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {c.status === 'unpaid' ? (
                            <button 
                              onClick={() => markAsPaid(c.id)} 
                              className="text-[#01AFD1] hover:text-[#0092b3] font-medium text-sm transition-colors"
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">Paid {new Date(c.paid_at).toLocaleDateString('en-GB')}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Contribution Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-200 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">B2C Contribution per Booking</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentB2CRate !== undefined ? `₹${Number(currentB2CRate).toLocaleString()}` : <span className="text-gray-400 text-sm">Not set</span>}
                  </p>
                </div>
                <div className="border border-gray-200 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">B2B Contribution per Booking</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentB2BRate !== undefined ? `₹${Number(currentB2BRate).toLocaleString()}` : <span className="text-gray-400 text-sm">Not set</span>}
                  </p>
                </div>
              </div>

              {!showNewRate ? (
                <button 
                  onClick={() => setShowNewRate(true)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors mb-6"
                >
                  <Plus size={16} /> Add New Rate
                </button>
              ) : (
                <form onSubmit={handleAddRate} className="bg-slate-50 border border-gray-200 p-4 rounded-lg mb-6 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Add New Rate</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
                      <select value={newRateChannel} onChange={(e) => setNewRateChannel(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white outline-none">
                        <option value="B2B">B2B</option>
                        <option value="B2C">B2C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                      <input type="number" required min="0" value={newRateAmount} onChange={(e) => setNewRateAmount(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Effective From</label>
                    <input type="datetime-local" required value={newRateEffective} onChange={(e) => setNewRateEffective(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white outline-none" />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setShowNewRate(false)} className="px-4 py-2 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-[#01AFD1] text-white font-medium rounded-md text-sm hover:bg-[#0092b3] transition-colors">Save Rate</button>
                  </div>
                </form>
              )}

              <details className="group border border-gray-200 rounded-lg open:bg-gray-50">
                <summary className="p-3 font-medium text-sm text-gray-700 cursor-pointer select-none">
                  View Rate History
                </summary>
                <div className="p-3 pt-0">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500 font-medium">
                      <tr>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Channel</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rates.length === 0 ? (
                        <tr><td colSpan="3" className="py-2 text-gray-400 text-xs">No rates found.</td></tr>
                      ) : (
                        rates.map(rate => (
                          <tr key={rate.id}>
                            <td className="py-2 text-gray-600 text-xs">{new Date(rate.effective_from).toLocaleDateString('en-GB')}</td>
                            <td className="py-2">
                              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${rate.sales_channel === 'B2B' ? 'bg-[#01AFD1]/10 text-[#0092b3] border-[#01AFD1]/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                {rate.sales_channel}
                              </span>
                            </td>
                            <td className="py-2 text-gray-900 font-medium text-right text-xs">₹{Number(rate.amount).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
