import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

// ─── Server-side guest OTP helpers (no Supabase Auth) ─────────────────────
async function requestBookingGuestOtp(email, name) {
  const { data, error } = await supabase.functions.invoke('guest-otp', {
    body: { action: 'request', email: email.trim().toLowerCase(), purpose: 'booking', name: (name || '').trim() }
  })
  if (error) throw new Error(error.message || 'Failed to send verification code.')
  if (!data?.verificationId) throw new Error('Failed to initiate verification.')
  return data.verificationId
}

async function verifyBookingGuestOtp(verificationId, email, enteredOtp) {
  const { data, error } = await supabase.functions.invoke('guest-otp', {
    body: { action: 'verify', verificationId, email: email.trim().toLowerCase(), purpose: 'booking', otp: enteredOtp }
  })
  if (error) {
    const msg = typeof error?.context === 'object'
      ? (await error.context.clone().json().catch(() => null))?.error
      : null
    throw new Error(msg || error.message || 'Verification failed.')
  }
  if (!data?.verified) throw new Error('Verification failed. Please try again.')
  return true
}
// ──────────────────────────────────────────────────────────────────────────

async function invokeLeadAction(body, extraHeaders = {}, freshSession = null) {
  let effectiveSession = freshSession;
  if (!effectiveSession) {
    const { data } = await supabase.auth.getSession();
    effectiveSession = data.session;
  }
  const headers = { ...extraHeaders };
  if (effectiveSession?.access_token) {
    headers.Authorization = `Bearer ${effectiveSession.access_token}`;
  }

  console.log('BOOKING_REQUEST_AUTH', {
    action: body.action,
    effectiveSessionExists: !!effectiveSession,
    effectiveUserExists: !!effectiveSession?.user,
    accessTokenAttached: !!effectiveSession?.access_token,
    sessionEmail: effectiveSession?.user?.email || null,
    formEmail: body.p_email || body.p_customer_name || null,
    leadIdAttached: !!extraHeaders['x-checkout-lead-id'],
    leadTokenAttached: !!extraHeaders['x-checkout-lead-token']
  });

  return supabase.functions.invoke('booking-checkout', {
    body,
    headers,
  });
}

const BookingModal = ({ isOpen, onClose, tripTitle, price, travellers, destination, packageId, costings, navigate, departureDates = [] }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: null,
    source: ''
  });
  const [isAllDatesModalOpen, setIsAllDatesModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Guest OTP state (server-side, non-authenticating)
  const [showOtp, setShowOtp]                   = useState(false);
  const [otpVerificationId, setOtpVerificationId] = useState(null);
  const [otpDigits, setOtpDigits]               = useState(['', '', '', '', '', '']);
  const [otpSending, setOtpSending]             = useState(false);
  const [otpVerifying, setOtpVerifying]         = useState(false);
  const [otpError, setOtpError]                 = useState(null);
  const [otpCountdown, setOtpCountdown]         = useState(0);
  const otpRefs = React.useRef([]);

  // Countdown timer
  React.useEffect(() => {
    let timer;
    if (otpCountdown > 0) { timer = setInterval(() => setOtpCountdown(c => c - 1), 1000); }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Date Logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validUpcomingDates = (departureDates || [])
    .filter(d => new Date(d) >= today)
    .sort((a, b) => new Date(a) - new Date(b));

  const handleDateSelect = (d) => {
    const selectedDate = new Date(d);
    setFormData({ ...formData, date: selectedDate });
    setIsAllDatesModalOpen(false);
  };

  // Group dates by month for the Expand All modal
  const groupedDates = validUpcomingDates.reduce((acc, dateStr) => {
    const d = new Date(dateStr);
    const monthYear = d.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(dateStr);
    return acc;
  }, {});

  // Save or create checkout lead via secure RPC (no direct table access needed)
  const saveCheckoutLead = async (formattedDate) => {
    // Check for existing lead in this session — try to update it first
    const existingLeadStr = sessionStorage.getItem('tripomist_checkout_lead');
    if (existingLeadStr) {
      try {
        const existingLead = JSON.parse(existingLeadStr);
        if (existingLead.id && existingLead.token) {
          const { error: rpcError } = await invokeLeadAction(
            {
              action: 'update_guest_lead',
              leadId: existingLead.id,
              p_current_step: 'popup_submitted',
            },
            {
              'x-checkout-lead-id': existingLead.id,
              'x-checkout-lead-token': existingLead.token,
            }
          );
            if (rpcError) {
              let responseBody = null;
              if (rpcError?.context && typeof rpcError.context.clone === 'function') {
                try {
                  responseBody = await rpcError.context.clone().json();
                } catch {
                  try {
                    responseBody = await rpcError.context.clone().text();
                  } catch {}
                }
              }

              const functionErrorMessage = typeof responseBody === 'object' && responseBody !== null
                ? (responseBody.error || responseBody.message)
                : (responseBody || rpcError.message);

              if (functionErrorMessage === 'invalid_checkout_lead_auth') {
                const normalizedInputEmail = formData.email.trim().toLowerCase();
                if (session && session.user && session.user.email?.toLowerCase() === normalizedInputEmail) {
                  // Only remove stale browser reference if authenticated
                  sessionStorage.removeItem('tripomist_checkout_lead');
                  throw new Error('RECOVER_STALE_LEAD');
                }
              }

              console.error("BOOK_NOW_RUNTIME_ERROR", {
                action: 'update_guest_lead',
                status: rpcError?.context?.status,
                statusText: rpcError?.context?.statusText,
                responseBody
              });
              console.error('Failed to update existing checkout lead in Supabase:', rpcError);

              const isRateLimit = rpcError.status === 429 ||
                                  (rpcError.message && rpcError.message.includes('429')) ||
                                  (rpcError.context && rpcError.context.status === 429);
              if (isRateLimit) {
                throw new Error("Too many booking attempts. Please wait 10 minutes and try again.");
              }
              throw new Error("Failed to save your enquiry. Please try again.");
            }
          // Reuse existing lead — update succeeded
          return {
            ...existingLead,
            packageId: Number(existingLead.packageId || packageId)
          };
        }
      } catch (e) {
        if (e.message === 'RECOVER_STALE_LEAD') {
          // Do not throw, fall through to create_guest_lead once
        } else if (e.message.includes('attempts') || e.message.includes('Failed to save')) {
          throw e;
        }
        // Otherwise corrupted sessionStorage — fall through to create
      }
    }

    // Create new lead via secure RPC (callable by anon + authenticated)
    const { data, error: rpcError } = await invokeLeadAction({
      action: 'create_guest_lead',
      p_customer_name: formData.fullName,
      p_phone: formData.phone,
      p_email: formData.email || null,
      p_package_id: packageId,
      p_package_title: tripTitle || null,
      p_destination: destination || null,
      p_travel_date: formattedDate,
      p_travellers: travellers || 1,
      p_selected_sharing: null,
      p_estimated_amount: price || 0,
      p_source: formData.source || null,
      p_special_request: null
    });

    if (rpcError) {
      let responseBody = null;
      if (rpcError?.context && typeof rpcError.context.clone === 'function') {
        try {
          responseBody = await rpcError.context.clone().json();
        } catch {
          try {
            responseBody = await rpcError.context.clone().text();
          } catch {}
        }
      }
      console.error("BOOK_NOW_RUNTIME_ERROR", {
        action: 'create_guest_lead',
        status: rpcError?.context?.status,
        statusText: rpcError?.context?.statusText,
        responseBody
      });
      console.error('Booking enquiry insert failed:', rpcError);
      const isRateLimit = rpcError.status === 429 ||
                          (rpcError.message && rpcError.message.includes('429')) ||
                          (rpcError.context && rpcError.context.status === 429);
      if (isRateLimit) {
        throw new Error("Too many booking attempts. Please wait 10 minutes and try again.");
      }
      throw new Error("Failed to save your enquiry. Please try again.");
    }

    // Store the response using: id, token, leadNumber, packageId
    return {
      id: data.leadId,
      token: data.leadToken,
      leadNumber: data.leadNumber,
      packageId: Number(data.packageId)
    };
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

    if (saving || otpSending) return;
    setSaving(true);

    try {
      // Check if already logged in with same email — skip guest OTP for authenticated users
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.email?.toLowerCase() === formData.email.trim().toLowerCase()) {
        // User is already logged in with this email — proceed directly
        await proceedWithBooking();
        return;
      }

      // Guest flow: request server-side OTP (no Supabase Auth)
      setOtpSending(true);
      const vid = await requestBookingGuestOtp(formData.email, formData.fullName);
      setOtpVerificationId(vid);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError(null);
      setOtpCountdown(60);
      setShowOtp(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
      setOtpSending(false);
    }
  };

  const handleVerifyBookingOtp = async () => {
    const token = otpDigits.join('');
    if (token.length !== 6) { setOtpError('Please enter the 6-digit code.'); return; }
    if (otpVerifying) return;
    setOtpVerifying(true);
    setOtpError(null);
    try {
      await verifyBookingGuestOtp(otpVerificationId, formData.email, token);
      setShowOtp(false);
      await proceedWithBooking();
    } catch (err) {
      setOtpError(err.message || 'Incorrect code. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendBookingOtp = async () => {
    if (otpSending) return;
    setOtpSending(true);
    setOtpError(null);
    try {
      const vid = await requestBookingGuestOtp(formData.email, formData.fullName);
      setOtpVerificationId(vid);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpCountdown(60);
    } catch (err) {
      setOtpError(err.message || 'Failed to resend code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits]; next[index] = value; setOtpDigits(next);
    if (value && index < 5 && otpRefs.current[index + 1]) otpRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const next = [...otpDigits]; next[index - 1] = ''; setOtpDigits(next);
      if (otpRefs.current[index - 1]) otpRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpDigits(next);
    if (otpRefs.current[pasted.length - 1]) otpRefs.current[pasted.length - 1].focus();
  };

  const proceedWithBooking = async () => {
    try {
      setSaving(true);
      const year = formData.date.getFullYear();
      const month = String(formData.date.getMonth() + 1).padStart(2, '0');
      const day = String(formData.date.getDate()).padStart(2, '0');
      const yyyymmdd = `${year}-${month}-${day}`;

      // Save checkout lead to Supabase
      const leadRef = await saveCheckoutLead(yyyymmdd);

      if (!leadRef || !leadRef.packageId || !Number.isInteger(leadRef.packageId) || leadRef.packageId <= 0) {
        throw new Error('Package configuration could not be resolved');
      }

      // Store lead reference in sessionStorage (id + token for later RPC updates)
      sessionStorage.setItem('tripomist_checkout_lead', JSON.stringify(leadRef));

      // Save checkout data to sessionStorage (existing flow)
      const checkoutData = {
        formData: {
          ...formData,
          date: yyyymmdd,
        },
        tripDetails: {
          tripTitle,
          price,
          travellers,
          destination,
          packageId: leadRef.packageId,
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
    setShowOtp(false);
    setOtpVerificationId(null);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
        <button onClick={resetAndClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Your Trip</h2>

        {error && !showOtp && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {showOtp ? (
          <div className="py-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#e8f4f8] flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[#136b8a] text-2xl">mail_lock</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Verify Your Email</h3>
              <p className="text-sm text-gray-500 mt-1">
                We sent a 6-digit code to <span className="font-bold text-gray-700">{formData.email}</span>
              </p>
            </div>
            {otpError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{otpError}</div>
            )}
            <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={el => (otpRefs.current[index] = el)}
                  id={`booking-otp-${index}`}
                  type="text" maxLength={1} inputMode="numeric" autoFocus={index === 0}
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(index, e)}
                  className="w-10 h-12 text-center text-lg font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a] focus:border-transparent bg-white"
                />
              ))}
            </div>
            <button
              onClick={handleVerifyBookingOtp}
              disabled={otpVerifying || otpDigits.join('').length !== 6}
              className="w-full py-3 bg-[#136b8a] text-white font-bold rounded-xl hover:bg-[#0f556e] transition-colors disabled:opacity-70 mb-2"
            >
              {otpVerifying ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <div className="flex flex-col items-center space-y-2 mt-1">
              {otpCountdown > 0 ? (
                <span className="text-xs text-gray-500">Resend in {otpCountdown}s</span>
              ) : (
                <button type="button" onClick={handleResendBookingOtp} disabled={otpSending}
                  className="text-sm font-bold text-[#136b8a] hover:underline disabled:opacity-60">
                  {otpSending ? 'Sending...' : 'Resend Code'}
                </button>
              )}
              <button type="button" onClick={() => { setShowOtp(false); setOtpDigits(['','','','','','']); setOtpError(null); }}
                className="text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
            </div>
          </div>
        ) : (
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">Select Travel Date</label>
              {validUpcomingDates.length > 3 && (
                <button type="button" onClick={() => setIsAllDatesModalOpen(true)} className="text-xs font-bold text-[#136b8a] hover:underline">
                  Expand All
                </button>
              )}
            </div>

            {validUpcomingDates.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {validUpcomingDates.map((dateStr, idx) => {
                  const d = new Date(dateStr);
                  const isSelected = formData.date && d.getTime() === formData.date.getTime();
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDateSelect(dateStr)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${isSelected ? 'bg-[#136b8a] text-white border-[#136b8a] shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-[#136b8a] hover:text-[#136b8a]'}`}
                    >
                      <div className="text-[10px] font-bold opacity-80 mb-0.5 tracking-wider">{d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}</div>
                      <div className="text-xl leading-none">{d.getDate()}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="w-full border border-gray-200 rounded-xl px-4 py-4 bg-gray-50 text-gray-500 font-semibold text-center italic">
                Dates Coming Soon
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
        )}
      </div>
    </div>

    {/* Expand All Dates Modal Overlay */}
    {isAllDatesModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-lg md:max-w-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col mx-auto my-auto">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h3 className="font-bold text-gray-900 text-xl">All Departures</h3>
            <button type="button" onClick={() => setIsAllDatesModalOpen(false)} className="text-gray-400 hover:text-gray-900 p-1 transition-colors bg-gray-50 rounded-full hover:bg-gray-100">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
          <div className="overflow-y-auto flex-grow space-y-8 pr-2 custom-scrollbar">
            {Object.entries(groupedDates).map(([monthYear, dates]) => (
              <div key={monthYear}>
                <h4 className="text-sm font-bold text-[#136b8a] mb-4 tracking-widest uppercase border-b border-gray-50 pb-2">{monthYear}</h4>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {dates.map((dateStr, idx) => {
                    const d = new Date(dateStr);
                    const isSelected = formData.date && d.getTime() === formData.date.getTime();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDateSelect(dateStr)}
                        className={`py-3 rounded-xl text-base font-bold transition-all border ${isSelected ? 'bg-[#136b8a] text-white border-[#136b8a] shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-[#136b8a] hover:text-[#136b8a] hover:bg-[#eff6f9]'}`}
                      >
                        {d.getDate()}
                        <div className="text-[11px] font-medium opacity-80 leading-none mt-1 uppercase tracking-wider">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default BookingModal;
