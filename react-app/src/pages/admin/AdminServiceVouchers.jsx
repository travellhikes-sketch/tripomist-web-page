import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Search, X, Copy, Check, AlertCircle, RefreshCw
} from 'lucide-react';

const AdminServiceVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('service_vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Auto-expire vouchers past their validity
      const now = new Date();
      const processed = (data || []).map(v => {
        if (v.status === 'active' && new Date(v.valid_until) < now) {
          return { ...v, status: 'expired' };
        }
        return v;
      });

      setVouchers(processed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsClaimed = async () => {
    if (!selectedVoucher) return;
    setClaimLoading(true);
    try {
      const { error } = await supabase
        .from('service_vouchers')
        .update({
          status: 'claimed',
          claimed_at: new Date().toISOString()
        })
        .eq('id', selectedVoucher.id);

      if (error) throw error;

      setVouchers(prev => prev.map(v =>
        v.id === selectedVoucher.id ? { ...v, status: 'claimed', claimed_at: new Date().toISOString() } : v
      ));
      setSelectedVoucher(prev => ({ ...prev, status: 'claimed', claimed_at: new Date().toISOString() }));
      alert('Voucher marked as claimed successfully!');
    } catch (err) {
      console.error('Claim error:', err);
      alert('Failed to mark voucher as claimed: ' + err.message);
    } finally {
      setClaimLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      claimed: 'bg-blue-50 text-blue-700 border border-blue-200',
      expired: 'bg-gray-100 text-gray-600 border border-gray-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${styles[status] || styles.active}`}>
        {status}
      </span>
    );
  };

  const filteredVouchers = vouchers.filter(v => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (v.voucher_code?.toLowerCase() || '').includes(term) ||
      (v.traveller_name?.toLowerCase() || '').includes(term) ||
      (v.traveller_phone || '').includes(term) ||
      (v.traveller_email?.toLowerCase() || '').includes(term) ||
      (v.package_title?.toLowerCase() || '').includes(term) ||
      (v.booking_reference?.toLowerCase() || '').includes(term);
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const activeCount = vouchers.filter(v => v.status === 'active').length;
  const claimedCount = vouchers.filter(v => v.status === 'claimed').length;
  const expiredCount = vouchers.filter(v => v.status === 'expired').length;

  return (
    <>
      <div className="flex flex-col h-full animate-fade-in">
        {/* Simple Clean Header */}
        <div className="sticky top-0 z-10 bg-slate-50 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Service Vouchers</h1>
              <p className="text-xs text-gray-500 mt-0.5">Manage issued vouchers for cancelled travellers</p>
            </div>
            <button
              onClick={fetchVouchers}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm font-semibold"
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md flex items-center justify-between mb-4 text-sm">
              <span className="flex items-center gap-2"><AlertCircle size={16} /> {error}</span>
              <button onClick={() => setError(null)}><X size={16} /></button>
            </div>
          )}

          {/* Simple Clean Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded border border-gray-200 p-3.5 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase">Active</div>
              <div className="text-xl font-bold text-emerald-600 mt-0.5">{activeCount}</div>
            </div>
            <div className="bg-white rounded border border-gray-200 p-3.5 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase">Claimed</div>
              <div className="text-xl font-bold text-blue-600 mt-0.5">{claimedCount}</div>
            </div>
            <div className="bg-white rounded border border-gray-200 p-3.5 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase">Expired</div>
              <div className="text-xl font-bold text-gray-500 mt-0.5">{expiredCount}</div>
            </div>
          </div>

          {/* Clean Search & Filter Bar */}
          <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, phone, voucher code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#01AFD1] cursor-pointer text-xs"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="claimed">Claimed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Clean Standard Table */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-[#01AFD1]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#01AFD1] mb-3"></div>
                <p className="text-xs text-gray-500">Loading vouchers...</p>
              </div>
            ) : filteredVouchers.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-sm font-bold text-gray-900">No vouchers found</p>
                <p className="text-xs text-gray-500 mt-1">Vouchers will appear here when travellers are cancelled from bookings.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200 text-gray-700">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Voucher Code</th>
                    <th className="py-2.5 px-4 font-bold">Traveller</th>
                    <th className="py-2.5 px-4 font-bold">Package / Booking</th>
                    <th className="py-2.5 px-4 font-bold">Valid Until</th>
                    <th className="py-2.5 px-4 font-bold">Status</th>
                    <th className="py-2.5 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-semibold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <span>{voucher.voucher_code}</span>
                          <button
                            onClick={() => handleCopyCode(voucher.voucher_code)}
                            className="text-gray-400 hover:text-gray-700 p-0.5"
                            title="Copy Code"
                          >
                            {copied === voucher.voucher_code ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="text-[10px] text-gray-400 font-sans mt-0.5">
                          Issued: {new Date(voucher.created_at).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-gray-900">{voucher.traveller_name}</div>
                        <div className="text-[11px] text-gray-500">{voucher.traveller_phone || voucher.traveller_email || 'N/A'}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-gray-800 truncate max-w-[200px]">{voucher.package_title || 'N/A'}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{voucher.booking_reference || 'N/A'}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className={`font-semibold ${new Date(voucher.valid_until) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                          {new Date(voucher.valid_until).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        {getStatusBadge(voucher.status)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedVoucher(voucher)}
                          className="px-2.5 py-1 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50 transition-colors"
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
      </div>

      {/* Simple Clean Side Drawer for Details */}
      {selectedVoucher && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[90]" onClick={() => setSelectedVoucher(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[100] flex flex-col border-l border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-base font-bold text-gray-900">Voucher Details</h2>
                <div className="text-xs text-gray-500 font-mono mt-0.5">{selectedVoucher.voucher_code}</div>
              </div>
              <button onClick={() => setSelectedVoucher(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Voucher Code Box */}
              <div className="border border-gray-200 rounded p-3 bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Voucher Code</div>
                  <div className="text-base font-mono font-bold text-gray-900">{selectedVoucher.voucher_code}</div>
                </div>
                <div>{getStatusBadge(selectedVoucher.status)}</div>
              </div>

              {/* Traveller Info */}
              <div>
                <h3 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-1.5 mb-2 uppercase tracking-wide">Traveller Information</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-bold text-gray-900">{selectedVoucher.traveller_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-semibold text-gray-800">{selectedVoucher.traveller_phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-semibold text-gray-800">{selectedVoucher.traveller_email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div>
                <h3 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-1.5 mb-2 uppercase tracking-wide">Original Booking</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Booking Ref:</span>
                    <span className="font-semibold text-[#01AFD1]">{selectedVoucher.booking_reference || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Package:</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[200px] truncate">{selectedVoucher.package_title || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Voucher Dates */}
              <div>
                <h3 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-1.5 mb-2 uppercase tracking-wide">Voucher Dates</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Issued On:</span>
                    <span className="font-semibold text-gray-800">{new Date(selectedVoucher.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valid Until:</span>
                    <span className={`font-bold ${new Date(selectedVoucher.valid_until) < new Date() ? 'text-red-600' : 'text-emerald-700'}`}>
                      {new Date(selectedVoucher.valid_until).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  {selectedVoucher.claimed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Claimed On:</span>
                      <span className="font-semibold text-blue-600">{new Date(selectedVoucher.claimed_at).toLocaleDateString('en-GB')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason */}
              {selectedVoucher.reason && (
                <div>
                  <h3 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-1.5 mb-2 uppercase tracking-wide">Cancellation Reason</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded p-2.5 text-gray-800 whitespace-pre-wrap">
                    {selectedVoucher.reason}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                {selectedVoucher.status === 'active' && (
                  <button
                    onClick={handleMarkAsClaimed}
                    disabled={claimLoading}
                    className="w-full bg-[#01AFD1] hover:bg-[#0092b3] text-white py-2 rounded font-bold transition-colors text-xs disabled:opacity-50"
                  >
                    {claimLoading ? 'Processing...' : 'Mark as Claimed'}
                  </button>
                )}

                {selectedVoucher.status === 'claimed' && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                    <p className="text-xs font-bold text-blue-800">This voucher has been claimed</p>
                    {selectedVoucher.claimed_at && (
                      <p className="text-[11px] text-blue-600 mt-0.5">
                        Claimed on {new Date(selectedVoucher.claimed_at).toLocaleDateString('en-GB')}
                      </p>
                    )}
                  </div>
                )}

                {selectedVoucher.status === 'expired' && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                    <p className="text-xs font-bold text-gray-600">This voucher has expired</p>
                  </div>
                )}

                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="w-full py-2 border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 text-xs"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminServiceVouchers;
