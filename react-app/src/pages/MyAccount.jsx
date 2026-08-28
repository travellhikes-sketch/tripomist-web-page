import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';
import { CircleUserRound, ChevronDown } from 'lucide-react';

import { getPackageDuration } from '../utils/formatters';

const statusColors = {
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  new: 'bg-gray-100 text-gray-700 border-gray-200',
};

const paymentColors = {
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function MyAccount() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isTripsOpen, setIsTripsOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const [heroImage, setHeroImage] = useState(null);

  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ full_name: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  const [personalEditMode, setPersonalEditMode] = useState(false);
  const [personalFormData, setPersonalFormData] = useState({
    first_name: '', last_name: '', phone: '', date_of_birth: '', address: '', city: '', state: '', pin_code: ''
  });
  const [personalSaving, setPersonalSaving] = useState(false);

  const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'support') {
      setActiveTab('support');
    } else if (section === 'profile') {
      setActiveTab('profile');
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login?redirect=/my-account');
        return;
      }
      setUser(session.user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch bookings for statistics and next upcoming trip
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', session.user.id);

      if (!error && bookingsData) {
        // Collect package IDs to fetch real images from Supabase Pakage table
        const packageIds = [...new Set(bookingsData.map(b => b.package_id).filter(Boolean))];
        let packageMap = {};
        if (packageIds.length > 0) {
          const { data: packagesData } = await supabase
            .from('Pakage')
            .select('id, banner_image, image_url')
            .in('id', packageIds);
          if (packagesData) {
            packagesData.forEach(p => {
              packageMap[p.id] = p;
            });
          }
        }

        const bookingsWithImages = bookingsData.map(b => {
          const pkg = b.package_id ? packageMap[b.package_id] : null;
          return {
            ...b,
            banner_image: pkg?.banner_image || null,
            image_url: pkg?.image_url || null
          };
        });

        setBookings(bookingsWithImages);
      }

      const { data: settingsData } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'customer_support').maybeSingle();
      if (settingsData) {
        setSiteSettings(settingsData.setting_value);
      }

      const { data: heroData } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'customer_account_hero').maybeSingle();
      if (heroData?.setting_value) {
        const val = heroData.setting_value;
        if (typeof val === 'string' && val.startsWith('http')) {
          setHeroImage(val);
        } else if (val.hero_image) {
          setHeroImage(val.hero_image);
        }
      }

      setLoading(false);
    }
    loadDashboardData();
  }, [navigate]);

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Invalid file type');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: false, contentType: file.type });

      if (uploadError) {
        alert('Upload failed: ' + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        alert('Profile update failed: ' + updateError.message);
        return;
      }

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      alert('Profile photo updated successfully.');
    } catch (err) {
      alert('An error occurred.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: profileFormData.full_name,
        phone: profileFormData.phone
      }).eq('id', user.id);
      if (error) throw error;
      setProfile(prev => ({ ...prev, full_name: profileFormData.full_name, phone: profileFormData.phone }));
      setProfileEditMode(false);
      alert('Profile updated successfully.');
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePersonalSave = async () => {
    setPersonalSaving(true);
    try {
      const full_name = `${personalFormData.first_name} ${personalFormData.last_name}`.trim();

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: personalFormData.first_name,
          last_name: personalFormData.last_name,
          full_name
        }
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase.from('profiles').update({
        full_name,
        phone: personalFormData.phone,
        date_of_birth: personalFormData.date_of_birth,
        address: personalFormData.address,
        city: personalFormData.city,
        state: personalFormData.state,
        pin_code: personalFormData.pin_code
      }).eq('id', user.id);
      if (profileError) throw profileError;

      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      setUser(updatedUser);

      setProfile(prev => ({
        ...prev,
        full_name,
        phone: personalFormData.phone,
        date_of_birth: personalFormData.date_of_birth,
        address: personalFormData.address,
        city: personalFormData.city,
        state: personalFormData.state,
        pin_code: personalFormData.pin_code
      }));
      setPersonalEditMode(false);
      alert('Personal info updated successfully.');
    } catch (err) {
      alert('Error updating personal info: ' + err.message);
    } finally {
      setPersonalSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordFormData.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect.');
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordFormData.newPassword
      });
      if (error) throw error;
      setPasswordSuccess('Password updated successfully.');
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleForgotPassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setPasswordSuccess('Password reset link sent to your email.');
    } catch (err) {
      setPasswordError('Error sending reset email: ' + err.message);
    }
  };

  const handleLogout = async () => {
    navigate('/');
    setTimeout(async () => {
      await supabase.auth.signOut();
    }, 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col ">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-10 h-10 border-4 border-[#01AFD1] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-semibold text-gray-600">Loading your dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  const profileName = profile?.full_name || user.user_metadata?.full_name || (user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : null) || 'Traveler';
  const firstName = profileName.split(' ')[0];
  const userEmail = user.email;
  const initial = profileName.charAt(0).toUpperCase();
  const createdDate = profile?.created_at || user.created_at;
  const dateObj = new Date(createdDate);
  const joinedDate = `${dateObj.getDate()} ${dateObj.toLocaleDateString('en-US', { month: 'long' })} ${dateObj.getFullYear()}`;
  const photoUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const profilePhone = profile?.phone || user.user_metadata?.phone || 'Not yet provided';

  // Calculate statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalBookings = bookings.length;

  const upcomingTripsList = bookings.filter(b => {
    if (b.booking_status?.toLowerCase() === 'cancelled') return false;
    const tDate = b.travel_date ? new Date(b.travel_date) : null;
    return tDate && tDate >= today && b.booking_status?.toLowerCase() !== 'completed';
  });

  const upcomingTrips = upcomingTripsList.length;

  const completedTrips = bookings.filter(b => {
    if (b.booking_status?.toLowerCase() === 'cancelled') return false;
    const tDate = b.travel_date ? new Date(b.travel_date) : null;
    return b.booking_status?.toLowerCase() === 'completed' || (tDate && tDate < today);
  }).length;

  // Calculate Amount Spent from successful bookings only
  const amountSpent = bookings.reduce((sum, b) => {
    if (b.payment_status?.toLowerCase() === 'paid') return sum + Number(b.final_amount || 0);
    if (b.payment_status?.toLowerCase() === 'pending') return sum + Number(b.advance_payment || 0);
    return sum;
  }, 0);

  // Fetch nearest upcoming confirmed trip
  const confirmedUpcoming = bookings
    .filter(b => {
      if (b.booking_status?.toLowerCase() !== 'confirmed') return false;
      const tDate = b.travel_date ? new Date(b.travel_date) : null;
      return tDate && tDate >= today;
    })
    .sort((a, b) => new Date(a.travel_date) - new Date(b.travel_date));

  const nextUpcomingTrip = confirmedUpcoming[0] || null;

  let daysLeft = null;
  if (nextUpcomingTrip && nextUpcomingTrip.travel_date) {
    const tDate = new Date(nextUpcomingTrip.travel_date);
    const diffTime = tDate.getTime() - today.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get Supabase package image URL
  const nextTripImg = nextUpcomingTrip ? (nextUpcomingTrip.banner_image || nextUpcomingTrip.image_url) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col ">
      <Navbar />

      {/* Hero Section */}
      <section className={`pt-36 pb-32 relative overflow-hidden ${!heroImage ? 'bg-gradient-to-r from-[#01AFD1]/95 to-teal-600/90' : 'bg-gray-900'}`}>
        {heroImage ? (
          <img src={heroImage} alt="Account Background" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-950/20 opacity-40 mix-blend-overlay"></div>
        )}
        {heroImage && <div className="absolute inset-0 bg-black/40"></div>}
        <div className="max-w-5xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-[#01AFD1] shadow-xl overflow-hidden border-4 border-white">
              {photoUrl ? (
                <img src={photoUrl} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {firstName} 👋</h1>
              <p className="text-teal-50 text-base font-semibold mt-1">Ready for your next adventure?</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                <span className="text-white/80 text-xs bg-black/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  Member since • {joinedDate}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 text-sm cursor-pointer">
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 -mt-16 pb-40 relative z-20">

        {/* Statistics Cards */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-gray-200 overflow-hidden mb-8">
          <div className="flex-1 p-5 text-center">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Upcoming Trips</p>
            <h3 className="text-2xl font-semibold text-gray-900">{upcomingTrips}</h3>
          </div>
          <div className="flex-1 p-5 text-center">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Completed Trips</p>
            <h3 className="text-2xl font-semibold text-gray-900">{completedTrips}</h3>
          </div>
          <div className="flex-1 p-5 text-center">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Bookings</p>
            <h3 className="text-2xl font-semibold text-gray-900">{totalBookings}</h3>
          </div>
          <div className="flex-1 p-5 text-center">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Amount Spent</p>
            <h3 className="text-2xl font-semibold text-gray-900">₹{amountSpent.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Account Management Section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6 relative">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              My Account
            </h2>
            
            <div className="relative">
              <button onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 transition-colors">
                <CircleUserRound size={20} className="text-gray-600" />
                Account Menu
                <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${isSettingsMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSettingsMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 flex flex-col p-2">
                  <button onClick={() => { setActiveTab('profile'); setIsSettingsMenuOpen(false); }} className={`text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'profile' ? 'bg-[#01AFD1] text-white' : 'text-gray-700 hover:bg-gray-50'}`}>My Profile</button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  {/* All Trips Dropdown */}
                  <div className="flex flex-col">
                    <button onClick={() => setIsTripsOpen(!isTripsOpen)} className="flex items-center justify-between text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                      All Trips
                      <span className={`material-symbols-outlined text-[16px] transition-transform ${isTripsOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    {isTripsOpen && (
                      <div className="flex flex-col pl-3 mt-1">
                        <Link to="/my-trips?filter=upcoming" onClick={() => setIsSettingsMenuOpen(false)} className="text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">Upcoming Trips</Link>
                        <Link to="/my-trips?filter=completed" onClick={() => setIsSettingsMenuOpen(false)} className="text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">Completed Trips</Link>
                        <Link to="/my-trips?filter=cancelled" onClick={() => setIsSettingsMenuOpen(false)} className="text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">Cancelled Trips</Link>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button onClick={() => { setActiveTab('support'); setIsSettingsMenuOpen(false); }} className={`text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'support' ? 'bg-[#01AFD1] text-white' : 'text-gray-700 hover:bg-gray-50'}`}>Help & Support</button>
                  <button onClick={() => { setActiveTab('security'); setIsSettingsMenuOpen(false); }} className={`text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'security' ? 'bg-[#01AFD1] text-white' : 'text-gray-700 hover:bg-gray-50'}`}>Change Password</button>
                  <button onClick={() => { handleLogout(); setIsSettingsMenuOpen(false); }} className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-all mt-1">Logout</button>
                </div>
              )}
            </div>
          </div>

          <div className="w-full">
            {/* Content Area */}
            {activeTab === 'profile' && (
            <div className="w-full bg-white rounded-sm p-6 md:p-8 border border-gray-100 overflow-hidden">
              <h3 className="text-xl font-bold text-gray-900 mb-6">My Profile</h3>

              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-8 pb-4">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="relative group flex-shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-gray-50 overflow-hidden bg-gray-100 flex items-center justify-center text-3xl md:text-4xl font-bold text-[#01AFD1]">
                      {photoUrl ? <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" /> : initial}
                    </div>
                    <button
                      onClick={() => !avatarUploading && fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-1 right-1 bg-white/80 hover:bg-white backdrop-blur-sm text-gray-700 p-1.5 rounded-full shadow-sm transition-colors z-10 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
                  </div>
                  <div className="flex flex-col justify-center h-full pt-2 md:pt-4 text-center md:text-left">
                    <h4 className="font-medium text-2xl text-gray-900">{profileName}</h4>
                    <p className="text-base text-gray-500 font-medium">{userEmail}</p>
                  </div>
                </div>
                
                {!personalEditMode && (
                  <button
                    onClick={() => {
                      setPersonalFormData({
                        first_name: user.user_metadata?.first_name || firstName,
                        last_name: user.user_metadata?.last_name || profileName.split(' ').slice(1).join(' '),
                        phone: profilePhone === 'Not yet provided' ? '' : profilePhone,
                        date_of_birth: profile?.date_of_birth || '',
                        address: profile?.address || '',
                        city: profile?.city || '',
                        state: profile?.state || '',
                        pin_code: profile?.pin_code || ''
                      });
                      setPersonalEditMode(true);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold px-5 py-2.5 rounded-xl transition-all w-full sm:w-auto flex-shrink-0 mt-4 md:mt-0"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {!personalEditMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <div className="font-medium text-gray-900 text-base capitalize">{`${user.user_metadata?.first_name || firstName} ${user.user_metadata?.last_name || profileName.split(' ').slice(1).join(' ')}`.trim() || 'Not yet provided'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <div className="font-medium text-gray-900 text-base">{profilePhone}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Date of Birth</label>
                    <div className="font-medium text-gray-900 text-base">
                      {profile?.date_of_birth ? (() => {
                        const parts = profile.date_of_birth.split('-');
                        if (parts.length === 3) {
                          return `${parseInt(parts[2], 10)}-${parseInt(parts[1], 10)}-${parts[0]}`;
                        }
                        return profile.date_of_birth;
                      })() : 'Not yet provided'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Address</label>
                    <div className="font-medium text-gray-900 text-base">{profile?.address || 'Not yet provided'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">City</label>
                    <div className="font-medium text-gray-900 text-base">{profile?.city || 'Not yet provided'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="font-medium text-gray-900 text-base">{userEmail}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Member Since</label>
                    <div className="font-medium text-gray-900 text-base">{joinedDate}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-transparent mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">First Name</label>
                      <input type="text" value={personalFormData.first_name} onChange={e => setPersonalFormData({...personalFormData, first_name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#01AFD1]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Last Name</label>
                      <input type="text" value={personalFormData.last_name} onChange={e => setPersonalFormData({...personalFormData, last_name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#01AFD1]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                      <input type="text" value={personalFormData.phone} onChange={e => setPersonalFormData({...personalFormData, phone: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#01AFD1]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                      <input type="date" value={personalFormData.date_of_birth} onChange={e => setPersonalFormData({...personalFormData, date_of_birth: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#01AFD1]" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                      <input type="text" value={personalFormData.address} onChange={e => setPersonalFormData({...personalFormData, address: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#01AFD1]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                      <input type="text" value={personalFormData.city} onChange={e => setPersonalFormData({...personalFormData, city: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#01AFD1]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                      <input type="text" value={userEmail} disabled className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2.5 outline-none text-gray-500 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handlePersonalSave}
                      disabled={personalSaving}
                      className="bg-[#01AFD1] hover:bg-[#0092b3] text-white font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      {personalSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setPersonalEditMode(false)}
                      disabled={personalSaving}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-2.5 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            {activeTab === 'security' && (
            <div className="w-full bg-white rounded-sm p-6 md:p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Change Password</h3>

              <div className="max-w-md">
                <h4 className="font-bold text-gray-800 mb-4">Change Password</h4>

                {passwordError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-100">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 border border-green-100">
                    {passwordSuccess}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Current Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordFormData.currentPassword}
                    onChange={e => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#01AFD1]"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordFormData.newPassword}
                      onChange={e => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#01AFD1]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordFormData.confirmPassword}
                    onChange={e => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#01AFD1]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button
                    onClick={handlePasswordSave}
                    disabled={passwordSaving || !passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword}
                    className="bg-[#01AFD1] hover:bg-[#0092b3] text-white font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    {passwordSaving ? 'Saving...' : 'Update Password'}
                  </button>
                  <button
                    onClick={handleForgotPassword}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-2.5 rounded-xl transition-all"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'support' && (
              <div className="w-full bg-white rounded-sm p-6 md:p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Help & Support</h3>
                <div className="flex flex-col gap-4">

                  {siteSettings?.whatsapp?.enabled && (
                    <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#01AFD1] text-xl">chat</span>
                          {siteSettings.whatsapp.title || 'WhatsApp'}
                        </h4>
                        {siteSettings.whatsapp.value && <p className="text-sm text-gray-800 font-medium mt-1">{siteSettings.whatsapp.value}</p>}
                        {siteSettings.whatsapp.description && <p className="text-xs text-gray-500 mt-1">{siteSettings.whatsapp.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {siteSettings.whatsapp.value && (
                          <a href={`https://wa.me/${siteSettings.whatsapp.value.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noreferrer" className="text-sm text-[#01AFD1] font-semibold hover:text-[#0092b3] px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">Message</a>
                        )}
                      </div>
                    </div>
                  )}

                  {siteSettings?.call?.enabled && (
                    <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#01AFD1] text-xl">call</span>
                          {siteSettings.call.title || 'Call Us'}
                        </h4>
                        {siteSettings.call.value && <p className="text-sm text-gray-800 font-medium mt-1">{siteSettings.call.value}</p>}
                        {siteSettings.call.description && <p className="text-xs text-gray-500 mt-1">{siteSettings.call.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {siteSettings.call.value && (
                          <a href={`tel:${siteSettings.call.value}`} className="text-sm text-[#01AFD1] font-semibold hover:text-[#0092b3] px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">Call</a>
                        )}
                      </div>
                    </div>
                  )}

                  {siteSettings?.email?.enabled && (
                    <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#01AFD1] text-xl">mail</span>
                          {siteSettings.email.title || 'Email'}
                        </h4>
                        {siteSettings.email.value && <p className="text-sm text-gray-800 font-medium mt-1">{siteSettings.email.value}</p>}
                        {siteSettings.email.description && <p className="text-xs text-gray-500 mt-1">{siteSettings.email.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {siteSettings.email.value && (
                          <a href={`mailto:${siteSettings.email.value}`} className="text-sm text-[#01AFD1] font-semibold hover:text-[#0092b3] px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">Email</a>
                        )}
                      </div>
                    </div>
                  )}

                  {siteSettings?.live_chat?.enabled && (
                    <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#01AFD1] text-xl">support_agent</span>
                          {siteSettings.live_chat.title || 'Live Chat'}
                        </h4>
                        <p className="text-sm text-gray-800 font-medium mt-1">{siteSettings.live_chat.description || 'Need quick help? You can chat with our support team directly.'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => window.dispatchEvent(new CustomEvent('tripomist:open-chatbot'))} className="text-sm text-[#01AFD1] font-semibold hover:text-[#0092b3] px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">Start Chat</button>
                      </div>
                    </div>
                  )}

                  {(!siteSettings || (!siteSettings?.whatsapp?.enabled && !siteSettings?.call?.enabled && !siteSettings?.email?.enabled && !siteSettings?.live_chat?.enabled)) && (
                    <div className="py-8 text-center text-gray-500">
                      Support configuration is currently unavailable. Please check back later.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Next Upcoming Trip Section (Moved down) */}
        <section className="mb-8 hidden">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#01AFD1]">flight_takeoff</span>
            Next Upcoming Trip
          </h2>

          {nextUpcomingTrip ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                {/* Image panel */}
                <div className="md:w-64 md:flex-shrink-0 relative min-h-[180px] md:min-h-0">
                  {nextTripImg ? (
                    <>
                      <img
                        src={nextTripImg}
                        alt={nextUpcomingTrip.package_title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/10"></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#01AFD1] to-teal-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-white/80">luggage</span>
                    </div>
                  )}
                  {daysLeft !== null && (
                    <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10">
                      Starts in {daysLeft} days
                    </div>
                  )}
                </div>

                {/* Details panel */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-xl font-extrabold text-gray-900 leading-tight">
                          {nextUpcomingTrip.package_title}
                        </h3>
                        {nextUpcomingTrip.destination && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[16px] text-gray-400">location_on</span>
                            {nextUpcomingTrip.destination}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200 capitalize">
                          {nextUpcomingTrip.booking_status}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200 capitalize">
                          {nextUpcomingTrip.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-5 pb-5 border-b border-gray-100">
                      <div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Departure Date</span>
                        <span className="font-bold text-gray-800 mt-1 block">
                          {(() => {
                            const parts = nextUpcomingTrip.travel_date.split('-');
                            if (parts.length !== 3) return nextUpcomingTrip.travel_date;
                            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            return `${parseInt(parts[2], 10)} ${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Duration</span>
                        <span className="font-semibold text-gray-800 mt-1 block">
                          {getPackageDuration(nextUpcomingTrip.destination, nextUpcomingTrip.package_title)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Sharing Type</span>
                        <span className="font-semibold text-gray-800 mt-1 block">
                          {nextUpcomingTrip.selected_sharing || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Booking ID</span>
                        <span className=" font-bold text-[#01AFD1] mt-1 block">
                          {nextUpcomingTrip.booking_id || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <Link
                      to={`/my-trip/${nextUpcomingTrip.id}`}
                      className="bg-[#01AFD1] hover:bg-[#0092b3] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                    >
                      View Booking
                    </Link>
                    <Link
                      to={`/my-trip/${nextUpcomingTrip.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                    >
                      View Trip Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-[#01AFD1] font-light">travel_explore</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No upcoming trips yet.</h3>
              <p className="text-gray-500 text-sm mb-5">Start planning your next adventure.</p>
              <Link
                to="/"
                className="inline-flex items-center justify-center bg-[#01AFD1] hover:bg-cyan-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-sm"
              >
                Explore Trips
              </Link>
            </div>
          )}
        </section>



      </main>
      <Footer />
    </div>
  );
}
