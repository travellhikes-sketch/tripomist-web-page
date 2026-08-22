import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  User, Mail, Phone, Search, RefreshCw, TrendingUp, ShoppingBag, Calendar, X, MapPin
} from 'lucide-react';
import AdminBookingModal from '../../components/admin/AdminBookingModal';

const AdminUsers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editBookingId, setEditBookingId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const [profilesRes, bookingsRes, travellersRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('booking_travellers').select('*')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (travellersRes.error) throw travellersRes.error;

      const profiles = profilesRes.data || [];
      const bookings = bookingsRes.data || [];
      const travellers = travellersRes.data || [];

      const normalizePhone = (p) => p ? p.replace(/[\s\-\(\)]/g, '') : null;
      const normalizeEmail = (e) => e ? e.toLowerCase().trim() : null;

      const customerGroups = [];

      const findCustomerGroup = (userId, email, phone) => {
        const normEmail = normalizeEmail(email);
        const normPhone = normalizePhone(phone);

        return customerGroups.find(g =>
          (userId && g.user_id === userId) ||
          (normPhone && g.normPhone === normPhone) ||
          (normEmail && g.normEmail === normEmail)
        );
      };

      bookings.forEach(booking => {
        let bUserId = booking.user_id;
        let bEmail = booking.customer_email;
        let bPhone = booking.customer_phone;
        let bName = booking.customer_name;

        // Try to get primary traveller
        const bTravellers = travellers.filter(t => t.booking_id === booking.id);
        const primary = bTravellers.find(t => t.is_primary) || bTravellers[0];
        if (primary) {
          if (primary.email) bEmail = primary.email;
          if (primary.phone) bPhone = primary.phone;
          if (primary.full_name) bName = primary.full_name;
        }

        if (!bUserId && !bEmail && !bPhone && !bName) return; // Ignore completely blank bookings

        let group = findCustomerGroup(bUserId, bEmail, bPhone);
        if (!group) {
          group = {
            id: bUserId || crypto.randomUUID(), // unique internal id
            user_id: bUserId,
            normPhone: normalizePhone(bPhone),
            normEmail: normalizeEmail(bEmail),
            full_name: bName || 'Unknown Customer',
            phone: bPhone,
            email: bEmail,
            bookings: [],
            isProfile: false,
          };
          customerGroups.push(group);
        } else {
          // Update missing info if this booking has it better
          if (!group.full_name || group.full_name === 'Unknown Customer') group.full_name = bName;
          if (!group.phone) { group.phone = bPhone; group.normPhone = normalizePhone(bPhone); }
          if (!group.email) { group.email = bEmail; group.normEmail = normalizeEmail(bEmail); }
          if (!group.user_id && bUserId) group.user_id = bUserId;
        }

        group.bookings.push(booking);
      });

      // Merge profiles without bookings
      profiles.forEach(p => {
        let group = findCustomerGroup(p.id, p.email, p.phone);
        if (!group) {
          group = {
            id: p.id,
            user_id: p.id,
            normPhone: normalizePhone(p.phone),
            normEmail: normalizeEmail(p.email),
            full_name: p.full_name || 'Unknown User',
            phone: p.phone,
            email: p.email,
            avatar_url: p.avatar_url,
            bookings: [],
            isProfile: true
          };
          customerGroups.push(group);
        } else {
          group.isProfile = true;
          group.user_id = p.id;
          group.avatar_url = p.avatar_url;
          if (!group.full_name || group.full_name === 'Unknown Customer') group.full_name = p.full_name;
        }
      });

      // Calculate totals
      const finalCustomers = customerGroups.map(g => {
        const totalBookings = g.bookings.length;
        const totalSpend = g.bookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
        const totalPaid = g.bookings.reduce((sum, b) => sum + Number(b.advance_payment || b.paid_amount || 0), 0);
        const pendingAmount = totalSpend - totalPaid;

        const completedTrips = g.bookings.filter(b => b.booking_status?.toLowerCase() === 'completed').length;
        const upcomingTrips = g.bookings.filter(b => ['confirmed', 'upcoming'].includes(b.booking_status?.toLowerCase()) && new Date(b.travel_date) >= new Date()).length;
        const cancelledTrips = g.bookings.filter(b => b.booking_status?.toLowerCase() === 'cancelled').length;

        const dates = g.bookings.map(b => new Date(b.created_at || b.travel_date)).filter(d => !isNaN(d));
        const lastBookingDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

        let types = [];
        if (totalBookings === 1) types.push('New');
        else if (totalBookings > 1) types.push('Repeat');

        if (g.isProfile || g.user_id) types.push('Registered');
        else types.push('Guest');

        return {
          ...g,
          totalBookings,
          totalSpend,
          totalPaid,
          pendingAmount,
          completedTrips,
          upcomingTrips,
          cancelledTrips,
          lastBookingDate,
          customerType: types.join(' • ')
        };
      });

      finalCustomers.sort((a, b) => b.totalSpend - a.totalSpend);
      setCustomers(finalCustomers);
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
      // customer.bookings already has all their bookings. Just sort them.
      const sorted = [...customer.bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setCustomerBookings(sorted);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">View customer profiles, booking history, and spending patterns.</p>
        </div>
        <button
          onClick={fetchCustomers}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh List
        </button>
      </div>

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
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Customer Info</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Type</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Total Spend</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Bookings Count</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center border shrink-0">
                        {customer.avatar_url ? (
                          <img src={customer.avatar_url} alt={customer.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{customer.full_name}</div>
                        <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-0.5">
                          {customer.phone && <span>{customer.phone}</span>}
                          {customer.email && <span>{customer.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded w-max">
                        {customer.customerType}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-bold text-emerald-700">₹{customer.totalSpend.toLocaleString('en-IN')}</div>
                      {customer.pendingAmount > 0 && (
                        <div className="text-[10px] text-amber-600 font-bold uppercase mt-0.5">Pending: ₹{customer.pendingAmount.toLocaleString('en-IN')}</div>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-semibold text-gray-800 text-sm">{customer.totalBookings} Total</div>
                      <div className="text-[10px] text-gray-500 uppercase flex gap-2 mt-1">
                        <span title="Completed" className="text-emerald-600">{customer.completedTrips}C</span>
                        <span title="Upcoming" className="text-blue-600">{customer.upcomingTrips}U</span>
                        <span title="Cancelled" className="text-rose-600">{customer.cancelledTrips}X</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => handleViewHistory(customer)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-[#136b8a] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-[80] overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-lg bg-slate-50 h-full shadow-2xl flex flex-col z-50 animate-slide-in">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#136b8a] text-white">
              <div>
                <h3 className="text-lg font-bold">{selectedCustomer.full_name || 'Customer Profile'}</h3>
                <p className="text-xs text-teal-100 mt-1">{selectedCustomer.customerType}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Phone</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedCustomer.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Email</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedCustomer.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Bookings</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedCustomer.totalBookings}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Spend</div>
                    <div className="text-sm font-bold text-emerald-700">₹{selectedCustomer.totalSpend.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-900 text-sm">Booking History</h4>
                </div>

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
                      <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-bold text-gray-950 text-sm">{b.package_title}</h5>
                            <p className="text-[10px] text-gray-500  mt-0.5">Ref: {b.booking_reference || b.booking_id || b.id.substring(0,8)}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            b.booking_status?.toLowerCase() === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                          }`}>{b.booking_status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div><span className="text-gray-400">Date:</span> {b.travel_date ? new Date(b.travel_date).toLocaleDateString() : '-'}</div>
                          <div><span className="text-gray-400">Total:</span> ₹{(b.total_amount || 0).toLocaleString()}</div>
                          <div><span className="text-gray-400">Paid:</span> ₹{(b.advance_payment || b.paid_amount || 0).toLocaleString()}</div>
                          <div><span className="text-gray-400">Due:</span> <span className="text-amber-600 font-bold">₹{((b.total_amount || 0) - (b.advance_payment || b.paid_amount || 0)).toLocaleString()}</span></div>
                        </div>
                        <button
                          onClick={() => setEditBookingId(b.id)}
                          className="w-full text-center text-xs font-bold text-[#136b8a] bg-[#136b8a]/10 hover:bg-[#136b8a]/20 py-2 rounded-lg transition-colors"
                        >
                          Open Booking
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AdminBookingModal for Open Booking */}
      <AdminBookingModal
        isOpen={!!editBookingId}
        onClose={() => setEditBookingId(null)}
        onSuccess={() => {
          setEditBookingId(null);
          fetchCustomers(); // Refresh the list after editing
        }}
        bookingId={editBookingId}
      />
    </div>
  );
};

export default AdminUsers;
