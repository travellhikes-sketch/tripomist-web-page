import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase, safeStorage } from '../utils/supabaseClient';

// Mock Country Codes
const countryCodes = [
  { code: '+91', country: 'IN' },
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+971', country: 'AE' }
]

function Login() {
  const [authMode, setAuthMode] = useState('register') // 'register' | 'login'
  const [step, setStep] = useState(1) // 1: Registration Form, 2: OTP
  
  // Registration State
  const [fullName, setFullName] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/'

  // 1. Submit Registration Form
  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    if (!fullName || !phone || !email || !password) {
      setErrorMsg("Please fill in all fields.")
      return
    }
    if (phone.length < 10) {
      setErrorMsg("Please enter a valid phone number.")
      return
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    setErrorMsg('')
    
    // Simulate sending OTP (UI step transition)
    setTimeout(() => {
      setLoading(false)
      setSuccessMsg("OTP sent successfully to " + countryCode + " " + phone)
      setStep(2)
    }, 800)
  }

  // 2. Submit OTP — Actually register the user in Supabase
  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (otp.length < 4) {
      setErrorMsg("Please enter the OTP.")
      return
    }
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    
    try {
      // Create the user in Supabase with email + password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: countryCode + " " + phone
          }
        }
      })

      if (signUpError) {
        console.error("Registration failed:", signUpError)
        setLoading(false)
        setErrorMsg(signUpError.message || "Registration failed.")
        return
      }

      // Check if email confirmation is required (data.session will be null if verification is required)
      const confirmationRequired = data && data.user && !data.session;

      // Sign out after registration so user can log in fresh
      await supabase.auth.signOut()

      setLoading(false)
      if (confirmationRequired) {
        setSuccessMsg("Registration Initiated! Please check your email to verify your account.")
      } else {
        setSuccessMsg("Registration Successful! Please Sign In.")
      }

      // Switch to login mode after a brief delay
      setTimeout(() => {
        setAuthMode('login')
        setStep(1)
        setSuccessMsg('')
      }, 4000)
    } catch (err) {
      console.error("Registration exception:", err)
      setLoading(false)
      setErrorMsg(err.message || "Registration failed. Please try again.")
    }
  }

  // 3. Submit Login — Real Supabase authentication
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      })

      if (error) {
        console.error("Login failed:", error)
        setLoading(false)
        setErrorMsg("Invalid Email or Password.")
        return
      }

      // Store user info for components that read from safeStorage
      if (data?.user) {
        safeStorage.setItem('mock_current_user', JSON.stringify(data.user))
        window.dispatchEvent(new Event('auth-state-change'))
      }

      // Claim pending booking if exists
      const pendingClaimStr = sessionStorage.getItem('pending_claim');
      if (pendingClaimStr && data?.user) {
        try {
          const claimData = JSON.parse(pendingClaimStr);
          if (claimData.id && claimData.razorpay_payment_id) {
            const { error: claimError } = await supabase
              .from('bookings')
              .update({ user_id: data.user.id })
              .eq('id', claimData.id)
              .eq('razorpay_payment_id', claimData.razorpay_payment_id)
              .is('user_id', null);
            
            if (claimError) {
              console.error("Booking claim failed:", claimError);
            } else {
              sessionStorage.removeItem('pending_claim');
              setSuccessMsg("Sign In Successful! Booking saved to your account.");
              setTimeout(() => { navigate('/my-trips') }, 1500);
              return;
            }
          }
        } catch (e) {
          console.error("Failed to parse pending claim", e);
        }
      }

      setSuccessMsg("Sign In Successful! Redirecting...")
      setTimeout(() => { navigate(redirectTo) }, 1000)
    } catch (err) {
      console.error("Login exception:", err)
      setLoading(false)
      setErrorMsg(err.message || "An error occurred during login.")
    }
  }

  // 4. Submit Forgot Password — Supabase Reset Password
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setErrorMsg("Please enter your email address.")
      return
    }
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        console.error("Forgot Password Error:", error)
        setLoading(false)
        setErrorMsg(error.message || "Failed to send reset link.")
        return
      }

      setLoading(false)
      setSuccessMsg("Password reset link sent. Please check your email and spam folder.")
    } catch (err) {
      console.error("Forgot Password Exception:", err)
      setLoading(false)
      setErrorMsg(err.message || "An error occurred. Please try again.")
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-[#136b8a] clip-path-slant z-0"></div>
      <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl z-0 pointer-events-none"></div>
      <div className="absolute top-40 left-20 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl z-0 pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
          {authMode === 'register' 
            ? (step === 1 ? 'Create an Account' : 'Verify OTP')
            : authMode === 'forgot'
            ? 'Reset Password'
            : 'Sign in to TripoMist'}
        </h2>
        <p className="mt-2 text-center text-sm text-teal-100 font-medium">
          {authMode === 'register' 
            ? 'Join us and start your adventure' 
            : authMode === 'forgot'
            ? 'Enter your email to receive a recovery link'
            : 'Welcome back, traveler!'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {successMsg}
            </div>
          )}

          {/* ----- REGISTER FLOW ----- */}
          {authMode === 'register' && step === 1 && (
            <form className="space-y-5" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 material-symbols-outlined text-[20px]">person</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none block w-full px-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] transition-colors font-medium text-gray-900"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <select 
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24 px-2 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] font-medium text-gray-900 bg-white"
                  >
                    {countryCodes.map(c => (
                      <option key={c.code} value={c.code}>{c.country} ({c.code})</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] transition-colors font-medium text-gray-900"
                    placeholder="9990802608"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 material-symbols-outlined text-[20px]">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] transition-colors font-medium text-gray-900"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Create Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 material-symbols-outlined text-[20px]">lock</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] transition-colors font-medium text-gray-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#136b8a] hover:bg-[#0f556e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#136b8a] disabled:opacity-70 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loading ? 'Processing...' : 'Register'}
                </button>
              </div>
            </form>
          )}

          {/* ----- OTP FLOW ----- */}
          {authMode === 'register' && step === 2 && (
            <form className="space-y-6" onSubmit={handleOtpSubmit}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#eff6f9] text-[#136b8a] mb-4">
                  <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Enter OTP</h3>
                <p className="text-sm text-gray-500 mt-1">We've sent a 4-digit code to <br/><span className="font-semibold text-gray-800">{countryCode} {phone}</span></p>
                <p className="text-xs text-gray-400 mt-1">(Hint: Use 1234 for testing)</p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="appearance-none block w-full px-4 py-4 border border-gray-300 rounded-xl shadow-sm text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] transition-colors font-bold text-gray-900"
                  placeholder="••••"
                  maxLength={4}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#136b8a] hover:bg-[#0f556e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#136b8a] disabled:opacity-70 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify & Complete'}
                </button>
              </div>
              
              <div className="text-center">
                <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-gray-500 hover:text-gray-700 cursor-pointer">
                  Go Back
                </button>
              </div>
            </form>
          )}

          {/* ----- LOGIN FLOW ----- */}
          {authMode === 'login' && (
            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 material-symbols-outlined text-[20px]">mail</span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="appearance-none block w-full px-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] transition-colors font-medium text-gray-900"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold text-gray-700">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-[#136b8a] hover:text-[#0f556e] cursor-pointer"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 material-symbols-outlined text-[20px]">lock</span>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="appearance-none block w-full px-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] transition-colors font-medium text-gray-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#136b8a] hover:bg-[#0f556e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#136b8a] disabled:opacity-70 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
                <div className="text-center mt-4">
                  <Link to="/forgot-password" className="text-sm font-bold text-[#136b8a] hover:text-[#0f556e] cursor-pointer">
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </form>
          )}

          {/* ----- FORGOT PASSWORD FLOW ----- */}
          {authMode === 'forgot' && (
            <form className="space-y-6" onSubmit={handleForgotPasswordSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 material-symbols-outlined text-[20px]">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] transition-colors font-medium text-gray-900"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#136b8a] hover:bg-[#0f556e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#136b8a] disabled:opacity-70 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login')
                    setErrorMsg('')
                    setSuccessMsg('')
                  }}
                  className="text-sm font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Toggle Modes */}
          {step !== 2 && authMode !== 'forgot' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 font-medium border-t border-gray-100 pt-6">
                {authMode === 'register' ? "Already have an account? " : "Don't have an account? "}
                <button
                  onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                  className="font-bold text-[#136b8a] hover:text-[#0f556e] cursor-pointer transition-colors"
                >
                  {authMode === 'register' ? 'Sign In' : 'Register'}
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
      
      {/* CSS for slanted background */}
      <style dangerouslySetInnerHTML={{__html: `
        .clip-path-slant {
          clip-path: polygon(0 0, 100% 0, 100% 80%, 0 100%);
        }
      `}} />
    </div>
  )
}

export default Login
