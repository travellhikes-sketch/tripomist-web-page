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
      localStorage.setItem('mock_current_user', JSON.stringify(mockUser))
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

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-outline-variant/30"></div>
            <span className="flex-shrink mx-4 text-on-surface-variant/60 text-xs uppercase font-bold tracking-wider">or</span>
            <div className="flex-grow border-t border-outline-variant/30"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-surface-container-low border border-outline-variant/50 text-on-surface font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>


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
