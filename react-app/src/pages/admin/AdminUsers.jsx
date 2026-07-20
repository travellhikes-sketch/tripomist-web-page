import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  User, 
  Mail, 
  Phone, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  ShoppingBag, 
  Calendar,
  X,
  MapPin
} from 'lucide-react';

const AdminUsers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*');
      if (pErr) throw pErr;

      // 2. Fetch bookings to aggregate
      const { data: bookings, error: bErr } = await supabase
        .from('bookings')
        .select('user_id, final_amount, total_amount, payment_status');
      if (bErr) throw bErr;

      // Aggregates bookings per user
      const customerMap = (profiles || []).map(profile => {
        const userBookings = (bookings || []).filter(b => b.user_id === profile.id);
        const totalBookings = userBookings.length;
        const totalSpend = userBookings
          .filter(b => b.payment_status?.toLowerCase() === 'paid')
          .reduce((sum, b) => sum + Number(b.final_amount || b.total_amount || 0), 0);

        return {
          ...profile,
          totalBookings,
          totalSpend
        };
      });

      // Sort by spend
      customerMap.sort((a, b) => b.totalSpend - a.totalSpend);
      setCustomers(customerMap);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (customer) => {
    setSelectedCustomer(customer);
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCustomerBookings(data || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">View customer profiles, booking history, and spending patterns.</p>
        </div>
        <button 
          onClick={fetchCustomers}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium"
        >
          <RefreshCw size={18} />
          Refresh List
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search customers by name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a] transition-all"
          />
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a]"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Customer Info</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Contact details</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Total Spend</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Bookings Count</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center border">
                        {customer.avatar_url ? (
                          <img src={customer.avatar_url} alt={customer.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{customer.full_name || 'Traveler'}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {customer.id.substring(0, 8)}</div>
                      </div>
                    </td>

                    <td className="py-3 px-6">
                      {customer.phone && (
                        <div className="text-xs text-gray-600 flex items-center gap-1.5 mb-0.5">
                          <Phone size={12} className="text-gray-400" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.email && (
                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Mail size={12} className="text-gray-400" />
                          {customer.email}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-6 font-bold text-emerald-700">
                      ₹{customer.totalSpend.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-6">
                      <span className="font-semibold text-gray-800 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                        {customer.totalBookings} reservation(s)
                      </span>
                    </td>

                    <td className="py-3 px-6 text-right">
                      <button 
                        onClick={() => handleViewHistory(customer)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-[#136b8a] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out History Panel / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/45" 
            onClick={() => setSelectedCustomer(null)}
          />
          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#136b8a] text-white">
              <div>
                <h3 className="text-lg font-bold">{selectedCustomer.full_name || 'Customer Profile'}</h3>
                <p className="text-xs text-teal-100 mt-1">Detailed Booking History</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Details Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-gray-900 text-sm border-b pb-1.5">Profile Info</h4>
                {selectedCustomer.phone && <div className="text-sm flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {selectedCustomer.phone}</div>}
                {selectedCustomer.email && <div className="text-sm flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {selectedCustomer.email}</div>}
                <div className="text-sm flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500" /> Total Spend: <span className="font-bold text-emerald-700">₹{selectedCustomer.totalSpend.toLocaleString('en-IN')}</span></div>
              </div>

              {/* Booking History Logs */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-sm">Reseveration Logs ({customerBookings.length})</h4>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#136b8a]"></div>
                  </div>
                ) : customerBookings.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    No bookings found for this customer.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerBookings.map((b) => (
                      <div key={b.id} className="border border-slate-100 rounded-xl p-4 hover:border-[#136b8a]/30 transition-all flex flex-col justify-between gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-gray-950 text-sm">{b.package_title}</h5>
                            <p className="text-[10px] text-gray-400 mt-0.5">Booking ID: {b.booking_id}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            b.booking_status?.toLowerCase() === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>{b.booking_status}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-slate-50">
                          <span>Travel Date: <strong className="text-gray-700">{b.travel_date}</strong></span>
                          <span className="font-black text-emerald-700">₹{(b.final_amount || b.total_amount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
