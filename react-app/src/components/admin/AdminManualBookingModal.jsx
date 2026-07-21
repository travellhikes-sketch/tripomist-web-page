import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { X, Check } from 'lucide-react';

const AdminManualBookingModal = ({ isOpen, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [packages, setPackages] = useState([]);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    package_title: '',
    travel_date: '',
    travellers: 1,
    selected_sharing: 'double',
    pickup_point: '',
    reporting_time: '',
    source: 'offline', // WhatsApp, Phone Call, Offline, Website, Referral, Other
    total_amount: 0,
    amount_paid: 0,
    payment_status: 'pending', // Pending, Partial, Paid
    booking_status: 'confirmed', // Pending, Confirmed, Cancelled
    emergency_contact: '',
    special_request: '',
    admin_notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadPackages();
      // Reset form
      setFormData({
        customer_name: '',
        phone: '',
        email: '',
        package_title: '',
        travel_date: '',
        travellers: 1,
        selected_sharing: 'double',
        pickup_point: '',
        reporting_time: '',
        source: 'offline',
        total_amount: 0,
        amount_paid: 0,
        payment_status: 'pending',
        booking_status: 'confirmed',
        emergency_contact: '',
        special_request: '',
        admin_notes: ''
      });
    }
  }, [isOpen]);

  const loadPackages = async () => {
    const { data } = await supabase.from('packages').select('id, title, price, is_active').eq('is_active', true);
    if (data) setPackages(data);
  };

  const handlePackageChange = (e) => {
    const title = e.target.value;
    const pkg = packages.find(p => p.title === title);
    if (pkg) {
      const numericPrice = typeof pkg.price === 'string' ? parseInt(pkg.price.replace(/\D/g, ''), 10) : Number(pkg.price);
      const estTotal = (numericPrice || 0) * formData.travellers;
      setFormData(prev => ({
        ...prev,
        package_title: title,
        total_amount: estTotal,
      }));
    } else {
      setFormData(prev => ({ ...prev, package_title: title }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const generatedBookingId = `MNL${Date.now().toString().slice(-6)}`;
      const pendingAmount = formData.total_amount - formData.amount_paid;
      
      const newBooking = {
        booking_id: generatedBookingId, // use booking_id since we saw it used previously
        booking_reference: generatedBookingId, // Some systems use booking_reference
        customer_name: formData.customer_name,
        phone: formData.phone,
        email: formData.email || null,
        package_title: formData.package_title,
        travel_date: formData.travel_date,
        travellers: formData.travellers,
        selected_sharing: formData.selected_sharing,
        total_amount: formData.total_amount,
        final_amount: formData.total_amount, // for compatibility
        amount_paid: formData.amount_paid,
        pending_amount: pendingAmount,
        payment_status: formData.payment_status,
        booking_status: formData.booking_status,
        source: formData.source,
        pickup_point: formData.pickup_point || null,
        reporting_time: formData.reporting_time || null,
        emergency_contact: formData.emergency_contact || null,
        special_request: formData.special_request || null,
        admin_notes: formData.admin_notes || null,
        created_at: new Date().toISOString()
      };
      
      // Attempt insert. Missing columns might be ignored or throw an error depending on Supabase client setup.
      // Usually, unknown columns are stripped out by the Postgrest client if they don't match the schema, or throw an error.
      // To be safe, we just push the whole payload. If it fails, the user will be prompted to run the SQL migration.
      const { error } = await supabase.from('bookings').insert([newBooking]);
      if (error) {
        console.error('Insert error:', error);
        throw new Error(error.message || 'Database error');
      }
      
      alert('Manual booking added successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(`Error creating manual booking: ${err.message}. Ensure missing columns (like admin_notes, pickup_point) are added via SQL migration.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const pendingAmount = Math.max(0, formData.total_amount - formData.amount_paid);

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in text-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-gray-900 text-lg">New Manual Booking</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 bg-gray-200 hover:bg-gray-300 rounded-full p-1"><X size={16}/></button>
        </div>
        
        <div className="p-5 overflow-auto flex-1">
          <form id="manualBookingForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer Details */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 uppercase text-[11px] tracking-wider">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <input required type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.customer_name} onChange={e=>setFormData({...formData, customer_name: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input required type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input type="email" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})}/>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 uppercase text-[11px] tracking-wider">Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Package Title *</label>
                  <input required type="text" list="packagesList" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.package_title} onChange={handlePackageChange}/>
                  <datalist id="packagesList">
                    {packages.map(p => <option key={p.id} value={p.title} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Booking Source</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.source} onChange={e=>setFormData({...formData, source: e.target.value})}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone_call">Phone Call</option>
                    <option value="offline">Offline</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Travel Date *</label>
                  <input required type="date" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.travel_date} onChange={e=>setFormData({...formData, travel_date: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Travellers *</label>
                  <input required type="number" min="1" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.travellers} onChange={e=>setFormData({...formData, travellers: parseInt(e.target.value, 10) || 1})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sharing Type</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.selected_sharing} onChange={e=>setFormData({...formData, selected_sharing: e.target.value})}>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                    <option value="quad">Quad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pickup Point</label>
                  <input type="text" placeholder="e.g. Kashmiri Gate" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.pickup_point} onChange={e=>setFormData({...formData, pickup_point: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Reporting Time</label>
                  <input type="time" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.reporting_time} onChange={e=>setFormData({...formData, reporting_time: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Booking Status</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.booking_status} onChange={e=>setFormData({...formData, booking_status: e.target.value})}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 uppercase text-[11px] tracking-wider">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Amount (₹) *</label>
                  <input required type="number" min="0" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.total_amount} onChange={e=>setFormData({...formData, total_amount: Number(e.target.value)})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Amount Paid (₹)</label>
                  <input required type="number" min="0" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.amount_paid} onChange={e=>setFormData({...formData, amount_paid: Number(e.target.value)})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pending Amount (₹)</label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md font-mono text-gray-600 cursor-not-allowed">
                    {pendingAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Payment Status</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.payment_status} onChange={e=>setFormData({...formData, payment_status: e.target.value})}>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 uppercase text-[11px] tracking-wider">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Emergency Contact</label>
                  <input type="text" placeholder="Name & Phone" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.emergency_contact} onChange={e=>setFormData({...formData, emergency_contact: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Special Request (Visible to customer)</label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.special_request} onChange={e=>setFormData({...formData, special_request: e.target.value})}/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Internal Admin Notes (Hidden from customer)</label>
                  <textarea rows="2" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-[#136b8a] outline-none" value={formData.admin_notes} onChange={e=>setFormData({...formData, admin_notes: e.target.value})}></textarea>
                </div>
              </div>
            </div>
            
          </form>
        </div>
        
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-200 rounded-md transition-colors text-sm">Cancel</button>
          <button type="submit" form="manualBookingForm" disabled={submitting} className="px-6 py-2 font-bold text-white bg-[#136b8a] hover:bg-[#0f556e] rounded-md transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
            {submitting ? 'Saving...' : <><Check size={16}/> Create Booking</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminManualBookingModal;
