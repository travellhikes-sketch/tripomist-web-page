import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const BookingModal = ({ isOpen, onClose, tripTitle, price, travellers, destination, packageId, costings, navigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: null,
    source: ''
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

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

  // Save or update checkout lead in Supabase
  const saveCheckoutLead = async () => {
    const parsedPackageId = parseInt(packageId);
    const leadPayload = {
      customer_name: formData.fullName,
      phone: formData.phone,
      email: formData.email || null,
      package_id: isNaN(parsedPackageId) ? null : parsedPackageId,
      package_title: tripTitle || null,
      destination: destination || tripTitle || null,
      travel_date: formData.date ? formData.date.toISOString().split('T')[0] : null,
      travellers: travellers || 1,
      estimated_amount: price || 0,
      source: formData.source || null,
      current_step: 'popup_submitted',
      lead_status: 'checkout_started',
      payment_status: 'not_started',
    };

    // Check for existing lead for the same checkout session
    const existingLeadStr = sessionStorage.getItem('tripomist_checkout_lead');
    if (existingLeadStr) {
      try {
        const existingLead = JSON.parse(existingLeadStr);
        // If we have a valid existing lead for the same package, update it via RPC
        if (existingLead.id && existingLead.lead_token) {
          const { error: rpcError } = await supabase.rpc('update_checkout_lead', {
            p_lead_id: existingLead.id,
            p_lead_token: existingLead.lead_token,
            p_current_step: 'popup_submitted',
          });
          if (!rpcError) {
            // Update succeeded — reuse existing lead
            return existingLead;
          }
          // If RPC failed (e.g., lead was deleted), fall through to create new one
        }
      } catch (e) {
        // Corrupted sessionStorage data, fall through to create new
      }
    }

    // Insert new lead
    const { data, error: insertError } = await supabase
      .from('checkout_leads')
      .insert([leadPayload])
      .select('id, lead_token')
      .single();

    if (insertError) {
      throw new Error(insertError.message || 'Failed to save your enquiry. Please try again.');
    }

    return { id: data.id, lead_token: data.lead_token };
  };

  // Step 1: Validate and go to checkout
  const handleContinue = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.date) {
      setError('Please select a travel date');
      return;
    }
    if (formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!formData.fullName || !formData.email) {
      setError('Please fill in all required fields.');
      return;
    }

    // Prevent double-click
    if (saving) return;
    setSaving(true);

    try {
      // Save checkout lead to Supabase
      const leadRef = await saveCheckoutLead();
      
      // Store lead reference securely in sessionStorage
      sessionStorage.setItem('tripomist_checkout_lead', JSON.stringify(leadRef));

      // Save checkout data to sessionStorage (existing flow)
      const checkoutData = {
        formData: {
          ...formData,
          date: formData.date.toISOString(),
        },
        tripDetails: {
          tripTitle,
          price,
          travellers,
          destination,
          packageId,
          costings,
        }
      };
      
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      
      const slug = packageId || 'custom-package';
      
      // Close modal
      resetAndClose();
      
      // Navigate to full-page checkout
      if (navigate) {
        navigate(`/checkout/${slug}`);
      } else {
        window.location.href = `/checkout/${slug}`;
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetAndClose = () => {
    setFormData({ fullName: '', email: '', phone: '', date: null, source: '' });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
        <button onClick={resetAndClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>

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
          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-[#136b8a] hover:bg-[#0f556e] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving...
              </>
            ) : (
              <>
                Continue
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-1 leading-snug">
            By continuing, you agree that TripoMist may contact you regarding this trip enquiry.
          </p>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
