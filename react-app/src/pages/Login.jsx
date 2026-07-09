import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Login() {
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
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
          }
        }
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg("Account created successfully! Logging you in...")
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
        setErrorMsg(error.message)
      } else {
        setSuccessMsg("Logged in successfully! Redirecting...")
        setTimeout(() => {
          navigate(-1) // Redirect back to previous page or home
        }, 1200)
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest dark:bg-inverse-surface">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 relative overflow-hidden">
        {/* Dynamic Gradient Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

        {/* Auth Glass Card */}
        <section className="glass-panel w-full max-w-md rounded-2xl p-8 md:p-10 border border-outline-variant/30 bg-white/80 dark:bg-surface-dim/80 backdrop-blur-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-primary-container"></div>
          
          <div className="text-center mb-8">
            <h1 className="font-display-md text-display-md font-bold text-on-surface mb-2">
              {isSignUpMode ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isSignUpMode 
                ? "Join TripoMist and explore beautiful destinations." 
                : "Log in to check your bookings and explore new trips."
              }
            </p>
          </div>

          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined shrink-0 text-red-500">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-700 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined shrink-0 text-emerald-500">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleAuthSubmit}>
            {isSignUpMode && (
              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-bold text-xs">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">person</span>
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-glass w-full rounded-lg pl-12 pr-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-bold text-xs">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-glass w-full rounded-lg pl-12 pr-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-bold text-xs">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-glass w-full rounded-lg pl-12 pr-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                  placeholder="Enter password (min 6 characters)"
                  minLength={6}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="btn-gradient w-full py-3.5 rounded-xl font-headline-md text-headline-md font-bold text-[16px] flex justify-center items-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">
                    {isSignUpMode ? "person_add" : "login"}
                  </span>
                  {isSignUpMode ? "Sign Up" : "Log In"}
                </>
              )}
            </button>
          </form>

          {/* Toggle Switch */}
          <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isSignUpMode ? "Already have an account?" : "New to TripoMist?"}
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode)
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="text-primary hover:underline font-bold ml-1.5 focus:outline-none transition-all"
              >
                {isSignUpMode ? "Log In" : "Sign Up"}
              </button>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Login
