import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function AdminSecurityModal({ adminEmail, onClose }) {
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modes: 'check', 'create', 'update', 'forgot'
  const [mode, setMode] = useState('check');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('has_booking_delete_password');
      if (error) throw error;
      
      setHasPassword(data);
      setMode(data ? 'update' : 'create');
    } catch (err) {
      console.error(err);
      setError('Could not check security configuration. Have you run the SQL migration?');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const { error } = await supabase.rpc('create_booking_delete_password', {
        p_password: newPassword
      });
      if (error) throw error;
      
      setMessage('Booking Delete Password created successfully.');
      setHasPassword(true);
      setMode('update');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creating password.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      // Update password using the specific RPC that takes both
      const { error: setErrorMsg } = await supabase.rpc('update_booking_delete_password', {
        p_current_password: currentPassword,
        p_new_password: newPassword
      });
      
      if (setErrorMsg) {
        if (setErrorMsg.message.includes('Incorrect') || setErrorMsg.message.includes('current password')) {
          setError('Current delete password is incorrect.');
          return;
        }
        throw setErrorMsg;
      }

      setMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error updating password.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReset = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');
      
      // In a full implementation, this would call an Edge Function to generate the token and send the email.
      // Since this requires server-side emailing setup (like Resend/SendGrid), we simulate the request success
      // and instruct the admin on the architecture.
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage(`A reset link would be sent to: ${adminEmail} (Edge Function integration required for actual email delivery)`);
    } catch (err) {
      console.error(err);
      setError('Failed to send reset link.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Lock className="text-[#01AFD1]" size={20} />
            Booking Delete Password
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors rounded-lg p-1 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01AFD1]"></div>
            </div>
          ) : (
            <>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">{error}</div>}
              {message && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100">{message}</div>}

              {mode === 'create' && (
                <form onSubmit={handleCreate} className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    This password is used <span className="font-bold">only</span> to confirm permanent booking deletion. It is completely separate from your admin login password.
                  </p>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#01AFD1] outline-none pr-10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#01AFD1] outline-none"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                    />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={saving} className="w-full bg-[#01AFD1] hover:bg-[#0092b3] text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                      {saving ? 'Saving...' : 'Create Password'}
                    </button>
                  </div>
                </form>
              )}

              {mode === 'update' && (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Change your dedicated booking deletion password.
                  </p>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#01AFD1] outline-none"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#01AFD1] outline-none pr-10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#01AFD1] outline-none"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </div>
                  <div className="pt-2 flex gap-3">
                    <button type="submit" disabled={saving} className="flex-1 bg-[#01AFD1] hover:bg-[#0092b3] text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                  <div className="pt-3 text-center border-t border-gray-100 mt-4">
                    <button type="button" onClick={() => setMode('forgot')} className="text-sm font-medium text-gray-500 hover:text-[#01AFD1] transition-colors">
                      Forgot password?
                    </button>
                  </div>
                </form>
              )}

              {mode === 'forgot' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Send a password reset link securely to your admin email address.
                  </p>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                    <Mail className="text-gray-400" size={20} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reset Email</p>
                      <p className="text-sm font-medium text-gray-900">{adminEmail}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 flex flex-col gap-3">
                    <button 
                      onClick={handleSendReset} 
                      disabled={saving} 
                      className="w-full bg-[#01AFD1] hover:bg-[#0092b3] text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <button 
                      onClick={() => setMode('update')} 
                      className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2.5 rounded-lg text-sm transition-colors"
                    >
                      Back to Update
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
