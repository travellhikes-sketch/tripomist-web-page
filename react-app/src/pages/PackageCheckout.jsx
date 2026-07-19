import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TBICP09xzQRaAw';

// Helper: parse price string like "₹19,999 per person" to number
function parsePriceString(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[₹,\s]/g, '').replace(/perperson/gi, '').trim();
  return parseInt(cleaned, 10) || 0;
}

export default function PackageCheckout() {
  const { packageSlug } = useParams();
  const navigate = useNavigate();

  const [checkoutData, setCheckoutData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);

  const [selectedSharing, setSelectedSharing] = useState('');
  const [computedPrice, setComputedPrice] = useState(0);
  
  const [step, setStep] = useState('checkout'); // 'checkout' | 'success' | 'failed'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingId, setBookingId] = useState('');
  const [paymentId, setPaymentId] = useState('');

  // Derived options
  const [sharingOptions, setSharingOptions] = useState([]);

  useEffect(() => {
    const dataStr = sessionStorage.getItem('checkoutData');
    if (!dataStr) {
      navigate(packageSlug && packageSlug !== 'custom-package' ? `/itinerary/${packageSlug}` : '/');
      return;
    }
    try {
      const data = JSON.parse(dataStr);
      setCheckoutData(data);
      setFormData(data.formData);
      setTripDetails(data.tripDetails);
      
      // Calculate sharing options
      const { price, travellers, costings } = data.tripDetails;
      let options = [];
      if (!costings || !Array.isArray(costings) || costings.length === 0) {
        options = [
          { type: 'Quad Sharing', pricePerPerson: Math.round((price || 0) / (travellers || 1) * 0.85), label: 'Quad Sharing' },
          { type: 'Triple Sharing', pricePerPerson: Math.round((price || 0) / (travellers || 1) * 0.93), label: 'Triple Sharing' },
          { type: 'Double Sharing', pricePerPerson: Math.round((price || 0) / (travellers || 1)), label: 'Double Sharing' },
        ];
      } else {
        options = costings.map(c => ({
          type: c.type || c.name || c.title || c.sharing_type || c.sharing || '', // also read c.sharing
          pricePerPerson: parsePriceString(c.price),
          label: c.type || c.name || c.title || c.sharing_type || c.sharing || ''
        }));
      }
      
      // Sort by price ascending to default to lowest
      options.sort((a, b) => a.pricePerPerson - b.pricePerPerson);

      // If types are missing (empty), assign them based on order: Quad, Triple, Double
      const defaultLabels = ['Quad Sharing', 'Triple Sharing', 'Double Sharing'];
      options = options.map((opt, index) => {
        if (!opt.type || !opt.label) {
          const fallback = defaultLabels[index] || `Sharing Option ${index + 1}`;
          return { ...opt, type: fallback, label: fallback };
        }
        return opt;
      });

      setSharingOptions(options);

      // Default to lowest (which is now guaranteed to have a unique type)
      if (options.length > 0) {
        setSelectedSharing(options[0].type);
        setComputedPrice(options[0].pricePerPerson * (data.tripDetails.travellers || 1));
      }
    } catch (e) {
      console.error("Failed to parse checkout data", e);
      navigate('/');
    }
  }, [navigate, packageSlug]);

  if (!checkoutData || !formData || !tripDetails) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-container-lowest font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full"></div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSharingSelect = (option) => {
    setSelectedSharing(option.type);
    setComputedPrice(option.pricePerPerson * (tripDetails.travellers || 1));
  };

  const subTotal = computedPrice;
  const gst = Math.round(subTotal * 0.05);
  const finalPayable = subTotal + gst;

  const saveBookingToSupabase = async (razorpayPaymentId) => {
    setLoading(true);
    setError(null);

    // Safe date extraction — handles both ISO string and Date object
    let travelDate = '';
    try {
      const raw = formData.date;
      if (typeof raw === 'string') {
        travelDate = raw.split('T')[0];
      } else if (raw instanceof Date) {
        travelDate = raw.toISOString().split('T')[0];
      } else {
        travelDate = String(raw).split('T')[0];
      }
    } catch (e) {
      console.error('Date parse error:', e);
      travelDate = '';
    }

    const parsedPackageId = parseInt(tripDetails.packageId);
    const bookingPayload = {
      customer_name: formData.fullName,
      phone: formData.phone,
      email: formData.email || null,
      source: formData.source || null,
      package_id: isNaN(parsedPackageId) ? null : parsedPackageId,
      package_title: tripDetails.tripTitle,
      destination: tripDetails.destination || null,
      travel_date: travelDate,
      travellers: tripDetails.travellers,
      total_amount: parsePriceString(tripDetails.price),
      selected_sharing: selectedSharing,
      final_amount: finalPayable,
      razorpay_payment_id: razorpayPaymentId,
      payment_status: 'paid',
      booking_status: 'confirmed',
      special_request: formData.specialRequest || null,
    };

    console.log("Retry payment ID:", razorpayPaymentId);
    console.log("bookingPayload", bookingPayload);
    console.log("  customer_name:", bookingPayload.customer_name, '|', typeof bookingPayload.customer_name);
    console.log("  phone:", bookingPayload.phone, '|', typeof bookingPayload.phone);
    console.log("  email:", bookingPayload.email, '|', typeof bookingPayload.email);
    console.log("  travel_date:", bookingPayload.travel_date, '|', typeof bookingPayload.travel_date);
    console.log("  travellers:", bookingPayload.travellers, '|', typeof bookingPayload.travellers);
    console.log("  package_id:", bookingPayload.package_id, '|', typeof bookingPayload.package_id);
    console.log("  package_title:", bookingPayload.package_title, '|', typeof bookingPayload.package_title);
    console.log("  destination:", bookingPayload.destination, '|', typeof bookingPayload.destination);
    console.log("  source:", bookingPayload.source, '|', typeof bookingPayload.source);
    console.log("  special_request:", bookingPayload.special_request, '|', typeof bookingPayload.special_request);
    console.log("  selected_sharing:", bookingPayload.selected_sharing, '|', typeof bookingPayload.selected_sharing);
    console.log("  total_amount:", bookingPayload.total_amount, '|', typeof bookingPayload.total_amount);
    console.log("  final_amount:", bookingPayload.final_amount, '|', typeof bookingPayload.final_amount);
    console.log("  payment_status:", bookingPayload.payment_status, '|', typeof bookingPayload.payment_status);
    console.log("  booking_status:", bookingPayload.booking_status, '|', typeof bookingPayload.booking_status);
    console.log("  razorpay_payment_id:", bookingPayload.razorpay_payment_id, '|', typeof bookingPayload.razorpay_payment_id);

    const { error: insertError } = await supabase
      .from('bookings')
      .insert([bookingPayload]);

    console.log("Insert error:", insertError);

    if (insertError) {
      // Only enter failure path if Supabase explicitly returned an error
      console.error("Booking insert failed:", insertError);
      let errMsg = insertError.message || insertError.details || 'Unknown error';
      if (insertError.code === '23505') {
        errMsg = 'This payment has already been recorded.';
      }
      setError('Payment was successful but booking save failed. Error: ' + errMsg);
      setPaymentId(razorpayPaymentId);
      setLoading(false);
      setStep('failed');
      return; // ← stop here, never touch success state
    }

    // INSERT succeeded — null error
    console.log("Insert successful");
    setPaymentId(razorpayPaymentId);
    sessionStorage.removeItem('checkoutData');
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
    setLoading(false);
    setStep('success'); // ← last line, nothing can overwrite this
  };

  const handleProceedToPayment = () => {
    if (!selectedSharing) return alert('Please select a sharing option');
    
    setLoading(true);
    setError(null);

    const amountInPaise = finalPayable * 100;

    const options = {
      key: RAZORPAY_KEY,
      amount: amountInPaise,
      currency: 'INR',
      name: 'TripoMist',
      description: `${tripDetails.tripTitle} - ${selectedSharing}`,
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: `+91${formData.phone}`
      },
      theme: {
        color: '#136b8a'
      },
      handler: function (response) {
        // Safe to call async function without awaiting in Razorpay handler
        saveBookingToSupabase(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
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

  if (step === 'success') {
    return (
      <div className="flex flex-col min-h-screen bg-surface-container-lowest font-sans">
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-16 mt-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-6xl">check_circle</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h2>
          <p className="text-gray-600 text-lg mb-4">Thank you, {formData.fullName}. Your payment was successful.</p>
          
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full mb-8">
            <p className="text-gray-800 font-bold text-xl mb-3">Payment Reference: {paymentId}</p>
            <div className="w-full h-px bg-gray-100 my-4"></div>
            <p className="font-semibold text-gray-900">{tripDetails.tripTitle}</p>
            <p className="text-gray-600">{new Date(formData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {tripDetails.travellers} Traveller(s)</p>
            <p className="text-[#136b8a] font-bold mt-2">{selectedSharing}</p>
          </div>
          
          <p className="text-gray-500 mb-8">We'll send confirmation details to your email & WhatsApp shortly.</p>
          
          <Link to="/" className="bg-[#136b8a] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#0f556e] transition-colors shadow-md">
            Return to Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="flex flex-col min-h-screen bg-surface-container-lowest font-sans">
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-16 mt-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-6xl">error</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Save Failed</h2>
          <p className="text-gray-600 text-lg mb-8">{error || 'Your payment was successful, but we could not save the booking.'}</p>
          
          <div className="flex flex-col gap-4 w-full max-w-md">
            {paymentId && (
              <button 
                onClick={() => saveBookingToSupabase(paymentId)} 
                disabled={loading}
                className="w-full bg-[#136b8a] hover:bg-[#0f556e] disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Retrying...' : 'Retry Saving Booking'}
                {!loading && <span className="material-symbols-outlined text-lg">refresh</span>}
              </button>
            )}
            {!paymentId && (
              <button onClick={() => { setStep('checkout'); setError(null); }} className="w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-4 rounded-xl shadow-md transition-all">
                Retry Payment
              </button>
            )}
            <Link to="/" className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-xl transition-all block">
              Contact Support
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 mt-20">
        
        <div className="mb-8">
          <Link to={packageSlug && packageSlug !== 'custom-package' ? `/itinerary/${packageSlug}` : '/'} className="inline-flex items-center gap-2 text-[#136b8a] hover:text-[#0f556e] font-semibold mb-4 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Package
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Complete your booking</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (70%) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Section 1: Traveller Details */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <span className="material-symbols-outlined text-[#136b8a] text-2xl">person</span>
                <h2 className="text-2xl font-bold text-gray-900">Traveller Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.fullName} 
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Travel Date</label>
                  <input 
                    type="date" 
                    value={formData.date ? formData.date.split('T')[0] : ''} 
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setFormData({...formData, date: newDate.toISOString()});
                      }
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    readOnly
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    readOnly
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Travellers</label>
                  <input 
                    type="number" 
                    min="1"
                    value={tripDetails.travellers} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setTripDetails({...tripDetails, travellers: val});
                      // Update computed price based on new travellers
                      const opt = sharingOptions.find(o => o.type === selectedSharing);
                      if (opt) setComputedPrice(opt.pricePerPerson * val);
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Source</label>
                  <select 
                    value={formData.source} 
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors"
                  >
                    <option value="">Select source</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Google">Google</option>
                    <option value="Friend and Family">Friend and Family</option>
                    <option value="I'm already travel with you">I'm already travel with you</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Special Request (Optional)</label>
                  <textarea 
                    value={formData.specialRequest || ''} 
                    onChange={(e) => setFormData({...formData, specialRequest: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors"
                    rows="3"
                    placeholder="Any dietary requirements or special requests..."
                  ></textarea>
                </div>
              </div>
            </section>

            {/* Section 2: Occupancy */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-[#136b8a] text-2xl">bed</span>
                <h2 className="text-2xl font-bold text-gray-900">Occupancy</h2>
              </div>
              <p className="text-gray-500 mb-6 border-b border-gray-100 pb-4">Select room sharing type</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharingOptions.map((option) => {
                  const isActive = selectedSharing === option.type;
                  return (
                    <div 
                      key={option.type}
                      onClick={() => handleSharingSelect(option)}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col gap-2 ${
                        isActive 
                          ? 'border-[#136b8a] bg-[#eff6f9] shadow-md scale-[1.02]' 
                          : 'border-gray-200 bg-white hover:border-[#136b8a]/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-[#136b8a]' : 'border-gray-300'}`}>
                          {isActive && <div className="w-2.5 h-2.5 rounded-full bg-[#136b8a]"></div>}
                        </div>
                        {isActive && <span className="bg-[#136b8a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Selected</span>}
                      </div>
                      <h3 className={`font-bold text-lg ${isActive ? 'text-[#136b8a]' : 'text-gray-800'}`}>{option.label}</h3>
                      <div className="mt-auto">
                        <span className={`font-extrabold text-xl ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>₹{option.pricePerPerson.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 font-medium ml-1">/ person</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            
          </div>

          {/* Right Column (30%) - Sticky Payment Summary */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-[100px] bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Summary</h2>
              
              <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1 leading-tight">{tripDetails.tripTitle}</h3>
                  <div className="flex flex-col gap-1 text-sm text-gray-500 mt-3">
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">calendar_month</span> {new Date(formData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">group</span> {tripDetails.travellers} Traveller(s)</div>
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">bed</span> {selectedSharing}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 border-b border-gray-100 pb-6">
                <div className="flex justify-between text-gray-600 font-medium text-sm">
                  <span>Subtotal ({tripDetails.travellers} × ₹{(computedPrice / (tripDetails.travellers || 1)).toLocaleString()})</span>
                  <span>₹{subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium text-sm">
                  <span>Taxes (GST 5%)</span>
                  <span>₹{gst.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8 bg-[#eff6f9] p-4 rounded-xl border border-[#cde5ef]">
                <div>
                  <span className="font-bold text-gray-900 text-base block mb-0.5">Total Payable</span>
                </div>
                <span className="font-extrabold text-[#136b8a] text-2xl">₹{finalPayable.toLocaleString()}</span>
              </div>

              <button 
                onClick={handleProceedToPayment}
                disabled={loading || !selectedSharing}
                className="w-full bg-[#136b8a] hover:bg-[#0f556e] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-[#136b8a]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[22px]">lock</span>
                    Proceed to Payment
                  </>
                )}
              </button>
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>
                  100% Secured by Razorpay
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
