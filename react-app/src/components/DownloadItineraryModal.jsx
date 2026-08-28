import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

// ─── Secure server-side guest OTP helpers ────────────────────────────────────
// All OTP generation and verification happens in the 'guest-otp' Edge Function.
// The browser ONLY sends the entered digits + verificationId returned at request time.
// No OTP hash, no OTP value, and no auth session is ever stored client-side.

async function requestGuestOtp(email, name) {
  const { data, error } = await supabase.functions.invoke('guest-otp', {
    body: { action: 'request', email, purpose: 'itinerary_download', name }
  })
  if (error) throw new Error(error.message || 'Failed to send verification code.')
  if (!data?.verificationId) throw new Error('Failed to initiate verification.')
  return data.verificationId
}

async function verifyGuestOtp(verificationId, email, enteredOtp) {
  const { data, error } = await supabase.functions.invoke('guest-otp', {
    body: { action: 'verify', verificationId, email, purpose: 'itinerary_download', otp: enteredOtp }
  })
  if (error) {
    // Parse structured error from edge function response
    const msg = typeof error?.context === 'object'
      ? (await error.context.clone().json().catch(() => null))?.error
      : null
    throw new Error(msg || error.message || 'Verification failed.')
  }
  if (!data?.verified) throw new Error('Verification failed. Please try again.')
  return true
}
// ─────────────────────────────────────────────────────────────────────────────

function DownloadItineraryModal({ isOpen, onClose, tripTitle, pdfUrl, packageSlug }) {
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting]       = useState(false)
  const [error, setError]                     = useState(null)
  const [name, setName]                       = useState('')
  const [phone, setPhone]                     = useState('')
  const [email, setEmail]                     = useState('')
  const [callback, setCallback]               = useState(false)

  // OTP step state — only UX values, NO hashes, NO generated OTP
  const [showOtp, setShowOtp]                   = useState(false)
  const [verificationId, setVerificationId]     = useState(null)  // returned by server
  const [otpDigits, setOtpDigits]               = useState(['', '', '', '', '', ''])
  const [otpSending, setOtpSending]             = useState(false)
  const [otpVerifying, setOtpVerifying]         = useState(false)
  const [otpError, setOtpError]                 = useState(null)
  const [otpCountdown, setOtpCountdown]         = useState(0)

  const [sessionChecked, setSessionChecked]     = useState(false)

  const otpRefs = React.useRef([])

  // Countdown timer for resend
  useEffect(() => {
    let timer
    if (otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown(c => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [otpCountdown])

  // Session reuse: if same email+phone already verified this session, skip OTP
  useEffect(() => {
    if (!isOpen) {
      setSessionChecked(false)
      return
    }
    const savedPhone = sessionStorage.getItem('itinerary_lead_phone')
    if (savedPhone) {
      setName(sessionStorage.getItem('itinerary_lead_name') || '')
      setPhone(savedPhone)
      setEmail(sessionStorage.getItem('itinerary_lead_email') || '')
      setCallback(sessionStorage.getItem('itinerary_lead_callback') === 'true')
      // Already verified in this browser session — proceed directly
      proceedWithDownload(
        savedPhone,
        sessionStorage.getItem('itinerary_lead_email'),
        sessionStorage.getItem('itinerary_lead_name'),
        sessionStorage.getItem('itinerary_lead_callback') === 'true'
      )
    } else {
      setSessionChecked(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  // ── PDF download helper ─────────────────────────────────────────────────
  const downloadItineraryPdf = async (url, title) => {
    if (!url) return
    const safeFileName = `Tripomist-${(packageSlug || title || 'itinerary').replace(/[^a-zA-Z0-9 -]/g, '').trim()}.pdf`

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Network response was not ok')
      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href          = objectUrl
      a.download      = safeFileName
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(objectUrl)
      }, 100)
    } catch (err) {
      const isCloudinary = url.includes('res.cloudinary.com')
      if (isCloudinary) {
        let finalUrl = url
        if (!url.includes('fl_attachment')) {
          const encodedName = encodeURIComponent(safeFileName).replace(/%20/g, '%20')
          finalUrl = url.replace('/upload/', `/upload/fl_attachment:${encodedName}/`)
        }
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href          = finalUrl
        a.download      = safeFileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        throw new Error('Unable to download itinerary. Please try again.')
      }
    }
  }

  // ── Save lead + download ────────────────────────────────────────────────
  // Lead is saved BEFORE PDF download. Auth state is never touched.
  const proceedWithDownload = async (phoneArg = phone, emailArg = email, nameArg = name, callbackArg = callback) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const cleanPhone           = (phoneArg || '').replace(/\D/g, '').slice(-10)
      const normalizedInputEmail = (emailArg || '').trim().toLowerCase()

      // 1. Save lead FIRST (before download)
      const { error: dbError } = await supabase
        .from('itinerary_download_leads')
        .insert([{
          full_name:          (nameArg || '').trim(),
          phone:              cleanPhone,
          email:              normalizedInputEmail,
          expecting_callback: callbackArg,
          package_title:      tripTitle,
          package_slug:       packageSlug || null,
          itinerary_pdf_url:  pdfUrl || null,
          source:             'itinerary_download',
          status:             'new'
        }])

      if (dbError) throw dbError

      // 2. Persist session details for same-session reuse (no auth, just UX convenience)
      sessionStorage.setItem('itinerary_lead_phone',    phoneArg)
      sessionStorage.setItem('itinerary_lead_email',    normalizedInputEmail)
      sessionStorage.setItem('itinerary_lead_name',     nameArg)
      sessionStorage.setItem('itinerary_lead_callback', callbackArg.toString())

      // 3. Download the PDF
      if (pdfUrl) {
        await downloadItineraryPdf(pdfUrl, tripTitle)
      }

      setDownloadSuccess(true)
    } catch (err) {
      console.error('Error saving lead or downloading:', err)
      if (err.message === 'Unable to download itinerary. Please try again.') {
        setError(err.message)
      } else {
        setError('Something went wrong saving your details. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Form submit: request server-side OTP ───────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return   // duplicate-submit guard
    setIsSubmitting(true)
    setError(null)

    try {
      // Same-session reuse check
      const savedEmail = sessionStorage.getItem('itinerary_lead_email')
      const savedPhone = sessionStorage.getItem('itinerary_lead_phone')
      if (savedEmail && savedPhone && savedEmail === email.trim().toLowerCase()) {
        await proceedWithDownload()
        return
      }

      // Request OTP from server — we only get back a verificationId, never the OTP itself
      setOtpSending(true)
      const vid = await requestGuestOtp(email.trim(), name.trim())
      setVerificationId(vid)
      setOtpDigits(['', '', '', '', '', ''])
      setOtpError(null)
      setOtpCountdown(60)
      setShowOtp(true)
    } catch (err) {
      setError(err.message || 'Failed to send verification code.')
    } finally {
      setIsSubmitting(false)
      setOtpSending(false)
    }
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (otpSending) return
    setOtpSending(true)
    setOtpError(null)
    try {
      // Server invalidates old OTP and creates new one
      const vid = await requestGuestOtp(email.trim(), name.trim())
      setVerificationId(vid)
      setOtpDigits(['', '', '', '', '', ''])
      setOtpCountdown(60)
    } catch (err) {
      setOtpError(err.message || 'Failed to resend code.')
    } finally {
      setOtpSending(false)
    }
  }

  // ── Verify OTP (server-side) ───────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const token = otpDigits.join('')
    if (token.length !== 6) {
      setOtpError('Please enter the 6-digit code.')
      return
    }
    if (otpVerifying) return   // duplicate-verify guard
    setOtpVerifying(true)
    setOtpError(null)

    try {
      // Server compares hash of entered OTP — browser never knows the OTP
      await verifyGuestOtp(verificationId, email.trim().toLowerCase(), token)
      // Server returned verified=true → proceed with download
      setShowOtp(false)
      await proceedWithDownload()
    } catch (err) {
      setOtpError(err.message || 'Incorrect code. Please try again.')
    } finally {
      setOtpVerifying(false)
    }
  }

  // ── OTP input helpers ──────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otpDigits]
    next[index] = value
    setOtpDigits(next)
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const next = [...otpDigits]
      next[index - 1] = ''
      setOtpDigits(next)
      if (otpRefs.current[index - 1]) otpRefs.current[index - 1].focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...otpDigits]
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setOtpDigits(next)
    const lastIdx = pasted.length - 1
    if (otpRefs.current[lastIdx]) otpRefs.current[lastIdx].focus()
  }

  // ── Close handler ──────────────────────────────────────────────────────
  const handleClose = () => {
    setDownloadSuccess(false)
    setName('')
    setPhone('')
    setEmail('')
    setCallback(false)
    setShowOtp(false)
    setVerificationId(null)
    setOtpDigits(['', '', '', '', '', ''])
    setOtpError(null)
    setError(null)
    onClose()
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal Card */}
      <div
        className="relative bg-[#f8f9fa] w-full max-w-md rounded-[2rem] shadow-xl overflow-hidden z-10 p-6 sm:p-8 flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={handleClose}
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {/* ── Loading splash (session reuse auto-submitting) ── */}
        {!sessionChecked && !downloadSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#01AFD1] border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-500 font-medium">Preparing download...</p>
          </div>

        /* ── Success screen ── */
        ) : downloadSuccess ? (
          <div className="py-8 text-center flex flex-col items-center gap-4 w-full">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-2">
              <span className="material-symbols-outlined text-3xl">check</span>
            </div>
            <h3 className="font-bold text-gray-900 text-2xl">Itinerary Successfully Downloaded</h3>
            <p className="text-gray-500 text-sm mb-4 leading-relaxed px-4">
              Your itinerary has been downloaded successfully.<br />
              You can find it in your Downloads folder.
            </p>
          </div>

        /* ── OTP verification screen ── */
        ) : showOtp ? (
          <div className="w-full flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#e8f4f8] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[#01AFD1] text-2xl">mail_lock</span>
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 mb-1 tracking-tight text-center">Verify Your Email</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">
              We sent a 6-digit code to <span className="font-bold text-gray-700">{email}</span>
            </p>

            {otpError && (
              <div className="w-full mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                {otpError}
              </div>
            )}

            {/* OTP digit inputs */}
            <div className="flex justify-center gap-2 mb-6 w-full" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={el => (otpRefs.current[index] = el)}
                  id={`guest-otp-${index}`}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  autoFocus={index === 0}
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01AFD1] focus:border-transparent bg-white"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={otpVerifying || otpDigits.join('').length !== 6}
              className="w-full py-3.5 bg-[#01AFD1] text-white font-bold rounded-2xl shadow-md hover:bg-[#0092b3] transition-colors disabled:opacity-70 mb-3"
            >
              {otpVerifying ? 'Verifying...' : 'Verify & Download'}
            </button>

            <div className="flex flex-col items-center space-y-2 mt-1">
              {otpCountdown > 0 ? (
                <span className="text-sm text-gray-500">Resend code in {otpCountdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpSending}
                  className="text-sm font-bold text-[#01AFD1] hover:underline disabled:opacity-60"
                >
                  {otpSending ? 'Sending...' : 'Resend Code'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowOtp(false)
                  setOtpDigits(['', '', '', '', '', ''])
                  setOtpError(null)
                }}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                ← Back
              </button>
            </div>
          </div>

        /* ── Main form ── */
        ) : (
          <>
            <h2 className="text-[28px] font-bold text-gray-900 mb-1 tracking-tight text-center mt-2">Download Itinerary</h2>
            <p className="text-gray-500 text-sm mb-8 text-center">Please fill in your details to finish</p>

            {error && (
              <div className="w-full mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-xl">person</span>
                </div>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                  placeholder="Full Name"
                />
              </div>

              {/* Phone */}
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-xl">phone_iphone</span>
                </div>
                <div className="absolute inset-y-0 left-11 flex items-center pointer-events-none text-gray-500 font-medium">
                  <span className="text-sm mr-1">+91</span>
                  <span className="text-gray-300">|</span>
                </div>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-[84px] pr-4 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium tracking-wide"
                  placeholder="WhatsApp Number"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-xl">mail</span>
                </div>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                  placeholder="Email Address"
                />
              </div>

              {/* Callback checkbox */}
              <div className="flex items-center gap-3 py-1 px-1">
                <input
                  id="callback-checkbox"
                  type="checkbox"
                  checked={callback}
                  onChange={e => setCallback(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#01AFD1] focus:ring-[#01AFD1] cursor-pointer"
                />
                <label className="text-gray-500 text-sm cursor-pointer font-medium" htmlFor="callback-checkbox">
                  Expecting a callback?
                </label>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full bg-[#01AFD1] hover:bg-[#0092b3] disabled:opacity-70 text-white font-bold py-4 rounded-2xl shadow-md transition-all mt-4 cursor-pointer text-base active:scale-[0.98]"
                type="submit"
              >
                {isSubmitting ? 'Processing...' : 'Submit & Download'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default DownloadItineraryModal
