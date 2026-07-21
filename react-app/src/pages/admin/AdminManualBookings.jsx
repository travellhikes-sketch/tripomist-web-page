import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Edit, Trash2, Search, Filter, Download, X, AlertCircle } from 'lucide-react';
import AdminBookingModal from '../../components/admin/AdminBookingModal';

const AdminManualBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest

  const initialFormState = {
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    package_id: '',
    package_title: '',
    travel_date: '',
    travellers_count: 1,
    sharing_type: 'Double Sharing',
    total_amount: 0,
    advance_payment: 0,
    remaining_payment: 0,
    payment_status: 'unpaid',
    booking_status: 'pending',
    payment_method: '',
    notes: '',
    booking_source: 'manual'
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchPackages();
    fetchBookings();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase.from('Pakage').select('id, name, price');
      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      console.error("Error fetching packages:", err);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase.from('bookings').select('*');

      if (statusFilter) query = query.eq('booking_status', statusFilter);
      if (paymentFilter) query = query.eq('payment_status', paymentFilter);
      if (dateFilter) query = query.eq('travel_date', dateFilter);

      if (sortOrder === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let filteredData = data || [];
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filteredData = filteredData.filter(b => 
          (b.booking_reference && b.booking_reference.toLowerCase().includes(lowerSearch)) ||
          (b.customer_name && b.customer_name.toLowerCase().includes(lowerSearch)) ||
          (b.customer_email && b.customer_email.toLowerCase().includes(lowerSearch)) ||
          (b.package_title && b.package_title.toLowerCase().includes(lowerSearch))
        );
      }
      
      setBookings(filteredData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [searchTerm, dateFilter, statusFilter, paymentFilter, sortOrder]);

  // Handle calculation logic
  useEffect(() => {
    const total = parseFloat(formData.total_amount) || 0;
    let advance = parseFloat(formData.advance_payment) || 0;
    
    // Validations on change
    if (advance < 0) advance = 0;
    if (advance > total) advance = total;

    const remaining = total - advance;

    let payStatus = 'unpaid';
    if (advance === 0) payStatus = 'unpaid';
    else if (advance > 0 && remaining > 0) payStatus = 'partially_paid';
    else if (remaining === 0 && total > 0) payStatus = 'paid';

    setFormData(prev => {
      // only update if changed to avoid loop
      if (prev.advance_payment === advance && prev.remaining_payment === remaining && prev.payment_status === payStatus) {
        return prev;
      }
      return {
        ...prev,
        advance_payment: advance,
        remaining_payment: remaining,
        payment_status: payStatus
      };
    });
  }, [formData.total_amount, formData.advance_payment]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'package_id') {
      const selectedPkg = packages.find(p => p.id === value);
      setFormData(prev => ({
        ...prev,
        package_id: value,
        package_title: selectedPkg ? selectedPkg.name : '',
        total_amount: selectedPkg && !prev.total_amount ? selectedPkg.price : prev.total_amount
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openModal = (booking = null) => {
    setError(null);
    if (booking) {
      setCurrentBooking(booking);
      setFormData(booking);
    } else {
      setCurrentBooking(null);
      setFormData({
        ...initialFormState, 
        booking_reference: `MB-${Date.now().toString().slice(-6)}`
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentBooking(null);
  };

  // Handle save logic moved to AdminBookingModal


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      fetchBookings();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  const exportToCSV = () => {
    const headers = ['Reference', 'Source', 'Customer', 'Email', 'Phone', 'Package', 'Travel Date', 'Travellers', 'Total', 'Advance', 'Remaining', 'Payment Status', 'Booking Status'];
    const rows = bookings.map(b => [
      b.booking_reference, b.booking_source, b.customer_name, b.customer_email, b.customer_phone,
      b.package_title, b.travel_date, b.travellers_count, b.total_amount, b.advance_payment, b.remaining_payment,
      b.payment_status, b.booking_status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.map(item => `"${String(item || '').replace(/"/g, '""')}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    enquiry: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800'
  };

  const paymentColors = {
    unpaid: 'bg-red-100 text-red-800',
    partially_paid: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800'
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual Bookings</h1>
          <p className="text-gray-500 mt-1">Manage offline bookings and custom package reservations.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">
            <Download size={16} /> Export
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-[#136b8a] text-white px-4 py-2 rounded-xl hover:bg-[#0f556e] transition-colors font-medium text-sm">
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative col-span-1 md:col-span-2">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, ref or package..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
        </div>
        <div>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" title="Filter by Travel Date" />
        </div>
        <div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none">
            <option value="">All Statuses</option>
            <option value="enquiry">Enquiry</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none">
            <option value="">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No bookings found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Reference</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Package & Date</th>
                  <th className="px-6 py-4 font-semibold">Payment</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{booking.booking_reference}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{new Date(booking.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{booking.customer_name}</div>
                      <div className="text-xs">{booking.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 line-clamp-1">{booking.package_title}</div>
                      <div className="text-xs text-gray-500">{booking.travel_date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">₹{booking.total_amount}</div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${paymentColors[booking.payment_status] || 'bg-gray-100'}`}>
                        {booking.payment_status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.booking_status] || 'bg-gray-100'}`}>
                        {booking.booking_status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openModal(booking)} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 hover:bg-blue-100 rounded inline-block"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(booking.id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 hover:bg-red-100 rounded inline-block"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminBookingModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={fetchBookings}
        bookingId={currentBooking ? currentBooking.id : null}
      />
    </div>
  );
};

export default AdminManualBookings;
