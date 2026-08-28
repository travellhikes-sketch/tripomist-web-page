import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const EmailOtpVerification = ({ email, onVerifySuccess, onBack, shouldCreateUser = false, initialStep = 1 }) => {
  const [step, setStep] = useState(initialStep); // 1 = input email, 2 = input OTP
  const [inputEmail, setInputEmail] = useState(email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [countdown, setCountdown] = useState(initialStep === 2 ? 60 : 0);

  const inputRefs = React.useRef([]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);
    const normalizedEmail = inputEmail.trim().toLowerCase();

    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser
        }
      });

      if (otpError) {
        throw otpError;
      }

      setStep(2);
      setCountdown(60);
      setSuccess('Verification code sent to your email.');
    } catch (err) {
      console.error('OTP Send Error:', err);
      // User friendly message instead of raw error
      if (err.message?.includes('Signups not allowed') || err.status === 400) {
         setError('No account found for this email. Please create an account first.');
      } else if (err.status === 429) {
         setError('Too many requests. Please wait a moment and try again.');
      } else {
         setError('Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    const normalizedEmail = inputEmail.trim().toLowerCase();

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: 'email'
      });

      if (verifyError) {
        throw verifyError;
      }

      if (data?.session) {
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          onVerifySuccess(normalizedEmail, data.session);
        }, 1000);
      }
    } catch (err) {
      console.error('OTP Verify Error:', err);
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('Invalid or expired verification code. Please try again.');
      } else {
        setError('Failed to verify code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Box is empty: move to previous box, clear it, and focus it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1].focus();
        }
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const lastPopulatedIndex = pastedData.length - 1;
      if (inputRefs.current[lastPopulatedIndex]) {
        inputRefs.current[lastPopulatedIndex].focus();
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="w-full max-w-sm space-y-4">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Verify Email</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            We'll send a 6-digit code to verify your email address.
          </p>

          {error && (
            <div className="w-full mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <input
            type="email"
            required
            value={inputEmail}
            onChange={e => setInputEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01AFD1]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#01AFD1] text-white font-bold rounded-xl shadow-md hover:bg-[#0092b3] transition-colors disabled:opacity-70"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Back
            </button>
          )}
        </form>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Enter Verification Code</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Enter the 6-digit code sent to <span className="font-bold text-gray-800">{inputEmail}</span>
          </p>

          {error && (
            <div className="w-full mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="w-full mb-4 bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm font-medium">
              {success}
            </div>
          )}

          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                inputMode="numeric"
                autoFocus={index === 0}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01AFD1] focus:border-transparent bg-white"
              />
            ))}
          </div>

          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.join('').length !== 6}
            className="w-full py-3.5 bg-[#01AFD1] text-white font-bold rounded-xl shadow-md hover:bg-[#0092b3] transition-colors disabled:opacity-70"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          <div className="flex flex-col items-center mt-4 space-y-3">
            {countdown > 0 ? (
              <span className="text-sm text-gray-500">Resend OTP in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="text-sm font-bold text-[#01AFD1] hover:underline"
              >
                Resend OTP
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp(['', '', '', '', '', '']);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Change Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailOtpVerification;


