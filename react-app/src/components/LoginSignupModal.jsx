import React, { useState, useEffect } from 'react';
import { supabase, safeStorage } from '../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const countryCodes = [
  { code: '+91', country: 'IN' },
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+971', country: 'AE' }
];

const normalizePhone = (inputStr) => {
  let cCode = '';
  let rest = inputStr;
  const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
  for (let { code } of sortedCodes) {
    if (inputStr.startsWith(code)) {
      cCode = code;
      rest = inputStr.slice(code.length);
      break;
    }
  }
  let localPhone = rest.replace(/\D/g, '');
  if (localPhone.length === 11 && localPhone.startsWith('0')) {
    localPhone = localPhone.substring(1);
  }
  return cCode ? cCode + ' ' + localPhone : localPhone;
};

const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 1
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (dir) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 1
  })
};

export default function LoginSignupModal({ isOpen, onClose }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  
  // Registration State
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Slider State
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev
  const [isPaused, setIsPaused] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      setAuthMode('login');

      setErrorMsg('');
      setSuccessMsg('');
      fetchSlides();
    }
  }, [isOpen]);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('login_slider_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (!error && data) {
        setSlides(data);
        // Preload images to prevent blank loading flash
        data.forEach(item => {
          if (item.image_url) {
            const img = new Image();
            img.src = item.image_url;
          }
        });
      }
    } catch (e) {
      console.error('Error fetching slides', e);
    }
  };

  useEffect(() => {
    if (slides.length <= 1 || isPaused || !isOpen) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused, isOpen]);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!fullName || !phone || !email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (phone.length < 10) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone: countryCode + ' ' + phone } }
      });
      if (error) {
        setLoading(false);
        setErrorMsg(error.message || 'Registration failed.');
        return;
      }
      // Determine if email confirmation is required
      const requiresConfirmation = data && data.user && !data.session;
      // Upsert profile row (if user id available)
      if (data?.user?.id) {
        const normalizedPhone = normalizePhone(countryCode + phone);
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          phone: normalizedPhone,
          // preserve any existing role defaults via DB defaults
        });
      }
      if (requiresConfirmation) {
        setSuccessMsg('Registration Initiated! Please check your email to verify your account.');
      } else {
        if (data?.session) {
          const { error: linkError } = await supabase.rpc('link_my_bookings');
          if (linkError) {
            console.error('Failed to link historical bookings:', linkError.message);
          }
        }
        setSuccessMsg('Registration Successful! You are now logged in.');
        // Store user in mock storage for UI consistency
        safeStorage.setItem('mock_current_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-state-change'));
        setTimeout(() => {
          setAuthMode('login');
          onClose();
        }, 1500);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      if (error) {
        setLoading(false);
        setErrorMsg('Invalid Email or Password.');
        return;
      }
      if (data?.session) {
        const { error: linkError } = await supabase.rpc('link_my_bookings');
        if (linkError) {
          console.error('Failed to link historical bookings:', linkError.message);
        }
      }
      if (data?.user) {
        safeStorage.setItem('mock_current_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-state-change'));
      }
      // pending claim handling (unchanged)
      const pendingClaimStr = sessionStorage.getItem('pending_claim');
      if (pendingClaimStr && data?.user) {
        try {
          const claimData = JSON.parse(pendingClaimStr);
          if (claimData.id && claimData.razorpay_payment_id) {
            await supabase
              .from('bookings')
              .update({ user_id: data.user.id })
              .eq('id', claimData.id)
              .eq('razorpay_payment_id', claimData.razorpay_payment_id)
              .is('user_id', null);
            sessionStorage.removeItem('pending_claim');
          }
        } catch (e) { console.error('Failed to parse pending claim', e); }
      }
      setSuccessMsg('Sign In Successful!');
      setTimeout(() => {
        setLoading(false);
        onClose();
        const params = new URLSearchParams(location.search);
        const redirect = params.get('redirect');
        if (redirect) navigate(redirect);
      }, 1000);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'An error occurred during login.');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setLoading(false);
        setErrorMsg(error.message || "Failed to send reset link.");
        return;
      }

      setLoading(false);
      setSuccessMsg("Password reset link sent. Please check your email and spam folder.");
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "An error occurred. Please try again.");
    }
  };

  const renderForm = () => {
    return (
      <div className="w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {authMode === 'register' ? 'Create an Account' : authMode === 'forgot' ? 'Reset Password' : 'Sign in to TripoMist'}
        </h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          {authMode === 'register' ? 'Join us and start your adventure' : authMode === 'forgot' ? 'Enter your email to receive a recovery link' : 'Welcome back, traveler!'}
        </p>

        {errorMsg && (
          <div className="w-full mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="w-full mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {successMsg}
          </div>
        )}

        <div className="w-full max-w-sm">
          {authMode === 'register' && (
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a]" />
                </div>
                <div className="w-1/2">
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="w-24 px-2 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#136b8a]">
                    {countryCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="Phone" maxLength={10} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a] mt-1" />
                </div>
              </div>
              <div>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a]" />
              </div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600">{showPassword ? 'Hide' : 'Show'}</button>
              </div>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a]" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600">{showConfirmPassword ? 'Hide' : 'Show'}</button>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#136b8a] text-white font-bold rounded-xl shadow-md hover:bg-[#0f556e] transition-colors disabled:opacity-70">
                {loading ? 'Processing...' : 'Submit'}
              </button>
            </form>
          )}

          {authMode === 'login' && (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email or Phone" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a]" />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600">{showPassword ? 'Hide' : 'Show'}</button>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }} className="text-sm font-bold text-[#136b8a]">Forgot Password?</button>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#136b8a] text-white font-bold rounded-xl shadow-md hover:bg-[#0f556e] transition-colors disabled:opacity-70">
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {authMode === 'forgot' && (
            <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136b8a]" />
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#136b8a] text-white font-bold rounded-xl shadow-md hover:bg-[#0f556e] transition-colors disabled:opacity-70">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }} className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700">Back to Sign In</button>
            </form>
          )}

          {authMode !== 'forgot' && (
            <div className="mt-6 text-center border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-600">
                {authMode === 'register' ? "Already have an account? " : "Don't have an account? "}
                <button type="button" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')} className="font-bold text-[#136b8a] hover:underline">
                  {authMode === 'register' ? 'Sign In' : 'Switch to Sign Up'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
          />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 md:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row pointer-events-auto max-h-full overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[210] w-8 h-8 bg-white/50 backdrop-blur-md text-gray-800 hover:bg-white hover:text-red-500 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              {/* Mobile View: Form First, Carousel hidden or compact */}
              <div className="w-full md:hidden flex flex-col">
                {slides.length > 0 && (
                  <div className="relative h-40 w-full overflow-hidden">
                    <img src={slides[currentSlide].image_url} alt="Slider" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-4 text-center">
                      <h3 className="text-white font-bold text-lg drop-shadow-md">{slides[currentSlide].title}</h3>
                    </div>
                  </div>
                )}
                <div className="p-6 sm:p-8 flex-1 flex items-center justify-center">
                  {renderForm()}
                </div>
              </div>

              {/* Desktop View */}
              <div className="hidden md:flex w-full h-[600px]">
                {/* Carousel */}
                <div 
                  className="w-1/2 relative bg-[#136b8a] overflow-hidden group"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  {slides.length > 0 ? (
                    <AnimatePresence initial={false} custom={direction}>
                      <motion.div
                        key={currentSlide}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          x: { type: "tween", ease: "easeInOut", duration: 0.6 }
                        }}
                        className="absolute inset-0"
                      >
                        <img src={slides[currentSlide].image_url} alt={slides[currentSlide].title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-10">
                          {slides[currentSlide].title && (
                            <h2 className="text-white text-3xl font-bold mb-2 drop-shadow-md leading-tight">{slides[currentSlide].title}</h2>
                          )}
                          {slides[currentSlide].subtitle && (
                            <p className="text-white/90 text-lg drop-shadow-sm">{slides[currentSlide].subtitle}</p>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#136b8a] to-teal-600 flex flex-col justify-center p-10 text-white">
                      <h2 className="text-4xl font-bold mb-4">Start Your Journey</h2>
                      <p className="text-lg text-teal-100">Join TripoMist and explore the world with premium travel experiences.</p>
                    </div>
                  )}

                  {/* Dots */}
                  {slides.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (idx === currentSlide) return;
                            setDirection(idx > currentSlide ? 1 : -1);
                            setCurrentSlide(idx);
                          }}
                          className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Form */}
                <div className="w-1/2 p-8 lg:p-12 flex items-center justify-center bg-white overflow-y-auto">
                  {renderForm()}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
