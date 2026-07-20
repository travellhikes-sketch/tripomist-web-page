import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isRecoverySessionValid, setIsRecoverySessionValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let authListener;

    const checkSession = async () => {
      try {
        // 1. Check current session
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setIsRecoverySessionValid(true);
          setCheckingSession(false);
          return;
        }

        // 2. Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" || session) {
            setIsRecoverySessionValid(true);
          }
          setCheckingSession(false);
        });
        authListener = subscription;

        // If after a short delay we still don't have a session, finish checking
        setTimeout(() => {
          setCheckingSession(false);
        }, 1500);

      } catch (err) {
        console.error("Session check exception:", err);
        setCheckingSession(false);
      }
    };

    checkSession();

    return () => {
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Password update error:", error);
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSuccessMsg('Password updated successfully.');

      // Sign out the temporary recovery session if appropriate
      await supabase.auth.signOut();

      setTimeout(() => {
        setLoading(false);
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password reset exception:', err);
      setLoading(false);
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-[#136b8a] clip-path-slant z-0"></div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 relative text-center">
          <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#136b8a] mb-4"></div>
            <p className="text-gray-600 font-medium">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isRecoverySessionValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-[#136b8a] clip-path-slant z-0"></div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
            Invalid Link
          </h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
          <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100 text-center">
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              This password reset link is invalid or has expired. Please request a new link.
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#136b8a] hover:bg-[#0f556e] cursor-pointer"
              >
                Request New Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Slanted Background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-[#136b8a] clip-path-slant z-0"></div>
      <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl z-0 pointer-events-none"></div>
      <div className="absolute top-40 left-20 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl z-0 pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-teal-100 font-medium">
          Choose a secure new password for your account
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

          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">New Password (min 8 chars)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 material-symbols-outlined text-[20px]">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none block w-full px-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] transition-colors font-medium text-gray-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 material-symbols-outlined text-[20px]">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#136b8a] focus:border-[#136b8a] transition-colors font-medium text-gray-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="show-pass"
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 text-[#136b8a] focus:ring-[#136b8a] border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="show-pass" className="ml-2 block text-sm text-gray-600 font-semibold cursor-pointer">
                Show Passwords
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#136b8a] hover:bg-[#0f556e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#136b8a] disabled:opacity-70 transition-all active:scale-[0.98] cursor-pointer"
              >
                {loading ? 'Updating password...' : 'Update Password'}
              </button>
            </div>
          </form>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .clip-path-slant {
          clip-path: polygon(0 0, 100% 0, 100% 80%, 0 100%);
        }
      `}} />
    </div>
  );
}
