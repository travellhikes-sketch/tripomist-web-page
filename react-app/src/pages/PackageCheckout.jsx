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


  const [sharingOptions, setSharingOptions] = useState([]);

  // Server-authorized amount variable
  const [serverFinalPayable, setServerFinalPayable] = useState(null);

  // 6. Track whether payment process has started
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        const settingsObj = {};
        data.forEach(item => {
          settingsObj[item.setting_key] = item.setting_value;
        });
        setSiteSettings(settingsObj);
      }
    };
    fetchSettings();
  }, []);

  // State to block proceed payment button
  const [checkoutBlocked, setCheckoutBlocked] = useState(false);

  // Additional Checkout Data
  const [additionalTravellers, setAdditionalTravellers] = useState([]);
  const [primaryTravellerSharing, setPrimaryTravellerSharing] = useState('');
  const [sharingAllocation, setSharingAllocation] = useState({});

  const handleAllocationChange = (type, delta) => {
    setSharingAllocation(prev => {
      const current = prev[type] || 0;
      const currentTotal = Object.values(prev).reduce((a, b) => a + b, 0);
      const targetTotal = tripDetails?.travellers || 1;

      if (delta > 0 && currentTotal >= targetTotal) {
        return prev;
      }

      const newVal = Math.max(0, current + delta);
      return { ...prev, [type]: newVal };
    });
  };

  // Lock status of individual profile details
  const [profileLocked, setProfileLocked] = useState({ name: false, phone: false, email: false });

  // 8. Restore or persist idempotencyKey inside checkoutData/sessionStorage
  const [idempotencyKey, setIdempotencyKey] = useState(() => {
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

  // Helper: securely invoke booking-checkout payment-independent calls
  const invokeBookingCheckout = async (body, isRetry = false) => {
    const leadStr = sessionStorage.getItem('tripomist_checkout_lead');
    const lead = leadStr ? JSON.parse(leadStr) : null;

    const { data: { session } } = await supabase.auth.getSession();

    const headers = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    if (lead?.id && lead?.token) {
      headers['x-checkout-lead-id'] = lead.id;
      headers['x-checkout-lead-token'] = lead.token;
    }

    const { data, error } = await supabase.functions.invoke('booking-checkout', {
      body,
      headers
    });

    if (error && !isRetry) {
      const errStr = JSON.stringify(error);
      if (errStr.includes('invalid_checkout_lead_auth')) {
        return invokeBookingCheckout(body, true);
      }
    }
    return { data, error };
  };

  // Helper: securely update checkout lead via Edge action
  const updateLead = async (updates) => {
    try {
      const leadStr = sessionStorage.getItem('tripomist_checkout_lead');
      if (!leadStr) return;
      const lead = JSON.parse(leadStr);
      if (!lead.id) return;

      const headers = {};
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (lead.id && lead.token) {
        headers['x-checkout-lead-id'] = lead.id;
        headers['x-checkout-lead-token'] = lead.token;
      }

      await supabase.functions.invoke('razorpay-checkout', {
        body: {
          action: 'update_guest_lead',
          leadId: lead.id,
          ...updates,
        },
        headers
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

      // Check for valid Name and Phone from existing checkout data
      const currentName = data.formData?.fullName || '';
      const currentPhone = data.formData?.phone || '';
      const hasValidPhone = /^\d{10}$/.test(currentPhone.trim());

      if (!currentName || !hasValidPhone) {
        setError('Please Complete your Profile: Name and Phone Number are required.');
      }

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

      // Handle user session and prefill profile if logged in
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          const pendingCoupon = sessionStorage.getItem('pending_coupon_code');
          if (pendingCoupon) {
            setVoucherCode(pendingCoupon);
            sessionStorage.removeItem('pending_coupon_code');
          }

          // Merge profile data if missing
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', currentUser.id)
            .maybeSingle();

          const prefillName = prof?.full_name || currentUser.user_metadata?.full_name || '';
          const prefillPhone = prof?.phone || currentUser.phone || '';
          const prefillEmail = currentUser.email || '';

          setFormData(prev => ({
            ...prev,
            fullName: prev?.fullName || prefillName || '',
            phone: prev?.phone || prefillPhone || '',
            email: prev?.email || prefillEmail || ''
          }));

          setProfileLocked({
            name: !!prefillName,
            phone: !!prefillPhone,
            email: !!prefillEmail
          });

          // Check again with merged data
          const mergedName = data.formData?.fullName || prefillName || '';
          const mergedPhone = data.formData?.phone || prefillPhone || '';
          const hasMergedPhone = /^\d{10}$/.test(mergedPhone.trim());
          if (mergedName && hasMergedPhone) {
            setError(null);
          }
        }
      });
    } catch (e) {
      console.error("Failed to parse checkout data", e);
      navigate('/');
    }
  }, [navigate, packageSlug]);

  if (!checkoutData || !formData || !tripDetails) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-container-lowest ">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#01AFD1] border-t-transparent rounded-full"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (sharingOptions.length === 0 && !loading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-container-lowest ">
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-16 mt-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-6xl">error</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Package Configuration Error</h2>
          <p className="text-gray-600 text-lg mb-8">{error || 'Package occupancy/sharing prices could not be loaded.'}</p>
          <Link to="/" className="bg-[#01AFD1] hover:bg-[#0092b3] text-white font-bold py-4 px-8 rounded-xl shadow-md transition-all">
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
    const newAmount = option.pricePerPerson * (tripDetails.travellers || 1);
    setComputedPrice(newAmount);
  };
  const travellerCount = Math.max(1, Number(tripDetails?.travellers) || 1);
  let mixedSubTotal = 0;
  if (sharingOptions && sharingOptions.length > 0 && Object.keys(sharingAllocation).length > 0) {
    for (const [key, count] of Object.entries(sharingAllocation)) {
      if (count > 0) {
        const opt = sharingOptions.find(o => (o.label || o.type) === key);
        if (opt) mixedSubTotal += count * opt.pricePerPerson;
      }
    }
  }
  const subTotal = (mixedSubTotal > 0 && Object.values(sharingAllocation).reduce((a, b) => a + b, 0) === travellerCount)
    ? mixedSubTotal
    : (Number(computedPrice) || 0);

  const gstEnabled = siteSettings?.package_detail_settings?.gst_enabled !== undefined ? siteSettings.package_detail_settings.gst_enabled : true;
  const gst = gstEnabled ? Math.round(subTotal * 0.05 * 100) / 100 : 0;
  const finalPayable = subTotal + gst;

  const safeFinalPayable = (
    serverFinalPayable !== null &&
    serverFinalPayable !== undefined &&
    Number.isFinite(Number(serverFinalPayable)) &&
    Number(serverFinalPayable) >= 0
  ) ? Number(serverFinalPayable) : finalPayable;



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
        let actualError = 'Payment verification failed on the server.';
        if (verifyErr && verifyErr.context && typeof verifyErr.context.clone === 'function') {
          try {
            const errBody = await verifyErr.context.clone().json();
            actualError = errBody.error || actualError;
            console.error("Checkout Edge Function verify response:", errBody);
          } catch (e) {}
        } else if (verifyErr) {
          actualError = verifyErr.message;
        } else if (verifyData && verifyData.error) {
          actualError = verifyData.error;
        }
        throw new Error(actualError);
      }

      setPaymentId(razorpayPaymentId);
      // 9. Clear saved checkout data only after successful checkout completes
      sessionStorage.removeItem('checkoutData');
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      updateLead({
        p_current_step: 'payment_success'
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



      if (tripDetails.travellers > 1) {
        if (!primaryTravellerSharing) {
          throw new Error('Please select Room Sharing for the Primary Traveller.');
        }
        
        // Strict frontend validation of total room sharing
        const sharingCounts = { ...sharingAllocation };
        sharingCounts[primaryTravellerSharing] = (sharingCounts[primaryTravellerSharing] || 0) - 1;
        
        for (const t of additionalTravellers) {
          if (!t.gender || !t.sharingType) {
            throw new Error('Please select Gender and Room Sharing for all additional travellers.');
          }
          sharingCounts[t.sharingType] = (sharingCounts[t.sharingType] || 0) - 1;
        }
        
        for (const key of Object.keys(sharingCounts)) {
          if (sharingCounts[key] !== 0) {
            throw new Error('Traveller-level sharing assignments do not match the Overall Room Sharing count.');
          }
        }
      }
      const currentPayload = JSON.stringify({
        travelDate: formData?.date,
        travellers: tripDetails?.travellers,
        selectedSharing,
        sharingAllocation,
        additionalTravellers,
        primaryTravellerSharing,
        specialRequest: formData?.specialRequest
      });
      sessionStorage.setItem('tripomist_last_payload', currentPayload);
      
      let currentBookingId = bookingId;
      let currentIdempotencyKey = idempotencyKey;

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

      // 3. On checkout always call Edge action initialize to ensure backend price calculates correctly
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
          sharingAllocation,
          additionalTravellers,
          primaryTravellerSharing,
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
        let actualError = 'Unknown initialize error';
        if (initErr && initErr.context && typeof initErr.context.clone === 'function') {
          try {
            const errBody = await initErr.context.clone().json();
            actualError = errBody.error || actualError;
            console.error("Checkout Edge Function response:", errBody);
          } catch (e) {}
        } else if (initErr) {
          actualError = initErr.message;
        } else if (initData && initData.error) {
          actualError = initData.error;
        }
        console.error("Initialize failed:", {initErr, initData});
        if (actualError === 'Unauthorized: missing token session or active lead authentication') {
          throw new Error('Your booking session has expired. Please verify your details again.');
        }
        if (actualError.includes('Idempotency conflict')) {
          const newKey = crypto.randomUUID();
          setIdempotencyKey(newKey);
          setBookingId('');
          try {
            const storedData = sessionStorage.getItem('checkoutData');
            if (storedData) {
              const parsed = JSON.parse(storedData);
              parsed.idempotencyKey = newKey;
              sessionStorage.setItem('checkoutData', JSON.stringify(parsed));
            }
          } catch (e) {}
          throw new Error('Your booking details changed. Please try payment again.');
        }
        throw new Error(`Failed to initialize booking transaction. Reason: ${actualError}`);
      }

      currentBookingId = initData.bookingId;
      setBookingId(initData.bookingId);
      setServerFinalPayable(initData.finalPayableAmount);
      finalAmount = initData.finalPayableAmount;



      // 8. Otherwise call prepare and open Razorpay using returned order ID/amount
      const { data: prepareData, error: prepareErr } = await supabase.functions.invoke('razorpay-checkout', {
        body: {
          action: 'prepare',
          bookingId: currentBookingId,
          idempotencyKey: currentIdempotencyKey
        },
        headers
      });

      if (prepareErr || !prepareData || !prepareData.success) {
        let actualError = 'Unknown prepare error';
        if (prepareErr && prepareErr.context && typeof prepareErr.context.clone === 'function') {
          try {
            const errBody = await prepareErr.context.clone().json();
            actualError = errBody.error || actualError;
            console.error("Checkout Edge Function prepare response:", errBody);
          } catch (e) {}
        } else if (prepareErr) {
          actualError = prepareErr.message;
        } else if (prepareData && prepareData.error) {
          actualError = prepareData.error;
        }
        console.error("Prepare failed:", {prepareErr, prepareData});
        if (actualError.includes('Idempotency conflict')) {
          const newKey = crypto.randomUUID();
          setIdempotencyKey(newKey);
          setBookingId('');
          try {
            const storedData = sessionStorage.getItem('checkoutData');
            if (storedData) {
              const parsed = JSON.parse(storedData);
              parsed.idempotencyKey = newKey;
              sessionStorage.setItem('checkoutData', JSON.stringify(parsed));
            }
          } catch (e) {}
          throw new Error('Your booking details changed. Please try payment again.');
        }
        throw new Error(`Failed to prepare payment transaction order. Reason: ${actualError}`);
      }

      updateLead({
        p_current_step: 'razorpay_opened',
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
          color: '#01AFD1'
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
        console.error('Razorpay payment.failed:', {
          code: response.error?.code,
          description: response.error?.description,
          source: response.error?.source,
          step: response.error?.step,
          reason: response.error?.reason,
          metadata: response.error?.metadata
        });
        // 12. Razorpay close/failure par reservation release mat karo; retry message dikhao
        const errorDesc = response.error?.description || 'Please try again.';
        const errorReason = response.error?.reason ? ` Reason: ${response.error.reason}` : '';
        const errorCode = response.error?.code ? ` (${response.error.code})` : '';
        setError(`Payment failed: ${errorDesc}${errorReason}${errorCode}`);
        updateLead({
          p_current_step: 'payment_failed'
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
      <div className="flex flex-col min-h-screen bg-gray-50 ">
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
            <div className="bg-gradient-to-r from-[#01AFD1] to-teal-600 px-6 py-5 flex items-center gap-4">
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
                     <div className="w-8 h-8 bg-[#01AFD1]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                       <span className="material-symbols-outlined text-[#01AFD1] text-[18px]">{icon}</span>
                     </div>
                     <div className="min-w-0">
                       <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                       {badge === 'paid' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">✓ Paid</span>}
                       {badge === 'confirmed' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full border border-teal-200">✓ Confirmed</span>}
                       {!badge && <p className={`font-semibold ${highlight ? 'text-emerald-700 text-lg' : 'text-gray-900'} ${mono ? ' text-sm break-all' : ''}`}>{value}</p>}
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
                    className="bg-[#01AFD1] hover:bg-[#0092b3] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
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
                className="flex-1 bg-[#01AFD1] hover:bg-[#0092b3] text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
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
                    className="flex-1 bg-[#01AFD1] hover:bg-[#0092b3] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
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
      <div className="flex flex-col min-h-screen bg-surface-container-lowest ">
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
                className="w-full bg-[#01AFD1] hover:bg-[#0092b3] text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                Check My Trips
                <span className="material-symbols-outlined text-lg">luggage</span>
              </Link>
            )}
            {!paymentId && (
              <button onClick={() => { setStep('checkout'); setError(null); }} className="w-full bg-[#01AFD1] hover:bg-[#0092b3] text-white font-bold py-4 rounded-xl shadow-md transition-all">
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
    <div className="flex flex-col min-h-screen bg-surface-container-lowest ">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 mt-20">

        <div className="mb-8">
          <Link to={packageSlug && packageSlug !== 'custom-package' ? `/itinerary/${packageSlug}` : '/'} className="inline-flex items-center gap-2 text-[#01AFD1] hover:text-[#0092b3] font-semibold mb-4 transition-colors">
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
          {/* Left Column (70%) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Section 1: Primary Traveller Details */}
              <section className="p-6 md:p-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-[#01AFD1] text-2xl">person</span>
                  <h2 className="text-xl font-bold text-gray-900">Primary Traveller Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      readOnly={true}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Travel Date</label>
                    <input
                      type="date"
                      value={formData.date ? formData.date.split('T')[0] : ''}
                      onChange={(e) => {
                        if (e.target.value && !bookingId) {
                          setFormData({...formData, date: e.target.value});
                        }
                      }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#01AFD1] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors"
                      readOnly={!!bookingId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      readOnly={true}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly={true}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Travellers</label>
                    {!bookingId ? (
                      <div className="flex items-center gap-4 bg-white rounded-full border border-gray-200 px-4 py-2 w-max">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const val = Math.max(1, (tripDetails.travellers || 1) - 1);
                            setTripDetails(prev => ({...prev, travellers: val}));
                            const opt = sharingOptions.find(o => o.type === selectedSharing);
                            if (opt) setComputedPrice(opt.pricePerPerson * val);
                            setAdditionalTravellers(prev => prev.slice(0, Math.max(0, val - 1)));
                            setSharingAllocation(prev => {
                              let totalAssigned = Object.values(prev).reduce((a, b) => a + b, 0);
                              if (totalAssigned <= val) return prev;
                              let next = { ...prev };
                              for (let key of Object.keys(next)) {
                                while (next[key] > 0 && totalAssigned > val) {
                                  next[key] -= 1;
                                  totalAssigned -= 1;
                                }
                              }
                              return next;
                            });
                          }}
                          className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:text-[#01AFD1] hover:bg-gray-50 rounded-full transition-colors"
                        >−</button>
                        <span className="font-bold text-gray-900 text-sm w-4 text-center">{tripDetails.travellers || 1}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const current = tripDetails.travellers || 1;
                            if (current < 15) {
                              const val = current + 1;
                              setTripDetails(prev => ({...prev, travellers: val}));
                              const opt = sharingOptions.find(o => o.type === selectedSharing);
                              if (opt) setComputedPrice(opt.pricePerPerson * val);
                            }
                          }}
                          className={`w-6 h-6 flex items-center justify-center font-bold rounded-full transition-colors ${
                            tripDetails.travellers >= 15 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-600 hover:text-[#01AFD1] hover:bg-gray-50'
                          }`}
                        >+</button>
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={tripDetails.travellers}
                        readOnly={true}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                      />
                    )}
                    {tripDetails?.travellers >= 15 && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">For bookings of more than 15 travellers, please contact our travel expert.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Room Sharing</label>
                    <select
                      value={primaryTravellerSharing}
                      onChange={(e) => setPrimaryTravellerSharing(e.target.value)}
                      disabled={!!bookingId}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#01AFD1] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors"
                    >
                      <option value="">Select Sharing Type</option>
                      {Object.entries(sharingAllocation).filter(([k, v]) => v > 0).map(([k, v]) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Section 2: Additional Travellers */}
              {tripDetails?.travellers > 1 && (
                <section className="p-6 md:p-8 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#01AFD1] text-2xl">group</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Additional Travellers</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Added {additionalTravellers.filter(t => t.fullName && t.phone && t.email).length} of {Math.max(0, (tripDetails?.travellers || 1) - 1)}<br/>
                          {Math.max(0, (tripDetails?.travellers || 1) - 1 - additionalTravellers.filter(t => t.fullName && t.phone && t.email).length)} travellers left
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-4">
                    {additionalTravellers.map((traveller, index) => {
                      const isCompleted = traveller.fullName && traveller.phone && traveller.email && !traveller._isEditing;
                      return (
                        <div key={index} className={`rounded-sm border ${isCompleted ? 'border-gray-200 bg-white p-4' : 'border-[#01AFD1] bg-[#eff6f9] p-5 shadow-sm'}`}>
                          {isCompleted ? (
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-gray-900 mb-1">Traveller {index + 2}</p>
                                <p className="text-sm font-semibold text-gray-700">{traveller.fullName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{traveller.phone} • {traveller.email}</p>
                                {traveller.gender && traveller.sharingType && (
                                  <p className="text-xs text-gray-600 mt-1 font-medium bg-gray-100 px-2 py-0.5 rounded inline-block">
                                    {traveller.gender} • {traveller.sharingType}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newArr = [...additionalTravellers];
                                  newArr[index]._isEditing = true;
                                  setAdditionalTravellers(newArr);
                                }}
                                className="text-[#01AFD1] hover:text-[#0092b3] font-semibold text-sm flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                Edit
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 text-sm">Traveller {index + 2} Details</h3>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newArr = [...additionalTravellers];
                                    if (!traveller.fullName && !traveller.phone && !traveller.email) {
                                      newArr.splice(index, 1);
                                    } else {
                                      newArr[index]._isEditing = false;
                                    }
                                    setAdditionalTravellers(newArr);
                                  }}
                                  className="text-gray-500 hover:text-gray-700 text-xs font-semibold flex items-center gap-1"
                                >
                                  Cancel
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                                  <input
                                    type="text"
                                    value={traveller.fullName || ''}
                                    onChange={(e) => {
                                      const newArr = [...additionalTravellers];
                                      newArr[index].fullName = e.target.value;
                                      setAdditionalTravellers(newArr);
                                    }}
                                    className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#01AFD1] outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone No. (WhatsApp)</label>
                                  <input
                                    type="tel"
                                    value={traveller.phone || ''}
                                    onChange={(e) => {
                                      // Force exactly 10 digits
                                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                      const newArr = [...additionalTravellers];
                                      newArr[index].phone = val;
                                      setAdditionalTravellers(newArr);
                                    }}
                                    className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#01AFD1] outline-none"
                                  />
                                  {traveller.phone && traveller.phone.length < 10 && (
                                    <p className="text-[10px] text-red-500 mt-1">Enter a valid 10-digit WhatsApp number.</p>
                                  )}
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                                  <input
                                    type="email"
                                    value={traveller.email || ''}
                                    onChange={(e) => {
                                      const newArr = [...additionalTravellers];
                                      newArr[index].email = e.target.value.toLowerCase().trim();
                                      setAdditionalTravellers(newArr);
                                    }}
                                    className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#01AFD1] outline-none"
                                  />
                                  {traveller.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(traveller.email) && (
                                    <p className="text-[10px] text-red-500 mt-1">Enter a valid email address.</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                                  <select
                                    value={traveller.gender || ''}
                                    onChange={(e) => {
                                      const newArr = [...additionalTravellers];
                                      newArr[index].gender = e.target.value;
                                      setAdditionalTravellers(newArr);
                                    }}
                                    className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#01AFD1] outline-none"
                                  >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Room Sharing</label>
                                  <select
                                    value={traveller.sharingType || ''}
                                    onChange={(e) => {
                                      const newArr = [...additionalTravellers];
                                      newArr[index].sharingType = e.target.value;
                                      setAdditionalTravellers(newArr);
                                    }}
                                    className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#01AFD1] outline-none"
                                  >
                                    <option value="">Select Sharing Type</option>
                                    {Object.entries(sharingAllocation).filter(([k, v]) => v > 0).map(([k, v]) => (
                                      <option key={k} value={k}>{k}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="mt-4 flex justify-end">
                                <button
                                  type="button"
                                  disabled={!traveller.fullName || !traveller.phone || traveller.phone.length !== 10 || !traveller.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(traveller.email) || !traveller.gender || !traveller.sharingType}
                                  onClick={() => {
                                    const newArr = [...additionalTravellers];
                                    newArr[index]._isEditing = false;
                                    setAdditionalTravellers(newArr);
                                  }}
                                  className="bg-[#01AFD1] hover:bg-[#0092b3] disabled:bg-gray-300 text-white px-4 py-2 rounded-sm text-sm font-bold transition-colors"
                                >
                                  Save Traveller
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {additionalTravellers.length < Math.max(0, (tripDetails?.travellers || 1) - 1) && !additionalTravellers.some(t => t._isEditing) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdditionalTravellers([...additionalTravellers, { fullName: '', phone: '', email: '', _isEditing: true }]);
                      }}
                      className="w-full border border-dashed border-gray-300 rounded-sm py-3 text-[#01AFD1] hover:bg-gray-50 font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <span className="material-symbols-outlined text-[20px]">add</span>
                      {additionalTravellers.length === 0 ? 'Add Traveller' : 'Add Another Traveller'}
                    </button>
                  )}
                </section>
              )}

              {/* Section 3: Room Sharing */}
              <section className="p-6 md:p-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-[#01AFD1] text-2xl">bed</span>
                  <h2 className="text-xl font-bold text-gray-900">Room Sharing</h2>
                </div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 text-sm font-medium text-gray-600">
                  <p>Allocate sharing for travellers</p>
                  <div className="flex items-center gap-2">
                    Total: {tripDetails?.travellers || 1} <span className="mx-2">•</span> Assigned: {Object.values(sharingAllocation).reduce((a,b)=>a+b,0)} <span className="mx-2">•</span> Left: {Math.max(0, (tripDetails?.travellers || 1) - Object.values(sharingAllocation).reduce((a,b)=>a+b,0))}
                  </div>
                </div>

                <div className="space-y-4">
                  {sharingOptions.map((option) => {
                    const pricePerPerson = Number(option.pricePerPerson ?? option.price ?? 0);
                    if (!Number.isFinite(pricePerPerson) || pricePerPerson <= 0) return null;
                    const isOccupancyDisabled = !!bookingId;
                    
                    return (
                      <div key={option.type} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border border-gray-100 rounded-sm bg-gray-50 hover:bg-white transition-colors gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900">{option.label}</h3>
                          <p className="text-sm font-semibold text-[#01AFD1]">₹{formatMoney(pricePerPerson)} <span className="text-gray-500 font-normal">/ person</span></p>
                        </div>
                        
                        {!isOccupancyDisabled && (
                          <div className="flex items-center gap-4 bg-white rounded-full border border-gray-200 px-3 py-1">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); handleAllocationChange(option.label || option.type, -1); }}
                              className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:text-[#01AFD1] hover:bg-gray-50 rounded-full transition-colors"
                            >−</button>
                            <span className="font-bold text-gray-900 text-sm w-4 text-center">{sharingAllocation[option.label || option.type] || 0}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); handleAllocationChange(option.label || option.type, 1); }}
                              disabled={Object.values(sharingAllocation).reduce((a,b)=>a+b,0) >= (tripDetails?.travellers || 1)}
                              className={`w-6 h-6 flex items-center justify-center font-bold rounded-full transition-colors ${
                                Object.values(sharingAllocation).reduce((a,b)=>a+b,0) >= (tripDetails?.travellers || 1)
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:text-[#01AFD1] hover:bg-gray-50'
                              }`}
                            >+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Section 4: Special Request */}
              <section className="p-6 md:p-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Special Request (Optional)</label>
                <textarea
                  value={formData.specialRequest || ''}
                  readOnly={!!bookingId}
                  onChange={(e) => setFormData({...formData, specialRequest: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#01AFD1] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  rows="3"
                  placeholder="Any dietary requirements or special requests..."
                ></textarea>
              </section>
            </div>
          </div>

          {/* Right Column (30%) - Sticky Payment Summary */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-[100px] bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Package Summary</h2>

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
                  <span>Subtotal ({tripDetails.travellers} A- ₹{formatMoney(computedPrice / travellerCount)})</span>
                  <span>₹{formatMoney(subTotal)}</span>
                </div>
                {gstEnabled && (
                  <div className="flex justify-between text-gray-600 font-medium text-sm">
                    <span>Taxes (GST 5%)</span>
                    <span>₹{formatMoney(gst)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end mb-8 pt-2">
                <div>
                  <span className="font-bold text-gray-900 text-base block mb-0.5">Total Payable</span>
                </div>
                <span className="font-extrabold text-[#01AFD1] text-2xl">₹{formatMoney(safeFinalPayable)}</span>
              </div>

              <button
                onClick={(e) => {
                  const neededAdditional = Math.max(0, (tripDetails?.travellers || 1) - 1);
                  const validAdditional = additionalTravellers.filter(t => t.fullName && t.phone && t.email).length;
                  const totalAssigned = Object.values(sharingAllocation).reduce((a,b) => a+b, 0);
                  const targetAssigned = tripDetails?.travellers || 1;
                  
                  if (neededAdditional > 0 && validAdditional !== neededAdditional) {
                    setError('Please add the remaining traveller details before payment.');
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                    return;
                  }
                  
                  if (totalAssigned !== targetAssigned) {
                    setError('Please assign room sharing for all travellers.');
                    window.scrollTo({ top: 500, behavior: 'smooth' });
                    return;
                  }
                  
                  handleProceedToPayment(e);
                }}
                disabled={loading || checkoutBlocked || (tripDetails?.travellers > 15)}
                className="w-full bg-[#01AFD1] hover:bg-[#0092b3] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[22px]">lock</span>
                    Payment
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
