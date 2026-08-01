import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

async function verifyHmacSha256(secret: string, data: Uint8Array, signature: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const keyBuf = encoder.encode(secret)
  
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
  
  return await crypto.subtle.verify('HMAC', key, sigBuf, data)
}

serve(async (req) => {
  // 1. POST only; no user JWT and no CORS
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const signature = req.headers.get('X-Razorpay-Signature')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Signature missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 4. Reject malformed/non-64-character hex signatures (regex checks for exactly 64 hex characters)
    if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
      return new Response(JSON.stringify({ error: 'Malformed signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') ?? ''
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''

    if (!webhookSecret || !supabaseUrl || !supabaseServiceKey || !razorpayKeyId || !razorpayKeySecret) {
      return new Response(JSON.stringify({ error: 'System configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Read raw request body before JSON parsing to preserve exact payload bytes for HMAC verification
    const rawBody = await req.arrayBuffer()
    const rawBodyBytes = new Uint8Array(rawBody)

    // 3. Verify X-Razorpay-Signature using secret and subtle verify
    const isSignatureValid = await verifyHmacSha256(webhookSecret, rawBodyBytes, signature)
    if (!isSignatureValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature verification' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse verified payload
    const textDecoder = new TextDecoder()
    const bodyText = textDecoder.decode(rawBodyBytes)
    const payload = JSON.parse(bodyText)
    const event = payload.event

    // 5. Handle payment.captured and order.paid idempotently
    if (event !== 'payment.captured' && event !== 'order.paid') {
      return new Response(JSON.stringify({ success: true, message: 'Event ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let orderId = ''
    let paymentId = ''

    if (event === 'payment.captured') {
      paymentId = payload.payload.payment.entity.id
      orderId = payload.payload.payment.entity.order_id
    } else if (event === 'order.paid') {
      orderId = payload.payload.order.entity.id
      // In order.paid we fetch payment directly below
    }

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order reference not found in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Initialize Database Admin client using service_role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // 6. Find payment_attempt using database razorpay_order_id
    const { data: attempt, error: attemptErr } = await adminClient
      .from('payment_attempts')
      .select('id, expected_amount_paise')
      .eq('razorpay_order_id', orderId)
      .single()

    if (attemptErr || !attempt) {
      return new Response(JSON.stringify({ error: 'Payment attempt record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // For order.paid event, extract or fetch the capture payment details
    if (event === 'order.paid' && !paymentId) {
      // Query Razorpay API to list payments for this order
      const paymentsResponse = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
      })

      if (!paymentsResponse.ok) {
        return new Response(JSON.stringify({ error: 'Unable to fetch order payments from gateway' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const paymentsList = await paymentsResponse.json()
      const capturedPayment = paymentsList.items?.find((p: any) => p.status === 'captured')
      if (!capturedPayment) {
        return new Response(JSON.stringify({ error: 'No captured payments found for this order' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      paymentId = capturedPayment.id
    }

    // 7. Fetch payment from Razorpay API and require captured, matching order, exact amount and INR
    const verifyResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
    })

    if (!verifyResponse.ok) {
      return new Response(JSON.stringify({ error: 'Unable to verify payment status with gateway API' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const paymentInfo = await verifyResponse.json()

    if (paymentInfo.status !== 'captured') {
      return new Response(JSON.stringify({ error: 'Payment status verification failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (paymentInfo.order_id !== orderId) {
      return new Response(JSON.stringify({ error: 'Payment order alignment mismatch' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (paymentInfo.amount !== attempt.expected_amount_paise || paymentInfo.currency !== 'INR') {
      return new Response(JSON.stringify({ error: 'Payment financial metadata mismatch' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 8. Call finalize_verified_payment RPC
    const { data: finalizeData, error: finalizeError } = await adminClient.rpc('finalize_verified_payment', {
      p_payment_attempt_id: attempt.id,
      p_razorpay_order_id: orderId,
      p_razorpay_payment_id: paymentId,
      p_amount_paise: paymentInfo.amount,
      p_currency: 'INR',
    })

    if (finalizeError || !finalizeData || !finalizeData.success) {
      return new Response(JSON.stringify({ error: 'Failed to record finalized transaction' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      bookingId: finalizeData.booking_id,
      paymentStatus: finalizeData.payment_status,
      redemptionId: finalizeData.redemption_id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    // 10. Never expose raw error messages
    return new Response(JSON.stringify({ error: 'Server error processing request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
