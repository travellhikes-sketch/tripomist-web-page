import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TBICP09xzQRaAw';

// Helper: parse price string like "₹19,999 per person" to number
function parsePriceString(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[₹,\s]/g, '').replace(/perperson/gi, '').trim();
  return parseInt(cleaned, 10) || 0;
}

const BookingModal = ({ isOpen, onClose, tripTitle, price, travellers, destination, packageId, costings }) => {
  // Step: 'form' | 'summary' | 'success' | 'failed'
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: null,
    source: ''
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingId, setBookingId] = useState('');
  const [selectedSharing, setSelectedSharing] = useState('');
  const [computedPrice, setComputedPrice] = useState(price);
  const [paymentId, setPaymentId] = useState('');

  // Build sharing options from costings prop
  const sharingOptions = React.useMemo(() => {
    if (!costings || !Array.isArray(costings) || costings.length === 0) {
      // Default sharing options based on base price
      return [
        { type: 'Quad Sharing', pricePerPerson: Math.round((price || 0) / (travellers || 1) * 0.85), label: 'Quad Sharing' },
        { type: 'Triple Sharing', pricePerPerson: Math.round((price || 0) / (travellers || 1) * 0.93), label: 'Triple Sharing' },
        { type: 'Double Sharing', pricePerPerson: Math.round((price || 0) / (travellers || 1)), label: 'Double Sharing' },
      ];
    }
    return costings.map(c => ({
      type: c.type,
      pricePerPerson: parsePriceString(c.price),
      label: c.type
    }));
  }, [costings, price, travellers]);

  // Calendar logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
      setFormData({ ...formData, date: d });
      setIsCalendarOpen(false);
    }
  };

  // Step 1: Validate and go to summary
  const handleContinue = (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.date) return alert('Please select a travel date');
    if (formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
      return alert('Please enter a valid 10-digit phone number');
    }
    if (!formData.fullName || !formData.email) {
      return alert('Please fill in all required fields.');
    }
    // Default to first sharing option
    if (sharingOptions.length > 0 && !selectedSharing) {
      const first = sharingOptions[0];
      setSelectedSharing(first.type);
      setComputedPrice(first.pricePerPerson * (travellers || 1));
    }
    setStep('summary');
  };

  // Sharing selection handler
  const handleSharingSelect = (option) => {
    setSelectedSharing(option.type);
    setComputedPrice(option.pricePerPerson * (travellers || 1));
  };

  // Step 2: Proceed to Razorpay payment
  const handleProceedToPayment = () => {
    if (!selectedSharing) {
      return alert('Please select a sharing option');
    }
    setLoading(true);
    setError(null);

    const amountInPaise = Math.round(computedPrice * 100);

    const options = {
      key: RAZORPAY_KEY,
      amount: amountInPaise,
      currency: 'INR',
      name: 'TripoMist',
      description: `${tripTitle} - ${selectedSharing}`,
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: `+91${formData.phone}`
      },
      theme: {
        color: '#136b8a'
      },
      handler: async function (response) {
        // Payment successful — save booking
        try {
          const { data, error: insertError } = await supabase
            .from('bookings')
            .insert([
              {
                customer_name: formData.fullName,
                phone: formData.phone,
                email: formData.email || null,
                source: formData.source || null,
                package_id: packageId || null,
                package_title: tripTitle,
                destination: destination || null,
                travel_date: formData.date.toISOString().split('T')[0],
                travellers: travellers,
                total_amount: price,
                selected_sharing: selectedSharing,
                final_amount: computedPrice,
                razorpay_payment_id: response.razorpay_payment_id,
                payment_status: 'paid',
                booking_status: 'confirmed'
              }
            ])
            .select('booking_id')
            .single();
          if (insertError) throw insertError;
          setBookingId(data.booking_id);
          setPaymentId(response.razorpay_payment_id);
          setStep('success');
          // Clear cart
          localStorage.removeItem('cart');
          window.dispatchEvent(new Event('cartUpdated'));
        } catch (err) {
          console.error('Booking save error:', err);
          setError('Payment was successful but booking save failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          setStep('failed');
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          // User closed Razorpay — do NOT create booking
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setLoading(false);
        setError('Payment failed: ' + (response.error?.description || 'Unknown error'));
        setStep('failed');
      });
      rzp.open();
    } catch (err) {
      setLoading(false);
      setError('Could not open payment gateway. Please try again.');
    }
  };

  // Reset modal state
  const resetAndClose = () => {
    setStep('form');
    setFormData({ fullName: '', email: '', phone: '', date: null, source: '' });
    setSelectedSharing('');
    setComputedPrice(price);
    setError(null);
    setLoading(false);
    setBookingId('');
    setPaymentId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
        <button onClick={resetAndClose} disabled={loading} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50">
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* ========== SUCCESS STEP ========== */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-2">Thank you, {formData.fullName}. Your payment was successful.</p>
            <p className="text-gray-800 font-bold text-lg mb-2">Booking ID: {bookingId}</p>
            <p className="text-sm text-gray-500 mb-1">Payment ID: {paymentId}</p>
            <p className="text-sm text-gray-500 mb-1">{selectedSharing} · ₹{computedPrice?.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mb-6">We'll send confirmation details to your email & WhatsApp shortly.</p>
            <button onClick={resetAndClose} className="w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98]">
              Done
            </button>
          </div>
        )}

        {/* ========== FAILED STEP ========== */}
        {step === 'failed' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">{error || 'Your payment could not be processed. No booking has been created.'}</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => { setStep('summary'); setError(null); }} className="flex-1 bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-[0.98]">
                Retry
              </button>
              <button onClick={resetAndClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all active:scale-[0.98]">
                Close
              </button>
            </div>
          </div>
        )}

        {/* ========== FORM STEP ========== */}
        {step === 'form' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Your Trip</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleContinue} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone No (WhatsApp)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 font-semibold">+91</span>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} maxLength={10} className="w-full border border-gray-200 rounded-r-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700" placeholder="9999999999" />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Select Travel Date</label>
                <div onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 flex justify-between items-center bg-white text-gray-700 hover:border-[#136b8a] cursor-pointer transition-colors">
                  <span>{formData.date ? formData.date.toLocaleDateString() : "Select Date"}</span>
                  <span className="material-symbols-outlined text-gray-400">calendar_month</span>
                </div>
                {isCalendarOpen && (
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
                          <button key={idx} type="button" disabled={isPast || !isFriday} onClick={() => handleDateSelect(d)} className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${isPast ? 'text-gray-300 cursor-not-allowed' : !isFriday ? 'text-gray-400 cursor-not-allowed' : isSelected ? 'bg-[#136b8a] text-white font-bold' : 'bg-blue-100 text-[#136b8a] hover:bg-blue-200 font-semibold cursor-pointer'}`}> {d.getDate()} </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Where did you hear about us?</label>
                <select required value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#136b8a] outline-none bg-white text-gray-700">
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
              <button type="submit" className="w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2">
                Continue
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </form>
          </>
        )}

        {/* ========== SUMMARY STEP ========== */}
        {step === 'summary' && (
          <>
            <button onClick={() => setStep('form')} className="flex items-center gap-1 text-[#136b8a] hover:text-[#0f556e] font-semibold text-sm mb-4 transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Booking Summary</h2>

            {/* Trip Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600 text-sm">Package</span>
                <span className="font-semibold text-gray-900 text-right text-sm max-w-[200px] truncate">{tripTitle}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600 text-sm">Travellers</span>
                <span className="font-semibold text-gray-900">{travellers}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600 text-sm">Travel Date</span>
                <span className="font-semibold text-gray-900">{formData.date?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Traveller</span>
                <span className="font-semibold text-gray-900">{formData.fullName}</span>
              </div>
            </div>

            {/* Sharing Selection */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-800 mb-3">Select Package Sharing</label>
              <div className="flex flex-col gap-2">
                {sharingOptions.map((option) => {
                  const isActive = selectedSharing === option.type;
                  const totalForOption = option.pricePerPerson * (travellers || 1);
                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => handleSharingSelect(option)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                        isActive
                          ? 'border-[#136b8a] bg-[#eff6f9] shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'border-[#136b8a]' : 'border-gray-300'
                        }`}>
                          {isActive && <div className="w-2.5 h-2.5 rounded-full bg-[#136b8a]"></div>}
                        </div>
                        <span className={`font-semibold ${isActive ? 'text-[#136b8a]' : 'text-gray-700'}`}>
                          {option.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-base ${isActive ? 'text-[#136b8a]' : 'text-gray-800'}`}>
                          ₹{option.pricePerPerson.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 block">/person</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-[#eff6f9] rounded-xl p-4 mb-5 border border-[#cde5ef]">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-800 font-bold block">Total Payable</span>
                  <span className="text-xs text-gray-500">{travellers} traveller{travellers > 1 ? 's' : ''} × ₹{(computedPrice / (travellers || 1)).toLocaleString()}</span>
                </div>
                <span className="font-extrabold text-[#136b8a] text-2xl">₹{computedPrice?.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Proceed to Payment */}
            <button
              onClick={handleProceedToPayment}
              disabled={loading || !selectedSharing}
              className="w-full bg-[#136b8a] hover:bg-[#0f556e] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Opening Payment...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                  Proceed to Payment · ₹{computedPrice?.toLocaleString()}
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">Secured by Razorpay. 100% safe.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
