import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-checkout-lead-id, x-checkout-lead-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckoutRequest {
  action: 'initialize' | 'prepare' | 'verify' | 'reserve_coupon' | 'full_coupon' | 'checkout_status'
  packageId?: number
  travelDate?: string
  travellers?: number
  selectedSharing?: string
  idempotencyKey?: string
  specialRequest?: string
  source?: string
  bookingId?: string
  couponCode?: string
  reservationId?: string
  paymentAttemptId?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}

async function verifyHmacSha256(secret: string, data: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const keyBuf = encoder.encode(secret)
  const dataBuf = encoder.encode(data)
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  
  // Convert hex signature to ArrayBuffer
  const sigBuf = new Uint8Array(
    signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  )
  
  return await crypto.subtle.verify('HMAC', key, sigBuf, dataBuf)
}

async function computeHmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyBuf = encoder.encode(secret)
  const msgBuf = encoder.encode(message)
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const sigBuf = await crypto.subtle.sign('HMAC', key, msgBuf)
  return Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

serve(async (req) => {
  // 8. Only POST and OPTIONS allowed
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const leadIdHeader = req.headers.get('x-checkout-lead-id')
    const leadTokenHeader = req.headers.get('x-checkout-lead-token')

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'System configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate user if Authorization header exists
    let user = null
    if (authHeader) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user: u }, error: userError } = await userClient.auth.getUser()
      if (!userError && u) {
        user = u
      }
    }

    // Parse payload
    const body: CheckoutRequest = await req.json()
    const { action } = body

    if (action === 'create_guest_lead') {
      // Read all fields sent by BookingModal using p_ prefix keys
      const rawName  = (body as any).p_customer_name ?? ''
      const rawPhone = (body as any).p_phone ?? ''
      const rawEmail = (body as any).p_email ?? ''
      const pPackageTitle   = (body as any).p_package_title ?? null
      const pDestination    = (body as any).p_destination ?? null
      const pTravelDate     = (body as any).p_travel_date ?? null
      const pTravellers     = (body as any).p_travellers ?? null
      const pEstimatedAmt   = (body as any).p_estimated_amount ?? null
      const pSource         = (body as any).p_source ?? null
      const pSpecialRequest = (body as any).p_special_request ?? null
      const pSelectedSharing = (body as any).p_selected_sharing ?? (body as any).selected_sharing ?? (body as any).selectedSharing ?? null

      const rawPackageReference = (body as any).p_package_id as unknown;
      const packageReference = String(rawPackageReference ?? '').trim();

      let packageId: number | null = null;

      if (/^\d+$/.test(packageReference)) {
        const parsedId = Number(packageReference);
        if (Number.isSafeInteger(parsedId) && parsedId > 0) {
          packageId = parsedId;
        }
      }

      if (packageId === null && packageReference !== '') {
        const { data: packageRow, error: packageLookupError } =
          await adminClient
            .from('Pakage')
            .select('id, title, destination')
            .ilike('slug', packageReference)
            .maybeSingle();

        if (packageLookupError || !packageRow || !packageRow.id) {
          return new Response(
            JSON.stringify({ error: "Package configuration could not be resolved" }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
            }
          );
        }
        packageId = packageRow.id;
      }

      if (packageId === null || !Number.isSafeInteger(packageId) || packageId <= 0) {
        return new Response(
          JSON.stringify({ error: "Package configuration could not be resolved" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
          }
        );
      }

      // Normalize
      const normName  = String(rawName).trim()
      const normEmail = String(rawEmail).trim().toLowerCase()
      
      // Normalize Indian 10-digit phone to +91XXXXXXXXXX; accept valid existing E.164 numbers
      let normPhone = String(rawPhone).trim()
      const digitsOnly = normPhone.replace(/\D/g, '')
      if (digitsOnly.length === 10) {
        normPhone = `+91${digitsOnly}`
      } else if (normPhone.startsWith('+')) {
        normPhone = `+${digitsOnly}`
      } else {
        normPhone = `+${digitsOnly}`
      }

      // Validate
      if (!normName || normName.length < 2) {
        return new Response(JSON.stringify({ error: 'Full name is required (min 2 characters).' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!normPhone || !/^\+[1-9]\d{7,14}$/.test(normPhone)) {
        return new Response(JSON.stringify({ error: 'A valid phone number (e.g. +91XXXXXXXXXX) is required.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!normEmail || !/^[a-z0-9._%-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(normEmail)) {
        return new Response(JSON.stringify({ error: 'A valid email address is required.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch salt
      const rateLimitSalt = Deno.env.get('LEAD_RATE_LIMIT_SALT') ?? ''
      if (!rateLimitSalt) {
        return new Response(JSON.stringify({ error: 'System configuration error: salt missing' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get trusted Edge IP
      const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1'

      // Hash inputs using HMAC-SHA256
      const ipHash = await computeHmacSha256(rateLimitSalt, clientIp)
      const phoneHash = await computeHmacSha256(rateLimitSalt, normPhone)
      const emailHash = await computeHmacSha256(rateLimitSalt, normEmail)

      // Consume rate limits atomically in database
      const { error: rateLimitError } = await adminClient.rpc('consume_guest_lead_rate_limit', {
        p_ip_hash: ipHash,
        p_phone_hash: phoneHash,
        p_email_hash: emailHash
      })

      if (rateLimitError) {
        const message = String(rateLimitError.message || '');
        const isRealRateLimit =
          rateLimitError.code === 'P0001' &&
          message.includes('Guest lead rate limit exceeded');

        console.error('Guest lead rate-limit RPC error', {
          code: rateLimitError.code,
          message: rateLimitError.message,
          details: rateLimitError.details,
          hint: rateLimitError.hint,
        });

        if (isRealRateLimit) {
          return new Response(
            JSON.stringify({
              error: 'Too many checkout attempts. Please wait and retry.'
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
            }
          );
        }

        // Unexpected rate-limit infrastructure errors must not block lead creation.
        // Continue to create_checkout_lead below.
      }

      // Token flow: Generate a cryptographically secure 32-byte raw lead token
      const rawTokenBytes = new Uint8Array(32)
      crypto.getRandomValues(rawTokenBytes)
      // Convert it to lowercase hex
      const rawToken = Array.from(rawTokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

      // Calculate its SHA-256 lowercase hex hash
      const textEncoder = new TextEncoder()
      const tokenBytes = textEncoder.encode(rawToken)
      const hashBuffer = await crypto.subtle.digest('SHA-256', tokenBytes)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const clientTokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Call service-role create_checkout_lead RPC
      const { data: leadData, error: leadError } = await adminClient.rpc('create_checkout_lead', {
        p_customer_name: normName,
        p_phone: normPhone,
        p_email: normEmail,
        p_package_id: packageId,
        p_package_title: pPackageTitle,
        p_destination: pDestination,
        p_travel_date: pTravelDate,
        p_travellers: pTravellers,
        p_selected_sharing: pSelectedSharing,
        p_estimated_amount: pEstimatedAmt,
        p_source: pSource,
        p_special_request: pSpecialRequest,
        p_lead_token_hash: clientTokenHash,
      })

      const rawLeadToken = rawToken;
      const lead = Array.isArray(leadData) ? leadData[0] : leadData;
      const resolvedLeadId =
        lead?.id ??
        lead?.checkout_lead_id ??
        null;

      if (leadError) {
        console.error('create_checkout_lead RPC failed', {
          code: leadError.code,
          message: leadError.message,
          details: leadError.details,
          hint: leadError.hint,
        });

        return new Response(
          JSON.stringify({
            error: 'Failed to create checkout session'
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
          }
        );
      }

      if (!resolvedLeadId) {
        console.error('create_checkout_lead returned no lead ID', {
          responseKeys:
            lead && typeof lead === 'object'
              ? Object.keys(lead)
              : [],
        });

        return new Response(
          JSON.stringify({
            error: 'Failed to create checkout session'
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
          }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        leadId: resolvedLeadId,
        leadToken: rawLeadToken,
        leadNumber: lead?.lead_number ?? null,
        packageId: packageId,
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      });
    }
// Security: Edge Function must authorize every guest initialize/status/prepare/verify/release action using the checkout lead token.
    let guestAuthorized = false
    let currentLeadId = null
    let guestName = null
    let guestPhone = null
    let guestEmail = null

    if (!user && leadIdHeader && leadTokenHeader) {
      // Look up and verify checkout lead token
      const { data: leadData } = await adminClient
        .from('checkout_leads')
        .select('id, lead_token_hash, customer_name, phone, email, lead_status, created_at')
        .eq('id', leadIdHeader)
        .maybeSingle()

      if (leadData && leadData.lead_token_hash) {
        // Enforce token hash equality check
        const textEncoder = new TextEncoder()
        const tokenBytes = textEncoder.encode(leadTokenHeader)
        const hashBuffer = await crypto.subtle.digest('SHA-256', tokenBytes)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const clientTokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        if (leadData.lead_token_hash === clientTokenHash) {
          const now = new Date()
          // Expiry limit: 24 hours
          const createdAt = new Date(leadData.created_at)
          const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
          const isExpired = expiresAt <= now

          if (leadData.lead_status !== 'converted' && leadData.lead_status !== 'failed' && !isExpired) {
            guestAuthorized = true
            currentLeadId = leadData.id
            guestName = leadData.customer_name
            guestPhone = leadData.phone
            guestEmail = leadData.email
          }
        }
      }
    }

    if (!user && !guestAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token session or active lead authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'checkout_status') {
      const { idempotencyKey } = body
      if (!idempotencyKey) {
        return new Response(JSON.stringify({ error: 'Required payload arguments missing' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Find booking using idempotencyKey
      let query = adminClient
        .from('bookings')
        .select(`
          id,
          final_payable_amount,
          payment_status,
          travel_date,
          travellers,
          selected_sharing,
          special_request,
          sales_channel,
          razorpay_payment_id,
          user_id
        `)
        .eq('checkout_idempotency_key', idempotencyKey)

      if (user) {
        query = query.eq('user_id', user.id)
      } else {
        query = query.eq('checkout_lead_id', currentLeadId)
      }

      const { data: booking, error: bookingErr } = await query.maybeSingle()

      if (bookingErr) {
        return new Response(JSON.stringify({ error: 'Database error fetching status' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!booking) {
        return new Response(JSON.stringify({
          success: true,
          found: false,
          guestDetails: !user && guestAuthorized ? {
            fullName: guestName,
            phone: guestPhone,
            email: guestEmail
          } : null
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch active/recent reservation details
      const { data: reservations, error: reservationErr } = await adminClient
        .from('voucher_reservations')
        .select(`
          id,
          reserved_amount,
          status,
          expires_at,
          vouchers (
            code
          )
        `)
        .eq('booking_id', booking.id)
        .in('status', ['pending', 'payment_pending'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (reservationErr) {
        return new Response(JSON.stringify({ error: 'Database error fetching coupon status' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const activeReservation = reservations && reservations.length > 0 ? reservations[0] : null;
      const isExpired = activeReservation ? (new Date(activeReservation.expires_at) <= new Date()) : false;

      // Fetch latest payment-attempt status
      const { data: paymentAttempts, error: paymentAttemptErr } = await adminClient
        .from('payment_attempts')
        .select('status')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (paymentAttemptErr) {
        return new Response(JSON.stringify({ error: 'Database error fetching payment status' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const latestPaymentAttempt = paymentAttempts && paymentAttempts.length > 0 ? paymentAttempts[0] : null;

      return new Response(JSON.stringify({
        success: true,
        found: true,
        bookingId: booking.id,
        finalPayableAmount: booking.final_payable_amount,
        paymentStatus: booking.payment_status,
        paymentId: booking.razorpay_payment_id,
        travelDate: booking.travel_date,
        travellers: booking.travellers,
        selectedSharing: booking.selected_sharing,
        specialRequest: booking.special_request,
        guestDetails: !user && guestAuthorized ? {
          fullName: guestName,
          phone: guestPhone,
          email: guestEmail
        } : null,
        activeReservation: activeReservation ? {
          reservationId: activeReservation.id,
          reservedAmount: activeReservation.reserved_amount,
          status: activeReservation.status,
          expiresAt: activeReservation.expires_at,
          code: activeReservation.vouchers?.code,
          isExpired
        } : null,
        latestPaymentAttempt: latestPaymentAttempt ? {
          status: latestPaymentAttempt.status
        } : null
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'initialize') {
      const { packageId, travelDate, travellers, selectedSharing, idempotencyKey, specialRequest, source } = body
      if (!packageId || !travelDate || !travellers || !selectedSharing || !idempotencyKey) {
        return new Response(JSON.stringify({ error: 'Required payload arguments missing' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Invoke create_checkout_booking RPC
      const { data: initData, error: initError } = await adminClient.rpc('create_checkout_booking', {
        p_user_id: user ? user.id : null,
        p_package_id: packageId,
        p_travel_date: travelDate,
        p_travellers: travellers,
        p_selected_sharing: selectedSharing,
        p_checkout_idempotency_key: idempotencyKey,
        p_special_request: specialRequest || null,
        p_source: source || null,
        p_guest_name: !user ? guestName : null,
        p_guest_phone: !user ? guestPhone : null,
        p_guest_email: !user ? guestEmail : null,
        p_checkout_lead_id: currentLeadId
      })

      if (initError || !initData || !initData.success) {
        return new Response(JSON.stringify({ error: 'Failed to initialize booking transaction' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        bookingId: initData.booking_id,
        finalPayableAmount: initData.final_payable_amount
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'reserve_coupon') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: login required to reserve coupon' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { bookingId, couponCode } = body
      if (!bookingId || !couponCode) {
        return new Response(JSON.stringify({ error: 'Required reservation parameters missing' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify booking.user_id === logged-in user.id
      const { data: booking, error: bookingErr } = await adminClient
        .from('bookings')
        .select('user_id')
        .eq('id', bookingId)
        .single()

      if (bookingErr || !booking) {
        return new Response(JSON.stringify({ error: 'Booking transaction record not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (booking.user_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Access forbidden: user identity mismatch' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Call reserve_coupon_for_checkout (never accept discount amount from browser)
      const { data: couponData, error: couponError } = await adminClient.rpc('reserve_coupon_for_checkout', {
        p_booking_id: bookingId,
        p_coupon_code: couponCode
      })

      if (couponError || !couponData || !couponData.success) {
        return new Response(JSON.stringify({ error: 'Failed to reserve coupon balance' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        reservationId: couponData.reservation_id,
        reservedAmount: couponData.reserved_amount,
        finalPayableAmount: couponData.final_payable_amount,
        expiresAt: couponData.expires_at
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'full_coupon') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: login required to finalize coupon' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { bookingId, reservationId } = body
      if (!bookingId || !reservationId) {
        return new Response(JSON.stringify({ error: 'Required coupon finalization parameters missing' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify booking.user_id === logged-in user.id
      const { data: booking, error: bookingErr } = await adminClient
        .from('bookings')
        .select('user_id')
        .eq('id', bookingId)
        .single()

      if (bookingErr || !booking) {
        return new Response(JSON.stringify({ error: 'Booking transaction record not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (booking.user_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Access forbidden: user identity mismatch' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Call finalize_full_coupon_checkout
      const { data: finalizeData, error: finalizeError } = await adminClient.rpc('finalize_full_coupon_checkout', {
        p_booking_id: bookingId,
        p_reservation_id: reservationId
      })

      if (finalizeError || !finalizeData || !finalizeData.success) {
        return new Response(JSON.stringify({ error: 'Failed to finalize coupon checkout' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        bookingId: finalizeData.booking_id,
        paymentStatus: finalizeData.payment_status
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'prepare') {
      const { bookingId, idempotencyKey } = body
      if (!bookingId || !idempotencyKey) {
        return new Response(JSON.stringify({ error: 'Required payload arguments missing' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 1. Prepare se pehle booking ownership verify karo
      const { data: booking, error: bookingErr } = await adminClient
        .from('bookings')
        .select('user_id, checkout_lead_id')
        .eq('id', bookingId)
        .single()

      if (bookingErr || !booking) {
        return new Response(JSON.stringify({ error: 'Booking transaction record not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (booking.user_id !== null) {
        if (!user || booking.user_id !== user.id) {
          return new Response(JSON.stringify({ error: 'Access forbidden: user identity mismatch' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } else {
        // Guest booking: Must be guestAuthorized and lead_id must match
        if (!guestAuthorized || booking.checkout_lead_id !== currentLeadId) {
          return new Response(JSON.stringify({ error: 'Access forbidden: guest authorization mismatch' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      // Prepare payment attempt in database via RPC
      const { data: prepareData, error: prepareError } = await adminClient.rpc('prepare_payment_attempt', {
        p_booking_id: bookingId,
        p_idempotency_key: idempotencyKey,
        p_checkout_lead_id: currentLeadId
      })

      if (prepareError || !prepareData || !prepareData.success) {
        return new Response(JSON.stringify({ error: 'Failed to prepare payment transaction' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // In prepare, reuse existing order ONLY when status=order_created and razorpay_order_id exists.
      if (prepareData.status === 'order_created' && prepareData.razorpay_order_id) {
        return new Response(JSON.stringify({
          success: true,
          paymentAttemptId: prepareData.payment_attempt_id,
          receipt: prepareData.receipt,
          expectedAmountPaise: prepareData.expected_amount_paise,
          razorpayOrderId: prepareData.razorpay_order_id,
          status: prepareData.status,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // For verification_pending, return sanitized 409; do not open/create another order.
      if (prepareData.status === 'verification_pending') {
        return new Response(JSON.stringify({ error: 'Verification is currently pending. Please check status later.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // For preparing without claim_token, return sanitized 409 reconciliation error; do not create Razorpay order.
      if (prepareData.status === 'preparing' && !prepareData.claim_token) {
        return new Response(JSON.stringify({ error: 'Payment status is currently preparing. Verification required.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Create order only when status=preparing and claim_token exists.
      if (prepareData.status !== 'preparing' || !prepareData.claim_token) {
        return new Response(JSON.stringify({ error: 'Invalid payment attempt state' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch Razorpay credentials securely
      const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') ?? ''
      const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''

      if (!razorpayKeyId || !razorpayKeySecret) {
        return new Response(JSON.stringify({ error: 'Payment gateway configuration missing' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Create actual order in Razorpay
      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: prepareData.expected_amount_paise,
          currency: 'INR',
          receipt: prepareData.receipt,
        }),
      })

      if (!razorpayResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to create gateway checkout order' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const razorpayOrder = await razorpayResponse.json()

      // Validate Razorpay response: order id exists, amount matches expected_amount_paise, currency is INR.
      if (!razorpayOrder.id || razorpayOrder.amount !== prepareData.expected_amount_paise || razorpayOrder.currency !== 'INR') {
        return new Response(JSON.stringify({ error: 'Malformed order response received from payment gateway' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Register Razorpay Order ID to the locked attempt
      const { data: registerData, error: registerError } = await adminClient.rpc('mark_payment_order_created', {
        p_payment_attempt_id: prepareData.payment_attempt_id,
        p_claim_token: prepareData.claim_token,
        p_razorpay_order_id: razorpayOrder.id,
      })

      if (registerError || !registerData || !registerData.success) {
        return new Response(JSON.stringify({ error: 'Failed updating booking registration metadata' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        paymentAttemptId: prepareData.payment_attempt_id,
        receipt: prepareData.receipt,
        expectedAmountPaise: prepareData.expected_amount_paise,
        razorpayOrderId: razorpayOrder.id,
        status: 'order_created',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'verify') {
      const { paymentAttemptId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body
      if (!paymentAttemptId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return new Response(JSON.stringify({ error: 'Verification metadata missing' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch payment attempt to authenticate and obtain db order ID
      const { data: attempt, error: attemptErr } = await adminClient
        .from('payment_attempts')
        .select('user_id, checkout_lead_id, razorpay_order_id, expected_amount_paise')
        .eq('id', paymentAttemptId)
        .single()

      if (attemptErr || !attempt) {
        return new Response(JSON.stringify({ error: 'Payment attempt record not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 2. Verify se pehle payment_attempt ownership verify karo
      if (attempt.user_id !== null) {
        if (!user || attempt.user_id !== user.id) {
          return new Response(JSON.stringify({ error: 'Access forbidden: ownership mismatch' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } else {
        if (!guestAuthorized || attempt.checkout_lead_id !== currentLeadId) {
          return new Response(JSON.stringify({ error: 'Access forbidden: guest verification authorization mismatch' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      const dbOrderId = attempt.razorpay_order_id
      if (!dbOrderId) {
        return new Response(JSON.stringify({ error: 'No order registration exists for this checkout' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') ?? ''
      const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''

      if (!razorpayKeyId || !razorpayKeySecret) {
        return new Response(JSON.stringify({ error: 'Payment gateway configuration missing' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 3. HMAC mein database-stored razorpay_order_id use karo, frontend Order ID nahi
      // 4. Use crypto.subtle.verify for signature
      const isSignatureValid = await verifyHmacSha256(
        razorpayKeySecret,
        `${dbOrderId}|${razorpayPaymentId}`,
        razorpaySignature
      )

      if (!isSignatureValid) {
        return new Response(JSON.stringify({ error: 'Verification failed: invalid signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 6. Razorpay order fetch karo and verify status paid, correct amount, and INR
      const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${dbOrderId}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
      })

      if (!orderResponse.ok) {
        return new Response(JSON.stringify({ error: 'Unable to verify order details with gateway API' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const orderInfo = await orderResponse.json()
      if (orderInfo.status !== 'paid') {
        return new Response(JSON.stringify({ error: 'Checkout order has not been completed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (orderInfo.amount !== attempt.expected_amount_paise || orderInfo.currency !== 'INR') {
        return new Response(JSON.stringify({ error: 'Order financial metadata mismatch' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 5. Razorpay payment check: captured, correct order_id, amount and INR
      const verifyResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
      })

      if (!verifyResponse.ok) {
        return new Response(JSON.stringify({ error: 'Unable to verify payment status with gateway API' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const paymentInfo = await verifyResponse.json()

      if (paymentInfo.status !== 'captured') {
        return new Response(JSON.stringify({ error: 'Payment status verification failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (paymentInfo.order_id !== dbOrderId) {
        return new Response(JSON.stringify({ error: 'Payment order alignment mismatch' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (paymentInfo.amount !== attempt.expected_amount_paise || paymentInfo.currency !== 'INR') {
        return new Response(JSON.stringify({ error: 'Payment financial metadata mismatch' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Finalize verified payment status inside db using RPC
      const { data: finalizeData, error: finalizeError } = await adminClient.rpc('finalize_verified_payment', {
        p_payment_attempt_id: paymentAttemptId,
        p_razorpay_order_id: dbOrderId,
        p_razorpay_payment_id: razorpayPaymentId,
        p_amount_paise: paymentInfo.amount,
        p_currency: 'INR',
      })

      if (finalizeError || !finalizeData || !finalizeData.success) {
        return new Response(JSON.stringify({ error: 'Failed to record finalized transaction' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        bookingId: finalizeData.booking_id,
        paymentStatus: finalizeData.payment_status,
        redemptionId: finalizeData.redemption_id,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // update_guest_lead: requires verified lead headers; leadId in body must match currentLeadId from auth gate
    if (action === 'update_guest_lead') {
      // Must be guest-authorized (headers already verified above)
      if (!guestAuthorized || !currentLeadId) {
        return new Response(JSON.stringify({ error: 'Unauthorized: valid lead token headers required.' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const bodyLeadId = (body as any).leadId ?? (body as any).p_lead_id ?? null
      if (!bodyLeadId || bodyLeadId !== currentLeadId) {
        return new Response(JSON.stringify({ error: 'Forbidden: leadId does not match authenticated lead.' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Whitelist permitted update fields only — never accept financial or booking fields
      const FORBIDDEN_FIELDS = ['payment_status', 'booking_id', 'razorpay_payment_id']
      for (const f of FORBIDDEN_FIELDS) {
        if (f in (body as any)) {
          return new Response(JSON.stringify({ error: `Field '${f}' cannot be updated via this action.` }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }      // Only permit: current_step, selected_sharing, estimated_amount
      const pCurrentStep     = (body as any).p_current_step ?? (body as any).current_step ?? null
      const pSelectedSharing = (body as any).p_selected_sharing ?? (body as any).selected_sharing ?? null
      const pEstimatedAmount = (body as any).p_estimated_amount ?? (body as any).estimated_amount ?? null

      const { data: updateData, error: updateError } = await adminClient.rpc('update_checkout_lead', {
        p_lead_id: currentLeadId,
        p_lead_token: leadTokenHeader,
        p_current_step: pCurrentStep,
        p_selected_sharing: pSelectedSharing,
        p_estimated_amount: pEstimatedAmount,
      })
      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message || 'Failed to update guest lead.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // fallback unsupported action
    return new Response(JSON.stringify({ error: 'Unsupported action request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error processing request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
