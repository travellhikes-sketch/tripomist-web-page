import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, safeStorage } from '../utils/supabaseClient'

function Login() {
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const navigate = useNavigate()

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    if (isSignUpMode) {
      // Sign Up Flow
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: "+91 " + phone
          }
        }
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg("Account created successfully! Logging you in...")
        safeStorage.setItem('mock_current_user', JSON.stringify(data.user || data))
        window.dispatchEvent(new Event('auth-state-change'))
        setTimeout(() => {
          navigate('/')
        }, 1500)
      }
    } else {
      // Sign In Flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setErrorMsg("Invalid login credentials. Agar aapne account nahi banaya hai, toh pehle niche 'Sign Up' par click karke sign up karein!")
        } else {
          setErrorMsg(error.message)
        }
      } else {
        setSuccessMsg("Logged in successfully! Redirecting...")
        safeStorage.setItem('mock_current_user', JSON.stringify(data.user || data))
        window.dispatchEvent(new Event('auth-state-change'))
        setTimeout(() => {
          navigate(-1) // Redirect back to previous page or home
        }, 1200)
      }
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    
    if (supabase.isMock) {
      // Mock Google Login
      const mockUser = {
        id: 'google-user-' + Math.random().toString(36).substring(2, 11),
        email: 'google-traveler@example.com',
        user_metadata: { full_name: 'Google Traveler' }
      }
      safeStorage.setItem('mock_current_user', JSON.stringify(mockUser))
      window.dispatchEvent(new Event('auth-state-change'))
      setSuccessMsg("Logged in with Google successfully!")
      setTimeout(() => {
        navigate('/')
      }, 1200)
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/'
        }
      })
      if (error) {
        setErrorMsg(error.message)
      }
    }
    setLoading(false)
  }

  const handleClose = () => {
    navigate(-1)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0f2f5] text-on-surface antialiased p-0 md:p-4">
      {/* Main Card Container */}
      <main className="w-full max-w-md bg-white shadow-2xl overflow-hidden md:rounded-[24px] flex flex-col min-h-screen md:min-h-[750px] relative">
        
        {/* Top Header Panel (Dark Blue Gradient) */}
        <section className="bg-gradient-to-b from-[#005175] to-[#006591] text-white p-8 pt-6 pb-8 relative flex flex-col items-center justify-between min-h-[290px] shrink-0">
          
          {/* Brand & Close Navigation */}
          <div className="flex justify-between items-center w-full mb-2">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 focus:outline-none cursor-pointer border-none bg-transparent">
              <img alt="TripoMist Logo" className="h-8 rounded-full aspect-square object-cover w-8 border border-white/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf4iPOLD4TW-emcX7qi8W7qPZhFbm5OzAQitvDsMARyOfBuAo9ztt29roRULWmZnSZXWDU9C66-5CEUsII9ClNmyCllVfZSQsk_Zh8SNMinjoMc_fWjzIKKChJB0UTFRB6QTigHPgLb0E2DZsOlp_JhvJp0lXnbSsTzGVqfLBMNk-0_rDP3tmtkhWYAQN9_F1nRcn8PpFGemDTJHOLelhxsCRyeTqUu0-JvD0GzZAkXaVLereGaQFPqUxJgRLojmOnEGYfiVmgV8Js0WY" />
              <span className="font-headline-md text-md text-white tracking-tight font-bold">TripoMist</span>
            </button>
            <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors focus:outline-none cursor-pointer border-none bg-transparent" aria-label="Close">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Illustration Area */}
          <div className="flex justify-center items-center h-28 my-2">
            <img src="/login_header_illustration.png" alt="Travel Illustration" className="h-28 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]" />
          </div>

          {/* Text Header */}
          <div className="text-center">
            <h1 className="font-headline-md text-2xl font-bold tracking-tight text-white mb-1">
              {isSignUpMode ? "Create Account" : "Login to Autofill"}
            </h1>
            <p className="text-xs text-white/85">
              {isSignUpMode ? "Join TripoMist and explore beautiful destinations." : "Please fill in your details to continue"}
            </p>
          </div>

        </section>

        {/* Bottom Form Section */}
        <section className="flex-grow p-6 md:p-8 flex flex-col justify-between bg-white">
          
          <div>
            {/* Demo Banner */}
            {supabase.isMock && safeStorage.getItem('use_mock_auth') === 'true' && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg text-blue-800 text-[11px] font-semibold flex justify-between items-center">
                <span>Running in Offline Demo Mode.</span>
                <button 
                  type="button" 
                  onClick={() => {
                    safeStorage.removeItem('use_mock_auth')
                    window.location.reload()
                  }}
                  className="text-primary hover:underline font-bold focus:outline-none uppercase text-[10px] cursor-pointer"
                >
                  Switch to Real
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-[11px] font-semibold flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm shrink-0 text-red-500">error</span>
                  <span>{errorMsg}</span>
                </div>
                {!supabase.isMock && (
                  <button 
                    type="button"
                    onClick={() => {
                      safeStorage.setItem('use_mock_auth', 'true')
                      window.location.reload()
                    }}
                    className="mt-1 bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wider self-start cursor-pointer border-none"
                  >
                    Switch to Offline Demo Mode (No Rate Limits)
                  </button>
                )}
              </div>
            )}


            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-700 text-[11px] font-semibold flex items-start gap-2">
                <span className="material-symbols-outlined text-sm shrink-0 text-emerald-500">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[18px]">person</span>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#f2f3ff] border border-outline-variant/65 rounded-[14px] text-sm text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline outline-none"
                  placeholder="Full Name"
                />
              </div>

              {/* Phone (with country code prefix) */}
              <div className="flex gap-2">
                <div className="flex items-center bg-[#f2f3ff] border border-outline-variant/65 rounded-[14px] px-3.5 text-sm font-semibold text-on-surface-variant select-none">
                  +91
                </div>
                <input
                  required
                  type="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-grow px-4 py-3 bg-[#f2f3ff] border border-outline-variant/65 rounded-[14px] text-sm text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline outline-none"
                  placeholder="Phone Number"
                />
              </div>

              {/* Email Address */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[18px]">mail</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#f2f3ff] border border-outline-variant/65 rounded-[14px] text-sm text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline outline-none"
                  placeholder="Email Address"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[18px]">lock</span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#f2f3ff] border border-outline-variant/65 rounded-[14px] text-sm text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline outline-none"
                  placeholder="Password (min 6 characters)"
                  minLength={6}
                />
              </div>

              {/* Continue / Log In Submit Button */}
              <button
                disabled={loading}
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-[#0084bd] text-white font-bold shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border-none mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      {isSignUpMode ? "person_add" : "arrow_forward"}
                    </span>
                    <span>{isSignUpMode ? "Sign Up" : "Continue"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-outline-variant/30"></div>
              <span className="flex-shrink mx-4 text-on-surface-variant/50 text-xs uppercase font-bold tracking-wider">or</span>
              <div className="flex-grow border-t border-outline-variant/30"></div>
            </div>

            {/* Google Auth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-[#f2f3ff] border border-outline-variant/65 text-on-surface font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>

            {/* Terms Checkbox */}
            <div className="mt-5 p-3.5 bg-[#f2f3ff] rounded-xl border border-outline-variant/30 flex items-start gap-2.5">
              <input type="checkbox" defaultChecked id="lead-terms" className="mt-0.5 w-4.5 h-4.5 accent-primary rounded cursor-pointer" />
              <label htmlFor="lead-terms" className="text-[11px] text-on-surface-variant leading-relaxed select-none">
                I authorize TripoMist to use my data for autofill, marketing & personalization per their{" "}
                <a href="/privacy-policy" className="text-primary hover:underline font-bold">Privacy Policy</a>.
              </label>
            </div>
          </div>

          {/* Toggle Mode & Footer */}
          <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center">
            <p className="text-xs text-on-surface-variant mb-4">
              <span>{isSignUpMode ? "Already have an account?" : "New to TripoMist?"}</span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode)
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="text-primary hover:underline font-bold ml-1 focus:outline-none"
              >
                {isSignUpMode ? "Log In" : "Sign Up"}
              </button>
            </p>
            
            <p className="text-[10px] text-outline tracking-wider uppercase font-semibold flex items-center justify-center gap-1.5 select-none">
              <span className="material-symbols-outlined text-[12px] text-primary">security</span> Powered by Supabase Auth
            </p>
          </div>

        </section>
      </main>
    </div>
  )
}

export default Login
