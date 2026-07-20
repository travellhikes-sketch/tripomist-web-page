import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Password reset error:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setSuccess("Password reset link sent. Please check your email and spam folder.")
    } catch (err) {
      console.error("Password reset exception:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
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
          Forgot Password
        </h2>
        <p className="mt-2 text-center text-sm text-teal-100 font-medium">
          Enter your email to receive a password reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {success}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  disabled={loading}
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
              <Link to="/login" className="text-sm font-bold text-[#136b8a] hover:text-[#0f556e] cursor-pointer transition-colors">
                Back to Sign In
              </Link>
            </div>
          </form>
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

export default ForgotPassword
