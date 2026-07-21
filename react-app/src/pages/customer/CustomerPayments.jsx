import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { CreditCard, Download, Receipt } from 'lucide-react';

const CustomerPayments = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_id, booking_reference, package_title, created_at, total_amount, amount_paid, pending_amount, payment_status')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setBookings(data);
      }
    }
    setLoading(false);
  };

  const totalValue = bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
  const totalPaid = bookings.reduce((sum, b) => sum + (Number(b.amount_paid) || Number(b.total_amount) || 0), 0);
  // Calculate pending dynamically if missing from db
  const totalPending = bookings.reduce((sum, b) => {
    const pending = b.pending_amount !== undefined ? Number(b.pending_amount) : (Number(b.total_amount) - (Number(b.amount_paid) || Number(b.total_amount)));
    return sum + Math.max(0, pending);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a]"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments & Receipts</h1>
        <p className="text-gray-500 mt-1">Track your booking payments and download invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Booking Value</p>
          <h3 className="text-3xl font-bold text-gray-900">₹{totalValue.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center">
          <p className="text-sm text-emerald-700 font-medium mb-1">Amount Paid</p>
          <h3 className="text-3xl font-bold text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-rose-50 p-5 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-center">
          <p className="text-sm text-rose-700 font-medium mb-1">Pending Amount</p>
          <h3 className="text-3xl font-bold text-rose-700">₹{totalPending.toLocaleString('en-IN')}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Receipt size={18} className="text-gray-400"/> Payment History</h2>
        </div>
        
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No payment history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-xs uppercase bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Package</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-700">{b.booking_id || b.booking_reference || b.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{b.package_title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${b.payment_status?.toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      ₹{(b.total_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {b.payment_status?.toLowerCase() !== 'paid' && (
                          <button disabled title="Online payments coming soon" className="bg-[#136b8a] text-white p-1.5 rounded opacity-50 cursor-not-allowed">
                            <CreditCard size={14}/>
                          </button>
                        )}
                        <button disabled title="Invoice generation coming soon" className="bg-gray-100 text-gray-600 border border-gray-200 p-1.5 rounded opacity-50 cursor-not-allowed">
                          <Download size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomerPayments;
