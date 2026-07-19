import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const BookingModal = ({ isOpen, onClose, tripTitle, price, travellers, navigate, destination, packageId }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: null,
    source: '',
    specialRequest: ''
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  if (!isOpen) {
    if (success) {
      setSuccess(false); // Reset when closed
      setFormData({ fullName: '', email: '', phone: '', date: null, source: '', specialRequest: '' });
    }
    return null;
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (prev > new Date(today.getFullYear(), today.getMonth(), 1) || (prev.getMonth() === today.getMonth() && prev.getFullYear() === today.getFullYear())) {
      setCurrentMonth(prev);
    }
  };

  const handleDateSelect = (d) => {
    if (d >= today) {
      setFormData({...formData, date: d});
      setIsCalendarOpen(false); // Close calendar on select
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); if (loading) return;
    setError(null);

    if (!formData.date) return alert("Please select a date");
    if (formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
      return alert("Please enter a valid 10-digit phone number");
    }

    setLoading(true);

    try {
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert([{
          customer_name: formData.fullName,
          phone: formData.phone,
          email: formData.email || null,
          source: formData.source || null,
          package_id: packageId || null,
          package_title: tripTitle,
          destination: destination || null,
          travel_date: formData.date.toISOString().split('T')[0],
          travellers: travellers,
          special_request: formData.specialRequest || null,
          total_amount: price
        }])
        .select('id, booking_id')
        .single();

      if (insertError) throw insertError;

      setBookingId(data.booking_id);
      setSuccess(true);
      // Auto‑close after 2 seconds, reset form and success flag
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          date: null,
          source: '',
          specialRequest: ''
        });
      }, 2000);
      
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || "Failed to submit booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} disabled={loading} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50">
          <span className="material-symbols-outlined">close</span>
        </button>
        
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-2">Thank you, {formData.fullName}. Your booking enquiry has been received.</p>
            <p className="text-gray-800 font-bold text-lg mb-6">Booking ID: {bookingId}</p>
            <p className="text-sm text-gray-500 mb-6">Our team will contact you shortly regarding the payment and further details.</p>
            <button 
              onClick={onClose}
              className="w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Your Trip</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input required type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} disabled={loading} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 disabled:bg-gray-50" placeholder="John Doe" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={loading} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 disabled:bg-gray-50" placeholder="john@example.com" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone No (WhatsApp)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 font-semibold">+91</span>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={loading} maxLength={10} className="w-full border border-gray-200 rounded-r-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 disabled:bg-gray-50" placeholder="9999999999" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Select Date</label>
                <div 
                  onClick={() => !loading && setIsCalendarOpen(!isCalendarOpen)}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 flex justify-between items-center transition-colors ${loading ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:border-[#136b8a] cursor-pointer'}`}
                >
                  <span>{formData.date ? formData.date.toLocaleDateString() : "Select Date"}</span>
                  <span className="material-symbols-outlined text-gray-400">calendar_month</span>
                </div>

                {isCalendarOpen && !loading && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 border border-gray-200 rounded-xl p-3 bg-white shadow-xl">
                    <div className="flex justify-between items-center mb-2">
                      <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded-full"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                      <span className="font-bold text-sm text-gray-700">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                      <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded-full"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-1">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                      {days.map((d, idx) => {
                        if (!d) return <div key={idx} className="p-1"></div>;
                        const isPast = d < today;
                        const isFriday = d.getDay() === 5;
                        const isSelected = formData.date && d.getTime() === formData.date.getTime();
                        return (
                          <button 
                            key={idx}
                            type="button"
                            disabled={isPast || !isFriday}
                            onClick={() => handleDateSelect(d)}
                            className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${isPast ? 'text-gray-300 cursor-not-allowed' : !isFriday ? 'text-gray-400 cursor-not-allowed' : isSelected ? 'bg-[#136b8a] text-white font-bold' : 'bg-blue-100 text-[#136b8a] hover:bg-blue-200 font-semibold cursor-pointer'}`}
                          >
                            {d.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Where did you hear about us?</label>
                <select required value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})} disabled={loading} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none bg-white text-gray-700 disabled:bg-gray-50">
                  <option value="" className="text-gray-400">Select source</option>
                  <option value="Facebook" className="text-gray-700">Facebook</option>
                  <option value="Instagram" className="text-gray-700">Instagram</option>
                  <option value="WhatsApp" className="text-gray-700">WhatsApp</option>
                  <option value="Google" className="text-gray-700">Google</option>
                  <option value="Friend and Family" className="text-gray-700">Friend and Family</option>
                  <option value="I'm already travel with you" className="text-gray-700">I'm already travel with you</option>
                  <option value="Other" className="text-gray-700">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Special Request (Optional)</label>
                <textarea 
                  value={formData.specialRequest} 
                  onChange={(e) => setFormData({...formData, specialRequest: e.target.value})} 
                  disabled={loading}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 disabled:bg-gray-50 resize-none" 
                  placeholder="Any specific requirements..."
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 text-sm">Package</span>
                  <span className="font-semibold text-gray-900">{tripTitle}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 text-sm">Travellers</span>
                  <span className="font-semibold text-gray-900">{travellers}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                  <span className="text-gray-800 font-bold">Total Amount</span>
                  <span className="font-bold text-[#136b8a] text-lg">₹{price?.toLocaleString()}</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#136b8a] hover:bg-[#0f556e] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] mt-2 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Confirm Booking Enquiry'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default BookingModal;
