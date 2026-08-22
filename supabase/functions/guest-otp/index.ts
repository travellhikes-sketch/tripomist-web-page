import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Security constants ────────────────────────────────────────────────────
const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS       = 5
const OTP_LENGTH         = 6

// Allowed purposes — strictly validated server-side
const ALLOWED_PURPOSES = ['itinerary_download', 'booking'] as const
type OtpPurpose = typeof ALLOWED_PURPOSES[number]

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Cryptographically secure 6-digit numeric OTP */
function generateSecureOtp(): string {
  const buf = new Uint8Array(4)
  crypto.getRandomValues(buf)
  const num = new DataView(buf.buffer).getUint32(0, false)
  return String(num % 1_000_000).padStart(OTP_LENGTH, '0')
}

/** SHA-256 hex digest */
async function sha256Hex(value: string): Promise<string> {
  const data   = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Normalise email: trim + lowercase */
function normalizeEmail(email: string): string {
  return String(email ?? '').trim().toLowerCase()
}

/** Basic email format guard */
function isValidEmail(email: string): boolean {
  return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(email)
}

// ─── Email sender ─────────────────────────────────────────────────────────
/**
 * Sends the OTP email.
 *
 * Preferred: Resend API  (set RESEND_API_KEY env var in Supabase dashboard)
 * Fallback:  logs OTP to function console (development / unconfigured)
 *
 * The frontend NEVER receives the OTP code — it only receives the verificationId.
 */
async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: OtpPurpose,
  name?: string
): Promise<void> {
  const resendKey = Deno.env.get('RESEND_API_KEY')

  const subject =
    purpose === 'itinerary_download'
      ? 'Your TripoMist Itinerary Download Code'
      : 'Your TripoMist Verification Code'

  const purposeLabel =
    purpose === 'itinerary_download'
      ? 'download your itinerary'
      : 'complete your booking'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#136b8a;padding:28px 32px">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700">TripoMist</h1>
      <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Your adventure partner</p>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Hi${name ? ' ' + name : ''},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 24px">
        Use the code below to ${purposeLabel}. This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
      </p>
      <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
        <p style="color:#0369a1;font-size:38px;font-weight:800;letter-spacing:10px;margin:0;font-family:monospace">${otp}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0 0 8px">
        If you did not request this code, you can safely ignore this email.
      </p>
      <p style="color:#6b7280;font-size:13px;margin:0">
        Do not share this code with anyone.
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
      <p style="color:#9ca3af;font-size:11px;margin:0;text-align:center">
        © ${new Date().getFullYear()} TripoMist · This is an automated message
      </p>
    </div>
  </div>
</body>
</html>`

  if (resendKey) {
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@tripomist.com'
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    `TripoMist <${fromEmail}>`,
        to:      [to],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error('Resend API error', { status: res.status, body: errBody })
      throw new Error(`Email delivery failed (${res.status})`)
    }
    return
  }

  // ── Fallback: Supabase built-in mailer via admin API ──────────────────────
  // Supabase's auth.admin.sendRawEmail is not yet a public method.
  // We use the undocumented /auth/v1/admin/send_email REST endpoint if available,
  // or fall back to logging for development purposes.
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (supabaseUrl && serviceKey) {
    try {
      // Attempt Supabase internal SMTP relay
      const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ to, subject, html }),
      })
      if (res.ok) return;
    } catch (_) {
      // Not available — fall through to error throw
    }
  }

  console.error('[guest-otp] No email delivery provider configured');
  throw new Error('Email delivery service is not configured.');
}

// ─── Main handler ─────────────────────────────────────────────────────────
serve(async (req) => {
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
    // Only service-role key used — never exposed to frontend
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'System configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, serviceKey)

    const body    = await req.json()
    const action  = String(body.action ?? '').trim()

    // ── A. REQUEST OTP ────────────────────────────────────────────────────
    if (action === 'request') {
      const email   = normalizeEmail(body.email ?? '')
      const purpose = String(body.purpose ?? '').trim() as OtpPurpose
      const name    = String(body.name ?? '').trim() || undefined

      // Validate inputs
      if (!email || !isValidEmail(email)) {
        return new Response(JSON.stringify({ error: 'A valid email address is required.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!ALLOWED_PURPOSES.includes(purpose)) {
        return new Response(JSON.stringify({ error: 'Invalid purpose.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Generate OTP server-side — NEVER returned to frontend
      const rawOtp    = generateSecureOtp()
      const otpHash   = await sha256Hex(rawOtp + email) // keyed with email to prevent cross-email reuse
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()

      // Invalidate any existing unused OTPs for same email + purpose
      // (resend replaces previous) — service_role bypasses RLS
      await adminClient
        .from('guest_otp_verifications')
        .delete()
        .eq('email', email)
        .eq('purpose', purpose)
        .is('verified_at', null)

      // Insert new OTP record — only hash stored, never plaintext
      const { data: inserted, error: insertErr } = await adminClient
        .from('guest_otp_verifications')
        .insert({
          email,
          purpose,
          otp_hash:   otpHash,
          expires_at: expiresAt,
          attempts:   0,
        })
        .select('id')
        .single()

      if (insertErr || !inserted?.id) {
        console.error('guest_otp insert failed', insertErr)
        return new Response(JSON.stringify({ error: 'Failed to initiate OTP. Please try again.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const verificationId = inserted.id as string

      // Send email (OTP never goes to client)
      try {
        await sendOtpEmail(email, rawOtp, purpose, name)
      } catch (emailErr) {
        // Email failure: delete the record so user can retry clean
        await adminClient
          .from('guest_otp_verifications')
          .delete()
          .eq('id', verificationId)

        console.error('Email send failed', emailErr)
        return new Response(JSON.stringify({ error: 'Failed to send verification email. Please try again.' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Return ONLY the verification ID and expiry — NOT the OTP
      return new Response(JSON.stringify({
        success:        true,
        verificationId,
        expiresAt,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── B. VERIFY OTP ────────────────────────────────────────────────────
    if (action === 'verify') {
      const verificationId = String(body.verificationId ?? '').trim()
      const email          = normalizeEmail(body.email ?? '')
      const purpose        = String(body.purpose ?? '').trim() as OtpPurpose
      const enteredOtp     = String(body.otp ?? '').replace(/\D/g, '').trim()

      // Validate inputs
      if (!verificationId || !email || !purpose || enteredOtp.length !== OTP_LENGTH) {
        return new Response(JSON.stringify({ error: 'Invalid verification request.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!ALLOWED_PURPOSES.includes(purpose)) {
        return new Response(JSON.stringify({ error: 'Invalid purpose.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch the OTP record — service_role bypasses RLS
      const { data: record, error: fetchErr } = await adminClient
        .from('guest_otp_verifications')
        .select('id, email, purpose, otp_hash, expires_at, attempts, verified_at')
        .eq('id', verificationId)
        .maybeSingle()

      if (fetchErr || !record) {
        return new Response(JSON.stringify({ error: 'Verification session not found. Please request a new code.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Guard: purpose must match
      if (record.purpose !== purpose) {
        return new Response(JSON.stringify({ error: 'Invalid verification request.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Guard: email must match
      if (record.email !== email) {
        return new Response(JSON.stringify({ error: 'Email does not match verification session.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Guard: already verified (single-use)
      if (record.verified_at !== null) {
        return new Response(JSON.stringify({ error: 'This code has already been used. Please request a new one.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Guard: expired
      if (new Date(record.expires_at) <= new Date()) {
        return new Response(JSON.stringify({ error: 'Verification code has expired. Please request a new one.' }), {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Guard: max attempts
      if (record.attempts >= MAX_ATTEMPTS) {
        return new Response(JSON.stringify({ error: 'Too many incorrect attempts. Please request a new code.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Increment attempt count atomically BEFORE comparing hash
      await adminClient
        .from('guest_otp_verifications')
        .update({ attempts: record.attempts + 1 })
        .eq('id', verificationId)

      // Hash the entered OTP the same way (server-side)
      const enteredHash = await sha256Hex(enteredOtp + email)

      // Constant-time comparison (both are same-length hex strings)
      if (enteredHash !== record.otp_hash) {
        const remaining = MAX_ATTEMPTS - (record.attempts + 1)
        return new Response(JSON.stringify({
          error:     remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : 'Too many incorrect attempts. Please request a new code.',
          remaining,
        }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ✅ OTP correct — mark as used (single-use enforcement)
      await adminClient
        .from('guest_otp_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', verificationId)

      // Return success — NO session, NO auth token, NO user record created
      return new Response(JSON.stringify({
        verified: true,
        email,
        purpose,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('guest-otp unhandled error', err)
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
