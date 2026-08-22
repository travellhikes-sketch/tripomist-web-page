import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-checkout-lead-id, x-checkout-lead-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckoutRequest {
  action: 'initialize' | 'prepare' | 'verify' | 'checkout_status'
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

async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
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

// Security: Edge Function must authorize every guest initialize/status/prepare/verify/release action using the checkout lead token.
    let guestAuthorized = false
    let currentLeadId = null
    let guestName = null
    let guestPhone = null
    let guestEmail = null

    if (leadIdHeader && leadTokenHeader) {
      // Look up and verify checkout lead token
      const { data: leadData } = await adminClient
        .from('checkout_leads')
        .select('id, lead_token, customer_name, phone, email, lead_status, created_at')
        .eq('id', leadIdHeader)
        .maybeSingle()

      if (leadData && leadData.lead_token) {
        // Enforce token hash equality check
        const textEncoder = new TextEncoder()
        const tokenBytes = textEncoder.encode(leadTokenHeader)
        const hashBuffer = await crypto.subtle.digest('SHA-256', tokenBytes)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const clientTokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        if (leadData.lead_token === clientTokenHash) {
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



    if (action === 'create_guest_lead') {
      // Read all fields sent by BookingModal using p_ prefix keys
      const rawName  = (body as any).p_customer_name ?? ''
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
      let packageRow = null;

      if (/^\d+$/.test(packageReference)) {
        const parsedId = Number(packageReference);
        if (Number.isSafeInteger(parsedId) && parsedId > 0) {
          packageId = parsedId;
        }
      }

      if (packageId !== null && packageId > 0) {
        const { data, error } = await adminClient
          .from('Pakage')
          .select('id, title, destination')
          .eq('id', packageId)
          .maybeSingle();
        if (!error && data) packageRow = data;
      } else if (packageReference !== '') {
        const { data, error } = await adminClient
          .from('Pakage')
          .select('id, title, destination')
          .ilike('slug', packageReference)
          .maybeSingle();
        if (!error && data) packageRow = data;
      }

      if (!packageRow || !packageRow.id) {
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
      // Use authoritative DB values
      const securePackageTitle = packageRow.title || pPackageTitle;
      const secureDestination = packageRow.destination || pDestination;

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
      
      const rawPhone = String(body.p_phone ?? '');
      const phoneDigits = rawPhone.replace(/\D/g, '');

      const normalizedPhone =
        phoneDigits.length === 12 && phoneDigits.startsWith('91')
          ? phoneDigits.slice(2)
          : phoneDigits;

      if (!/^[0-9]{10}$/.test(normalizedPhone)) {
        return new Response(
          JSON.stringify({
            error: 'Please enter a valid 10-digit phone number'
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
          }
        );
      }

      // Validate
      if (!normName || normName.length < 2) {
        return new Response(JSON.stringify({ error: 'Full name is required (min 2 characters).' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!normEmail || !/^[a-z0-9._%-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(normEmail)) {
        return new Response(JSON.stringify({ error: 'A valid email address is required.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch salt
      const leadRateLimitSalt = Deno.env.get('LEAD_RATE_LIMIT_SALT') ?? ''
      if (!leadRateLimitSalt) {
        return new Response(JSON.stringify({ error: 'System configuration error: salt missing' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get trusted Edge IP
      const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1'

      // Hash inputs using HMAC-SHA256 and sha256Hex for phone
      const ipHash = await computeHmacSha256(leadRateLimitSalt, clientIp)
      const phoneHash = await sha256Hex(`${normalizedPhone}${leadRateLimitSalt}`)
      const emailHash = await computeHmacSha256(leadRateLimitSalt, normEmail)

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

      // Safe metadata logging before RPC
      console.info('Creating checkout lead', {
        phoneLength: normalizedPhone.length,
        hasPackageId: Number.isSafeInteger(packageId) && packageId > 0,
      });

      // Call service-role create_checkout_lead RPC
      const { data: leadData, error: leadError } = await adminClient.rpc('create_checkout_lead', {
        p_customer_name: normName,
        p_phone: normalizedPhone,
        p_email: normEmail,
        p_package_id: packageId,
        p_package_title: securePackageTitle,
        p_destination: secureDestination,
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
          action: 'create_guest_lead',
          authenticated: !!user,
          leadIdPresent: !!leadIdHeader,
          tokenPresent: !!leadTokenHeader,
          rpcName: 'create_checkout_lead',
          errorCode: leadError.code,
          errorMessage: leadError.message,
          errorDetails: leadError.details,
          errorHint: leadError.hint,
        });

        return new Response(
          JSON.stringify({
            error: 'lead_save_failed',
            action: 'create_guest_lead',
            code: leadError.code || 'unknown_error',
            message: leadError.message || 'Failed to create checkout session'
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

    if (action === 'update_guest_lead') {
      if (!leadIdHeader || !leadTokenHeader) {
        return new Response(JSON.stringify({ error: 'invalid_checkout_lead_auth' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Hash the incoming raw lead token using the EXISTING token hashing implementation.
      const textEncoder = new TextEncoder()
      const tokenBytes = textEncoder.encode(leadTokenHeader)
      const hashBuffer = await crypto.subtle.digest('SHA-256', tokenBytes)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const clientTokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Fetch the checkout lead securely.
      const { data: leadData } = await adminClient
        .from('checkout_leads')
        .select('id, lead_token')
        .eq('id', leadIdHeader)
        .maybeSingle()

      if (!leadData || !leadData.lead_token || leadData.lead_token !== clientTokenHash) {
        return new Response(JSON.stringify({ error: 'invalid_checkout_lead_auth' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const bodyLeadId = (body as any).leadId ?? (body as any).p_lead_id ?? null
      if (!bodyLeadId || bodyLeadId !== leadIdHeader) {
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
        p_lead_id: leadIdHeader,
        p_lead_token: clientTokenHash,
        p_current_step: pCurrentStep,
        p_selected_sharing: pSelectedSharing,
        p_estimated_amount: pEstimatedAmount,
      })
      if (updateError) {
        console.error('update_checkout_lead RPC failed', {
          action: 'update_guest_lead',
          authenticated: !!user,
          leadIdPresent: !!leadIdHeader,
          tokenPresent: !!leadTokenHeader,
          rpcName: 'update_checkout_lead',
          errorCode: updateError.code,
          errorMessage: updateError.message,
          errorDetails: updateError.details,
          errorHint: updateError.hint,
        });
        return new Response(JSON.stringify({
          error: 'lead_save_failed',
          action: 'update_guest_lead',
          code: updateError.code || 'unknown_error',
          message: updateError.message || 'Failed to update guest lead.'
        }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
