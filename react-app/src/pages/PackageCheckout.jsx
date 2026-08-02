import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';
import { generatePDFVoucher } from '../utils/pdfGenerator';

function formatMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('en-IN')
    : '0';
}

function parsePriceString(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[₹,\s]/g, '').replace(/perperson/gi, '').trim();
  return parseInt(cleaned, 10) || 0;
}

export default function PackageCheckout() {
  const { packageSlug } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState('checkout'); // 'checkout' | 'success' | 'failed'
  const [checkoutData, setCheckoutData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [user, setUser] = useState(null);

  const [selectedSharing, setSelectedSharing] = useState('');
  const [computedPrice, setComputedPrice] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingId, setBookingId] = useState('');
  const [paymentId, setPaymentId] = useState('');

  // Coupon states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [couponAttempts, setCouponAttempts] = useState(0);
  const [lastCouponAttempt, setLastCouponAttempt] = useState(0);

  // Derived options
  const [sharingOptions, setSharingOptions] = useState([]);

  // Server-authorized amount variable
  const [serverFinalPayable, setServerFinalPayable] = useState(null);

  // 6. Track whether payment process has started
  const [paymentStarted, setPaymentStarted] = useState(false);

  // State to block proceed payment button
  const [checkoutBlocked, setCheckoutBlocked] = useState(false);

  // Lock status of individual profile details
  const [profileLocked, setProfileLocked] = useState({ name: false, phone: false, email: false });

  // 8. Restore or persist idempotencyKey inside checkoutData/sessionStorage
  const [idempotencyKey] = useState(() => {
    try {
      const storedData = sessionStorage.getItem('checkoutData');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.idempotencyKey) {
          return parsed.idempotencyKey;
        }
      }
    } catch (e) {
      console.error('Error recovering idempotency key:', e);
    }
    return crypto.randomUUID();
  });

  // Helper: securely update checkout lead via Edge action
  const updateLead = async (updates) => {
    try {
      const leadStr = sessionStorage.getItem('tripomist_checkout_lead');
      if (!leadStr) return;
      const lead = JSON.parse(leadStr);
      if (!lead.id || !lead.token) return;
      await supabase.functions.invoke('razorpay-checkout', {
        body: {
          action: 'update_guest_lead',
          leadId: lead.id,
          ...updates,
        },
        headers: {
          'x-checkout-lead-id':    lead.id,
          'x-checkout-lead-token': lead.token,
        },
      });
    } catch (e) {
      // Non-critical — don't block user flow
    }
  };

  useEffect(() => {
    // 7. Verify RAZORPAY_KEY ID exists; throw config error if missing
    if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
      setError('Payment gateway configuration is missing. Please contact support.');
    }

    const dataStr = sessionStorage.getItem('checkoutData');
    if (!dataStr) {
      navigate(packageSlug && packageSlug !== 'custom-package' ? `/itinerary/${packageSlug}` : '/');
      return;
    }
    // Define an async helper to handle session and state restoration from server status
    const loadCheckoutStatus = async (currentUser) => {
      try {
        const session = (await supabase.auth.getSession()).data?.session;
        
        let profile = null;
        if (currentUser) {
          // Prefill logged-in customer name, phone and email from profile/auth
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', currentUser.id)
            .maybeSingle();
          profile = prof;
        }

        if (currentUser) {
          const prefillName = profile?.full_name || currentUser.user_metadata?.full_name || '';
          const prefillPhone = profile?.phone || currentUser.phone || '';
          const prefillEmail = currentUser.email || '';

          setFormData(prev => ({
            ...prev,
            fullName: prefillName || prev?.fullName || '',
            phone: prefillPhone || prev?.phone || '',
            email: prefillEmail || prev?.email || ''
          }));

          // Track locked status
          setProfileLocked({
            name: !!prefillName,
            phone: !!prefillPhone,
            email: !!prefillEmail
          });

          // If phone/name is missing, show "Complete Profile" once
          if (!prefillName || !prefillPhone) {
            setError('Please Complete your Profile: Name and Phone Number are required.');
          }
        }

        const leadStr = sessionStorage.getItem('tripomist_checkout_lead');
        const lead = leadStr ? JSON.parse(leadStr) : null;
        const leadId = lead?.id || '';
        const leadToken = lead?.token || '';

        const headers = {};
        if (session) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        if (leadId) {
          headers['x-checkout-lead-id'] = leadId;
        }
        if (leadToken) {
          headers['x-checkout-lead-token'] = leadToken;
        }

        const { data: statusData, error: statusErr } = await supabase.functions.invoke('razorpay-checkout', {
          body: {
            action: 'checkout_status',
            idempotencyKey
          },
          headers
        });

        if (!statusErr && statusData && statusData.success && (statusData.found || statusData.guestDetails)) {
          setBookingId(statusData.bookingId);
          setServerFinalPayable(statusData.finalPayableAmount);

          if (statusData.selectedSharing) {
            setSelectedSharing(statusData.selectedSharing);
          }
          if (statusData.activeReservation) {
            setAppliedVoucher({
              id: statusData.activeReservation.reservationId,
              code: statusData.activeReservation.code,
              remaining_amount: statusData.activeReservation.reservedAmount,
              reserved_amount: statusData.activeReservation.reservedAmount,
              reservation_id: statusData.activeReservation.reservationId,
              expires_at: statusData.activeReservation.expiresAt,
              finalPayableAmount: statusData.finalPayableAmount,
              isExpired: statusData.activeReservation.isExpired
            });
          }
          if (statusData.latestPaymentAttempt) {
            setPaymentStarted(true);
          }

          // Lock guest parameters verified on Edge response
          if (!currentUser && statusData.guestDetails) {
            setFormData(prev => ({
              ...prev,
              fullName: statusData.guestDetails.fullName || prev?.fullName || '',
              phone: statusData.guestDetails.phone || prev?.phone || '',
              email: statusData.guestDetails.email || prev?.email || ''
            }));
            setProfileLocked({
              name: !!statusData.guestDetails.fullName,
              phone: !!statusData.guestDetails.phone,
              email: !!statusData.guestDetails.email
            });
          }

          // Handle paid, failed, cancelled and expired statuses
          const attemptStatus = statusData.latestPaymentAttempt?.status;

          if (statusData.paymentStatus === 'paid') {
            // Restore paymentId and clean checkout storage for paid bookings
            setPaymentId(statusData.paymentId || 'PAID_VERIFIED');
            sessionStorage.removeItem('checkoutData');
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartUpdated'));
            setStep('success');
          } else if (attemptStatus === 'preparing' || attemptStatus === 'verification_pending') {
            setCheckoutBlocked(true);
            setError('Payment verification/reconciliation is in progress. Please check My Trips or contact support.');
          } else if (attemptStatus === 'failed' || attemptStatus === 'cancelled' || attemptStatus === 'expired') {
            setCheckoutBlocked(true);
            setError('Payment attempt closed. Please start a new checkout.');
          } else if (statusData.activeReservation?.isExpired) {
            setCheckoutBlocked(true);
            setError('Coupon reservation expired. Please start a new checkout.');
          } else if (attemptStatus === 'verified' && statusData.paymentStatus !== 'paid') {
            setCheckoutBlocked(true);
            setError('Payment reconciliation required. Please check My Trips or contact support.');
          }
        }
      } catch (err) {
        console.error('Error fetching checkout status:', err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        const pendingCoupon = sessionStorage.getItem('pending_coupon_code');
        if (pendingCoupon) {
          setVoucherCode(pendingCoupon);
          sessionStorage.removeItem('pending_coupon_code');
        }
      }
      loadCheckoutStatus(currentUser);
    });
    try {
      const data = JSON.parse(dataStr);
      // Preserve idempotency key back into sessionStorage structure for reload persistence
      if (!data.idempotencyKey) {
        data.idempotencyKey = idempotencyKey;
        sessionStorage.setItem('checkoutData', JSON.stringify(data));
      }
      setCheckoutData(data);
      setFormData(data.formData);
      setTripDetails(data.tripDetails);
      
      // Calculate sharing options
      const { price, travellers, costings } = data.tripDetails;
      let options = [];

      // Find Quad base price
      let quadBasePrice = 0;
      if (costings && Array.isArray(costings)) {
        const quadCosting = costings.find(c => (c.type || c.name || c.title || c.sharing_type || c.sharing || '') === 'Quad Sharing');
        if (quadCosting) {
          quadBasePrice = parsePriceString(quadCosting.price);
        }
      }

      // Find Upgrade costs
      let tripleUpgrade = 0;
      let doubleUpgrade = 0;

      if (costings && Array.isArray(costings)) {
        const tripleCosting = costings.find(c => (c.type || c.name || c.title || c.sharing_type || c.sharing || '') === 'Triple Sharing Upgrade');
        if (tripleCosting) {
          tripleUpgrade = parsePriceString(tripleCosting.price);
        }
        const doubleCosting = costings.find(c => (c.type || c.name || c.title || c.sharing_type || c.sharing || '') === 'Double Sharing Upgrade');
        if (doubleCosting) {
          doubleUpgrade = parsePriceString(doubleCosting.price);
        }
      }

      // Verify Quad Sharing, Triple Sharing Upgrade, and Double Sharing Upgrade are present and valid, otherwise block checkout
      if (quadBasePrice <= 0 || tripleUpgrade <= 0 || doubleUpgrade <= 0) {
        setError('Package configuration error: occupancy upgrades are missing.');
        setCheckoutBlocked(true);
        options = [];
      } else {
        const rawOptions = [
          { type: 'Quad Sharing', pricePerPerson: quadBasePrice, label: 'Quad Sharing' },
          { type: 'Triple Sharing', pricePerPerson: quadBasePrice + tripleUpgrade, label: 'Triple Sharing' },
          { type: 'Double Sharing', pricePerPerson: quadBasePrice + doubleUpgrade, label: 'Double Sharing' }
        ];

        options = rawOptions
          .map(option => {
            const pricePerPerson = Number(option.pricePerPerson ?? option.price ?? 0);
            return { ...option, pricePerPerson };
          })
          .filter(option => Number.isFinite(option.pricePerPerson) && option.pricePerPerson > 0);

        if (options.length === 0) {
          setError('Package configuration error: sharing options are invalid.');
          setCheckoutBlocked(true);
        } else {
          const firstOpt = options.find(o => o.type === 'Quad Sharing') || options[0];
          setSelectedSharing(firstOpt.type);
          setComputedPrice(firstOpt.pricePerPerson * (data.tripDetails.travellers || 1));
        }
      }

      setSharingOptions(options);

      // Track: checkout page opened
      updateLead({ p_current_step: 'checkout_opened' });
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

  if (sharingOptions.length === 0 && !loading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-container-lowest font-sans">
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-16 mt-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-6xl">error</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Package Configuration Error</h2>
          <p className="text-gray-600 text-lg mb-8">{error || 'Package occupancy/sharing prices could not be loaded.'}</p>
          <Link to="/" className="bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-4 px-8 rounded-xl shadow-md transition-all">
            Back to Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSharingSelect = (option) => {
    // 4. Disable room occupancy selection after booking initialize
    if (bookingId) return;
    setSelectedSharing(option.type);
    setComputedPrice(option.pricePerPerson * (tripDetails.travellers || 1));
    // Track: sharing selected
    const newAmount = option.pricePerPerson * (tripDetails.travellers || 1);
    const newAmountWithGst = newAmount + Math.round(newAmount * 0.05);
    updateLead({
      p_current_step: 'sharing_selected',
      p_selected_sharing: option.type,
      p_estimated_amount: newAmountWithGst,
    });
  };

  const travellerCount = Math.max(1, Number(tripDetails?.travellers) || 1);
  const subTotal = Number(computedPrice) || 0;
  const gst = Math.round(subTotal * 0.05);
  const totalBeforeVoucher = subTotal + gst;
  
  let voucherDiscount = 0;
  if (appliedVoucher) {
    voucherDiscount = Math.min(totalBeforeVoucher, appliedVoucher.remaining_amount);
  }
  
  const finalPayable = totalBeforeVoucher - voucherDiscount;

  const isFullVoucherReservation = !!(appliedVoucher && 
    !(appliedVoucher.expires_at && new Date(appliedVoucher.expires_at) <= new Date()) && 
    Number(appliedVoucher.remaining_amount) >= totalBeforeVoucher
  );
  
  const safeFinalPayable = (
    serverFinalPayable !== null &&
    serverFinalPayable !== undefined &&
    Number.isFinite(Number(serverFinalPayable)) &&
    Number(serverFinalPayable) >= 0 &&
    (Number(serverFinalPayable) > 0 || isFullVoucherReservation)
  ) ? Number(serverFinalPayable) : totalBeforeVoucher;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter a coupon code.');
      return;
    }
    
    // Rate limit check
    const now = Date.now();
    if (now - lastCouponAttempt > 60000) {
      setCouponAttempts(1);
    } else {
      if (couponAttempts >= 5) {
        setVoucherError('Too many attempts. Please try again later.');
        return;
      }
      setCouponAttempts(prev => prev + 1);
    }
    setLastCouponAttempt(now);
    
    setVoucherLoading(true);
    setVoucherError('');
    try {
      // Validate customer fields before initialize
      if (!formData?.fullName || !formData.fullName.trim()) {
        throw new Error('Full Name is required.');
      }
      if (!formData?.phone || !formData.phone.trim()) {
        throw new Error('Phone Number is required.');
      }
      if (!formData?.email || !formData.email.trim()) {
        throw new Error('Email Address is required.');
      }
      if (!formData?.date) {
        throw new Error('Travel Date is required.');
      }
      const travelDateObj = new Date(formData.date);
      if (isNaN(travelDateObj.getTime()) || travelDateObj <= new Date()) {
        throw new Error('Travel Date must be a future date.');
      }
      if (!tripDetails?.travellers || tripDetails.travellers < 1 || tripDetails.travellers > 50) {
        throw new Error('Number of travellers must be between 1 and 50.');
      }
      if (!selectedSharing || !['Quad Sharing', 'Triple Sharing', 'Double Sharing'].includes(selectedSharing)) {
        throw new Error('Please select a valid room sharing occupancy.');
      }

      const session = (await supabase.auth.getSession()).data?.session;
      const leadStr = sessionStorage.getItem('tripomist_checkout_lead');
      const lead = leadStr ? JSON.parse(leadStr) : null;
      const leadId = lead?.id || '';
      const leadToken = lead?.token || '';

      const headers = {};
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (leadId) {
        headers['x-checkout-lead-id'] = leadId;
      }
      if (leadToken) {
        headers['x-checkout-lead-token'] = leadToken;
      }

      // If user is logged-in, make sure their profile name/phone are updated/saved via upsert
      if (session?.user) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!currentProfile?.full_name || !currentProfile?.phone) {
          const { error: upsertErr } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              full_name: currentProfile?.full_name || formData.fullName.trim(),
              phone: currentProfile?.phone || formData.phone.trim(),
              email: formData.email.trim(),
              updated_at: new Date().toISOString()
            });
          if (upsertErr) {
            throw new Error(`Profile update failed: ${upsertErr.message}`);
          }
        }
      }

      // On checkout, we must have initialized a booking first.
      // If no booking exists, initialize it now on coupon application.
      let currentBookingId = bookingId;
      if (!currentBookingId) {
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
          travelDate = '';
        }

        const { data: initData, error: initErr } = await supabase.functions.invoke('razorpay-checkout', {
          body: {
            action: 'initialize',
            packageId: parseInt(tripDetails.packageId),
            travelDate,
            travellers: tripDetails.travellers,
            selectedSharing,
            idempotencyKey,
            specialRequest: formData.specialRequest || null,
            source: formData.source || null
          },
          headers
        });

        if (initErr || !initData || !initData.success) {
          throw new Error('Failed to initialize booking transaction before applying coupon.');
        }

        currentBookingId = initData.bookingId;
        setBookingId(initData.bookingId);
        setServerFinalPayable(initData.finalPayableAmount);
      }

      // Coupon Apply par call reserve_coupon
      const { data: resData, error: resErr } = await supabase.functions.invoke('razorpay-checkout', {
        body: {
          action: 'reserve_coupon',
          bookingId: currentBookingId,
          couponCode: voucherCode.trim()
        },
        headers
      });

      if (resErr) {
        let errMsg = 'Invalid coupon code.';
        try {
          const bodyText = await resErr.context?.response?.text();
          if (bodyText) {
            const parsed = JSON.parse(bodyText);
            if (parsed.error) errMsg = parsed.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      if (!resData || !resData.success) {
        throw new Error('Failed to reserve coupon balance.');
      }
      
      setAppliedVoucher({
        id: resData.reservationId,
        code: voucherCode.trim(),
        remaining_amount: resData.reservedAmount,
        reserved_amount: resData.reservedAmount,
        reservation_id: resData.reservationId,
        expires_at: resData.expiresAt,
        finalPayableAmount: resData.finalPayableAmount
      });
      setServerFinalPayable(resData.finalPayableAmount);
      setVoucherCode('');
    } catch (err) {
      setVoucherError(err.message || 'Invalid coupon code.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const verifyPaymentServer = async (razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentAttemptId) => {
    setLoading(true);
    setError(null);

    try {
      const session = (await supabase.auth.getSession()).data?.session;
      const leadStr = sessionStorage.getItem('tripomist_checkout_lead');
      const lead = leadStr ? JSON.parse(leadStr) : null;
      const leadId = lead?.id || '';
      const leadToken = lead?.token || '';

      const headers = {};
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (leadId) {
        headers['x-checkout-lead-id'] = leadId;
      }
      if (leadToken) {
        headers['x-checkout-lead-token'] = leadToken;
      }

      const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('razorpay-checkout', {
        body: {
          action: 'verify',
          bookingId,
          paymentAttemptId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature
        },
        headers
      });

      if (verifyErr || !verifyData || !verifyData.success) {
        throw new Error(verifyErr?.message || 'Payment verification failed on the server.');
      }

      setPaymentId(razorpayPaymentId);
      // 9. Clear saved checkout data only after successful checkout completes
      sessionStorage.removeItem('checkoutData');
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));

      updateLead({
        p_current_step: 'payment_success',
        p_lead_status: 'converted',
        p_payment_status: 'paid',
        p_razorpay_payment_id: razorpayPaymentId,
      });

      setLoading(false);
      setStep('success');
    } catch (err) {
      console.error('Verification error:', err);
      // 4. Save real razorpay payment ID to fail state for webhook confirmation
      setPaymentId(razorpayPaymentId);
      setError(err.message || 'Verification failed. Please contact support.');
      setLoading(false);
      setStep('failed');
    }
  };

  const handleProceedToPayment = async () => {
    // 12. Replace native alert with normal page error
    if (!selectedSharing) {
      setError('Please select a room sharing type before proceeding.');
      return;
    }

    // 3. Proceed par live session check
    const { data: { session } } = await supabase.auth.getSession();

    setLoading(true);
    setError(null);

    try {
      // Validate customer fields before initialize
      if (!formData?.fullName || !formData.fullName.trim()) {
        throw new Error('Full Name is required.');
      }
      if (!formData?.phone || !formData.phone.trim()) {
        throw new Error('Phone Number is required.');
      }
      if (!formData?.email || !formData.email.trim()) {
        throw new Error('Email Address is required.');
      }
      if (!formData?.date) {
        throw new Error('Travel Date is required.');
      }
      const travelDateObj = new Date(formData.date);
      if (isNaN(travelDateObj.getTime()) || travelDateObj <= new Date()) {
        throw new Error('Travel Date must be a future date.');
      }
      if (!tripDetails?.travellers || tripDetails.travellers < 1 || tripDetails.travellers > 50) {
        throw new Error('Number of travellers must be between 1 and 50.');
      }
      if (!selectedSharing || !['Quad Sharing', 'Triple Sharing', 'Double Sharing'].includes(selectedSharing)) {
        throw new Error('Please select a valid room sharing occupancy.');
      }

      // If user is logged-in, make sure their profile name/phone are updated/saved via upsert
      if (session?.user) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!currentProfile?.full_name || !currentProfile?.phone) {
          const { error: upsertErr } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              full_name: currentProfile?.full_name || formData.fullName.trim(),
              phone: currentProfile?.phone || formData.phone.trim(),
              email: formData.email.trim(),
              updated_at: new Date().toISOString()
            });
          if (upsertErr) {
            throw new Error(`Profile update failed: ${upsertErr.message}`);
          }
        }
      }

      let currentBookingId = bookingId;
      let finalAmount = safeFinalPayable;

      const leadStr = sessionStorage.getItem('tripomist_checkout_lead');
      const lead = leadStr ? JSON.parse(leadStr) : null;
      const leadId = lead?.id || '';
      const leadToken = lead?.token || '';

      const headers = {};
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (leadId) {
        headers['x-checkout-lead-id'] = leadId;
      }
      if (leadToken) {
        headers['x-checkout-lead-token'] = leadToken;
      }

      // 3. On checkout call Edge action initialize
      if (!currentBookingId) {
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
          travelDate = '';
        }

        // 4. Send no customer details or price to initialize except when guest checkout
        const { data: initData, error: initErr } = await supabase.functions.invoke('razorpay-checkout', {
          body: {
            action: 'initialize',
            packageId: parseInt(tripDetails.packageId),
            travelDate,
            travellers: tripDetails.travellers,
            selectedSharing,
            idempotencyKey,
            specialRequest: formData.specialRequest || null,
            source: formData.source || null,
            // Include guest identity fields if session is missing
            guestName: !session ? formData.fullName.trim() : null,
            guestPhone: !session ? formData.phone.trim() : null,
            guestEmail: !session ? formData.email.trim() : null
          },
          headers
        });

        if (initErr || !initData || !initData.success) {
          throw new Error('Failed to initialize booking transaction.');
        }

        currentBookingId = initData.bookingId;
        setBookingId(initData.bookingId);
        setServerFinalPayable(initData.finalPayableAmount);
        finalAmount = initData.finalPayableAmount;
      }

      // 7. If final amount = 0, call full_coupon
      if (finalAmount === 0 && appliedVoucher?.reservation_id) {
        const { data: fullCouponData, error: fullCouponErr } = await supabase.functions.invoke('razorpay-checkout', {
          body: {
            action: 'full_coupon',
            bookingId: currentBookingId,
            reservationId: appliedVoucher.reservation_id
          },
          headers
        });

        if (fullCouponErr || !fullCouponData || !fullCouponData.success) {
          throw new Error(fullCouponErr?.message || 'Failed to complete zero amount coupon checkout.');
        }

        setPaymentId('PAID_BY_VOUCHER');
        sessionStorage.removeItem('checkoutData');
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated'));

        setLoading(false);
        setStep('success');
        return;
      }

      // 8. Otherwise call prepare and open Razorpay using returned order ID/amount
      const { data: prepareData, error: prepareErr } = await supabase.functions.invoke('razorpay-checkout', {
        body: {
          action: 'prepare',
          bookingId: currentBookingId,
          idempotencyKey
        },
        headers
      });

      if (prepareErr || !prepareData || !prepareData.success) {
        throw new Error(prepareErr?.message || 'Failed to prepare payment transaction order.');
      }

      // 6. Set paymentStarted state variable to true upon successful prepare response
      setPaymentStarted(true);

      updateLead({
        p_current_step: 'razorpay_opened',
        p_lead_status: 'payment_pending',
        p_payment_status: 'pending',
        p_selected_sharing: selectedSharing,
        p_estimated_amount: finalAmount,
      });

      // 7. Retrieve VITE_RAZORPAY_KEY_ID from import.meta.env
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        throw new Error('Payment gateway configuration key missing.');
      }

      const options = {
        key: razorpayKeyId,
        // 1. Map expectedAmountPaise instead of amount
        amount: prepareData.expectedAmountPaise,
        currency: 'INR',
        name: 'TripoMist',
        description: `${tripDetails.tripTitle} - ${selectedSharing}`,
        order_id: prepareData.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: `+91${formData.phone}`
        },
        theme: {
          color: '#136b8a'
        },
        // 9. Razorpay success handler must call verify
        handler: function (response) {
          verifyPaymentServer(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
            prepareData.paymentAttemptId
          );
        },
        modal: {
          // 12. Razorpay close/failure par reservation release mat karo; retry message dikhao
          ondismiss: function () {
            setLoading(false);
            setError('Payment window closed. If amount was deducted, verification will complete shortly. Otherwise, please try again.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setLoading(false);
        // 12. Razorpay close/failure par reservation release mat karo; retry message dikhao
        setError('Payment failed: ' + (response.error?.description || 'Please try again. If money was debited, it will reflect within 24 hours.'));
        updateLead({
          p_current_step: 'payment_failed',
          p_payment_status: 'failed',
        });
      });
      rzp.open();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Could not open payment gateway. Please try again.');
    }
  };

  if (step === 'success') {
    const travelDateDisplay = formData.date
      ? (() => {
          const parts = formData.date.split('T')[0].split('-');
          if (parts.length !== 3) return formData.date;
          const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          return `${parseInt(parts[2], 10)} ${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
        })()
      : '—';
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 mt-20">

          {/* Animated check */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="relative w-28 h-28 mb-6">
              <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30"></div>
              <div className="relative w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-6xl">check_circle</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Booking Confirmed!</h1>
            <p className="text-gray-500 text-lg max-w-md">
              Your trip is officially booked. Get ready for an unforgettable experience with TripoMist.
            </p>
          </div>

          {/* Confirmation card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {/* Card header */}
            <div className="bg-gradient-to-r from-[#136b8a] to-teal-600 px-6 py-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">luggage</span>
              </div>
              <div>
                <p className="text-teal-100 text-xs font-semibold uppercase tracking-wide">Booking Confirmation</p>
                <h2 className="text-white font-bold text-xl leading-tight">{tripDetails.tripTitle}</h2>
              </div>
            </div>

            {/* Details grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  { icon: 'receipt_long', label: 'Payment Reference', value: paymentId, mono: true },
                  { icon: 'location_on', label: 'Destination', value: tripDetails.destination || tripDetails.tripTitle },
                  { icon: 'calendar_month', label: 'Travel Date', value: travelDateDisplay },
                  { icon: 'group', label: 'Travellers', value: tripDetails.travellers + ' Traveller(s)' },
                  { icon: 'hotel', label: 'Room Sharing', value: selectedSharing },
                  { icon: 'currency_rupee', label: 'Amount Paid', value: `₹${formatMoney(safeFinalPayable)}`, highlight: true },
                  { icon: 'verified', label: 'Payment Status', value: 'Paid', badge: 'paid' },
                  { icon: 'task_alt', label: 'Booking Status', value: 'Confirmed', badge: 'confirmed' },
                ].map(({ icon, label, value, mono, highlight, badge }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                     <div className="w-8 h-8 bg-[#136b8a]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                       <span className="material-symbols-outlined text-[#136b8a] text-[18px]">{icon}</span>
                     </div>
                     <div className="min-w-0">
                       <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                       {badge === 'paid' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">✓ Paid</span>}
                       {badge === 'confirmed' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full border border-teal-200">✓ Confirmed</span>}
                       {!badge && <p className={`font-semibold ${highlight ? 'text-emerald-700 text-lg' : 'text-gray-900'} ${mono ? 'font-mono text-sm break-all' : ''}`}>{value}</p>}
                     </div>
                   </div>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-sm">Download your trip booking voucher</h3>
                  <p className="text-xs text-gray-500 mt-1">Get your A4-styled voucher PDF with QR code and helpline details.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => generatePDFVoucher({
                      booking_id: bookingId || 'TMP-' + Date.now().toString().slice(-6),
                      created_at: new Date().toISOString(),
                      package_title: tripDetails.tripTitle,
                      travel_date: formData.date,
                      travellers: tripDetails.travellers,
                      selected_sharing: selectedSharing,
                      customer_name: formData.fullName,
                      phone: formData.phone,
                      email: formData.email,
                      final_amount: safeFinalPayable,
                      total_amount: parsePriceString(tripDetails.price)
                    }, 'download')}
                    className="bg-[#136b8a] hover:bg-[#0f556e] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download PDF
                  </button>
                  <button 
                    onClick={() => generatePDFVoucher({
                      booking_id: bookingId || 'TMP-' + Date.now().toString().slice(-6),
                      created_at: new Date().toISOString(),
                      package_title: tripDetails.tripTitle,
                      travel_date: formData.date,
                      travellers: tripDetails.travellers,
                      selected_sharing: selectedSharing,
                      customer_name: formData.fullName,
                      phone: formData.phone,
                      email: formData.email,
                      final_amount: safeFinalPayable,
                      total_amount: parsePriceString(tripDetails.price)
                    }, 'open')}
                    className="bg-white text-gray-700 border border-gray-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    View PDF
                  </button>
                </div>
              </div>

              <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-sm text-teal-700 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] mt-0.5">notifications</span>
                We'll send confirmation details to <strong>{formData.email}</strong> shortly.
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {user ? (
              <Link
                to="/my-trips"
                className="flex-1 bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">luggage</span>
                View My Trips
              </Link>
            ) : (
              <div className="w-full bg-[#FFF8E6] border border-amber-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 text-amber-700 shadow-sm">
                    <span className="material-symbols-outlined text-[20px] font-semibold">lock</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      Want to manage this booking later?
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 font-medium">Login anytime to:</p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1.5 list-none pl-0">
                      {[
                        'View all your upcoming trips',
                        'Access booking confirmations & invoices',
                        'Track booking status',
                        'Receive trip updates and notifications',
                        'Manage your profile and travel history',
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <button
                    onClick={() => {
                      sessionStorage.setItem('pending_claim', JSON.stringify({ id: bookingId, razorpay_payment_id: paymentId }));
                      navigate('/login');
                    }}
                    className="flex-1 bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">lock_open</span>
                    Login & Save Booking
                  </button>
                  <Link
                    to="/"
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-3.5 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center"
                  >
                    Skip for Now
                  </Link>
                </div>
              </div>
            )}
            
            {user && (
              <Link
                to="/"
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">home</span>
                Back to Home
              </Link>
            )}
          </div>
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
              <Link
                to="/my-trips"
                className="w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                Check My Trips
                <span className="material-symbols-outlined text-lg">luggage</span>
              </Link>
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
                    disabled={!!bookingId}
                    readOnly={profileLocked.name}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className={`w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors ${profileLocked.name ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Travel Date</label>
                  <input 
                    type="date" 
                    value={formData.date ? formData.date.split('T')[0] : ''} 
                    disabled={!!bookingId}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({...formData, date: e.target.value});
                      }
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    disabled={!!bookingId}
                    readOnly={profileLocked.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors ${profileLocked.phone ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    disabled={!!bookingId}
                    readOnly={profileLocked.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors ${profileLocked.email ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Travellers</label>
                  <input 
                    type="number" 
                    min="1"
                    value={tripDetails.travellers} 
                    disabled={!!bookingId}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setTripDetails({...tripDetails, travellers: val});
                      // Update computed price based on new travellers
                      const opt = sharingOptions.find(o => o.type === selectedSharing);
                      if (opt) setComputedPrice(opt.pricePerPerson * val);
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Source</label>
                  <select 
                    value={formData.source} 
                    disabled={!!bookingId}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
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
                    disabled={!!bookingId}
                    onChange={(e) => setFormData({...formData, specialRequest: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#136b8a] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
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
                  const pricePerPerson = Number(option.pricePerPerson ?? option.price ?? 0);
                  if (!Number.isFinite(pricePerPerson) || pricePerPerson <= 0) return null;
                  const isActive = selectedSharing === option.type;
                  const isOccupancyDisabled = !!bookingId;
                  return (
                    <div 
                      key={option.type}
                      onClick={() => !isOccupancyDisabled && handleSharingSelect(option)}
                      className={`rounded-2xl p-5 border-2 transition-all flex flex-col gap-2 ${
                        isOccupancyDisabled
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-pointer'
                      } ${
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
                        <span className={`font-extrabold text-xl ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>₹{formatMoney(pricePerPerson)}</span>
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

              <div className="space-y-3 mb-4 border-b border-gray-100 pb-4">
                <div className="flex justify-between text-gray-600 font-medium text-sm">
                  <span>Subtotal ({tripDetails.travellers} × ₹{formatMoney(computedPrice / travellerCount)})</span>
                  <span>₹{formatMoney(subTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium text-sm">
                  <span>Taxes (GST 5%)</span>
                  <span>₹{formatMoney(gst)}</span>
                </div>
              </div>

              {/* 10. Coupon field Proceed to Payment button ke just above rakho */}
              {/* 7. Hide/Disable coupon application block after payment has started or checkout is blocked */}
              {!paymentStarted && !checkoutBlocked && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  {appliedVoucher ? (
                    (() => {
                      const isExpired = appliedVoucher.expires_at && new Date(appliedVoucher.expires_at) <= new Date();
                      return (
                        <div className={`${isExpired ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'} border rounded-xl p-3 flex justify-between items-center`}>
                          <div>
                            <div className={`${isExpired ? 'text-rose-800' : 'text-emerald-800'} font-bold text-sm flex items-center gap-1`}>
                              <span className="material-symbols-outlined text-[16px]">{isExpired ? 'error' : 'local_activity'}</span>
                              {isExpired ? 'Coupon Reservation Expired' : 'Coupon Applied'}
                            </div>
                            <div className={`${isExpired ? 'text-rose-600' : 'text-emerald-600'} text-xs mt-0.5`}>{appliedVoucher.code}</div>
                          </div>
                           <div className="text-right">
                             <div className={`${isExpired ? 'text-rose-700' : 'text-emerald-700'} font-bold`}>
                               -₹{formatMoney(appliedVoucher.remaining_amount)}
                             </div>
                            <p className="text-[10px] font-semibold mt-1">
                              {isExpired ? 'Coupon reservation expired. Please start a new checkout.' : 'Coupon locked for 15 minutes'}
                            </p>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Have a Coupon Code?</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#136b8a] outline-none bg-gray-50 uppercase"
                          disabled={voucherLoading}
                        />
                        <button
                          onClick={handleApplyVoucher}
                          disabled={voucherLoading || !voucherCode.trim()}
                          className="bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          {voucherLoading ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                      {voucherError && <p className="text-rose-600 text-xs mt-2 font-medium">{voucherError}</p>}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-end mb-8 bg-[#eff6f9] p-4 rounded-xl border border-[#cde5ef]">
                <div>
                  <span className="font-bold text-gray-900 text-base block mb-0.5">Total Payable</span>
                </div>
                <span className="font-extrabold text-[#136b8a] text-2xl">₹{formatMoney(safeFinalPayable)}</span>
              </div>

              <button 
                onClick={handleProceedToPayment}
                disabled={loading || !selectedSharing || checkoutBlocked}
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
