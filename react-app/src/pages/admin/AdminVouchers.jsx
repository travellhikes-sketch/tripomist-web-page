import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Ticket, Search, RefreshCw, AlertCircle, Ban } from 'lucide-react';
import ConfirmModal from '../../components/admin/ConfirmModal';

const AdminVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'danger' });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select(`
          *,
          bookings:source_booking_id (
            booking_id,
            customer_name,
            phone,
            email
          ),
          voucher_internal_notes (
            internal_notes
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoidVoucher = (id) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Void Voucher',
      message: 'Are you sure you want to void this voucher? This cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('vouchers')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', id);

          if (error) throw error;
          
          setVouchers(prev => prev.map(v => 
            v.id === id ? { ...v, status: 'cancelled' } : v
          ));
        } catch (err) {
          console.error(err);
          alert('Failed to void voucher: ' + err.message);
        }
      }
    });
  };

  const getStatusBadge = (status, expiry) => {
    const isExpired = status === 'active' && new Date(expiry) < new Date();
    if (isExpired) return <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">Expired</span>;
    
    switch(status) {
      case 'active': return <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">Active</span>;
      case 'fully_redeemed': return <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700">Fully Redeemed</span>;
      case 'void': return <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-700">Void</span>;
      default: return <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const filteredVouchers = vouchers.filter(v => {
    const term = searchTerm.toLowerCase();
    const isExpired = v.status === 'active' && new Date(v.expiry_date) < new Date();
    const displayStatus = isExpired ? 'expired' : v.status;
    
    const matchesSearch = 
      (v.voucher_code?.toLowerCase() || '').includes(term) ||
      (v.bookings?.customer_name?.toLowerCase() || '').includes(term) ||
      (v.bookings?.phone?.toLowerCase() || '').includes(term) ||
      (v.bookings?.booking_id?.toLowerCase() || '').includes(term);
      
    const matchesStatus = statusFilter === 'all' || displayStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="sticky top-0 z-10 bg-slate-50 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Ticket className="text-emerald-600" /> Coupons
            </h1>
            <p className="text-sm text-gray-500">Manage customer apology and cancellation coupons.</p>
          </div>
          <button onClick={fetchVouchers} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 text-sm font-semibold flex items-center gap-2">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md flex items-center gap-2 mb-4 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search code, customer, booking ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 w-48">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md p-1.5 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="fully_redeemed">Fully Redeemed</option>
              <option value="void">Void</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-emerald-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mb-3"></div>
            <p className="text-sm font-medium text-gray-500">Loading vouchers...</p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-base font-bold text-gray-900">No coupons found</h3>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10 outline outline-1 outline-gray-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold text-gray-600">Coupon Code</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600">Customer</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600">Original Booking</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600 text-right">Amount (₹)</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600 text-right">Balance (₹)</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600">Dates</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600">Status</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="font-mono font-bold text-[#136b8a]">{v.voucher_code}</div>
                      <button onClick={() => { navigator.clipboard.writeText(v.voucher_code); alert('Copied code!'); }} className="text-gray-400 hover:text-emerald-600 p-0.5 rounded" title="Copy Code">
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    </div>
                    {v.user_id ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">Account Linked</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">Account Link Required</span>
                    )}
                    <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={v.notes}>{v.notes || '-'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900">{v.bookings?.customer_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{v.bookings?.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs text-gray-600 font-mono">{v.bookings?.booking_id || '-'}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-medium text-gray-900">{Number(v.original_amount).toLocaleString()}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-bold text-emerald-600">{Number(v.current_balance).toLocaleString()}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs text-gray-500">Issued: {new Date(v.created_at).toLocaleDateString()}</div>
                    <div className="text-xs font-semibold text-gray-700">Exp: {new Date(v.expiry_date).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(v.status, v.expiry_date)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => {
                          const instructions = `Here is your Coupon Code: ${v.voucher_code}\n\nTo redeem, please log in or create an account using the email address you provided during your original booking. You can apply this code during checkout to deduct ₹${Number(v.current_balance).toLocaleString()} from your total.`;
                          navigator.clipboard.writeText(instructions);
                          alert('Customer Instructions Copied!');
                        }}
                        className="text-[#136b8a] hover:bg-blue-50 p-1.5 rounded-md transition-colors inline-flex"
                        title="Copy Customer Instructions"
                      >
                        <span className="material-symbols-outlined text-[16px]">integration_instructions</span>
                      </button>
                      {v.status === 'active' && (
                        <button 
                          onClick={() => handleVoidVoucher(v.id)}
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition-colors inline-flex"
                          title="Void Coupon"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <ConfirmModal 
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        onConfirm={confirmModalConfig.onConfirm}
        type={confirmModalConfig.type}
      />
    </div>
  );
};

export default AdminVouchers;
