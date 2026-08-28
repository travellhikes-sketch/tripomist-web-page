import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('My Profile');

  // Edit States
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPhoto, setEditPhoto] = useState('');

  const [message, setMessage] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  // Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/login?redirect=/profile');
        return;
      }

      setUser(currentUser);
      setEditName(currentUser.user_metadata?.full_name || '');
      setEditPhone(currentUser.user_metadata?.phone || '');
      setEditDob(currentUser.user_metadata?.dob || '');
      setEditGender(currentUser.user_metadata?.gender || '');
      setEditCity(currentUser.user_metadata?.city || currentUser.user_metadata?.address || '');
      setEditPhoto(currentUser.user_metadata?.avatar_url || '');

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('travel_date', { ascending: true });

      if (bookingsData) {
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
      setLoading(false);
    }
    loadProfile();
  }, [navigate]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds the 5MB limit.');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, and WEBP formats are allowed.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setEditPhoto(publicUrl);

      const { error: updateErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      if (updateErr) throw updateErr;

      await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      });

      setMessage({ text: 'Profile photo uploaded successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Image upload failed:', err);
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: editName,
          phone: editPhone,
          dob: editDob,
          gender: editGender,
          city: editCity,
          avatar_url: editPhoto
        }
      });
      if (error) throw error;

      setUser(data.user);

      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: editName,
          phone: editPhone,
          avatar_url: editPhoto,
          updated_at: new Date().toISOString()
        });
      } catch (upsertErr) {}

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Update profile error:', err);
      setMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    navigate('/');
    setTimeout(async () => {
      await supabase.auth.signOut();
    }, 50);
  };

  const tabs = [
    { id: 'My Profile', icon: 'person' },
    { id: 'Personal Information', icon: 'badge' },
    { id: 'Contact Information', icon: 'contact_mail' },
    { id: 'Security', icon: 'security' },
    { id: 'My Trips', icon: 'luggage' },
    { id: 'Notifications', icon: 'notifications' },
    { id: 'Logout', icon: 'logout', action: handleLogout, textClass: 'text-red-500' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col ">
        <Navbar />
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-[#01AFD1] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col ">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Account Settings</h1>

        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.action ? tab.action() : setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-[#01AFD1]'
                      : `text-gray-600 hover:bg-gray-50 ${tab.textClass || ''}`
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'text-[#01AFD1]' : 'text-gray-400'}`}>
                    {tab.icon}
                  </span>
                  {tab.id}
                </button>
              ))}
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">

              {message.text && (
                <div className={`p-4 mb-6 rounded-xl flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {message.type === 'error' ? 'error' : 'check_circle'}
                  </span>
                  <p className="text-sm font-semibold mt-0.5">{message.text}</p>
                </div>
              )}

              {/* My Profile Tab */}
              {activeTab === 'My Profile' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
                    <button onClick={handleUpdateProfile} disabled={saving} className="text-sm font-bold text-[#01AFD1] hover:underline flex items-center gap-1">
                      {saving ? 'Saving...' : <><span className="material-symbols-outlined text-[16px]">edit</span> Edit</>}
                    </button>
                  </div>

                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative group">
                      <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        {editPhoto ? (
                          <img src={editPhoto} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex justify-center items-center text-gray-400 font-bold text-2xl">
                            {editName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-[#01AFD1] text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-[#0092b3] transition-colors">
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                      </label>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{editName || 'Traveler'}</h3>
                      <p className="text-sm text-gray-500">{editCity || 'Location not set'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Full Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#01AFD1] text-gray-800 font-medium bg-transparent" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Bio / City</label>
                      <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#01AFD1] text-gray-800 font-medium bg-transparent" />
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information Tab */}
              {activeTab === 'Personal Information' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                    <button onClick={handleUpdateProfile} disabled={saving} className="text-sm font-bold text-[#01AFD1] hover:underline flex items-center gap-1">
                      {saving ? 'Saving...' : <><span className="material-symbols-outlined text-[16px]">edit</span> Edit</>}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">First Name</label>
                      <input type="text" value={editName.split(' ')[0]} onChange={(e) => setEditName(e.target.value + ' ' + (editName.split(' ')[1] || ''))} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#01AFD1] text-gray-800 font-medium bg-transparent" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Last Name</label>
                      <input type="text" value={editName.split(' ')[1] || ''} onChange={(e) => setEditName(editName.split(' ')[0] + ' ' + e.target.value)} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#01AFD1] text-gray-800 font-medium bg-transparent" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Date of Birth</label>
                      <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#01AFD1] text-gray-800 font-medium bg-transparent" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Gender</label>
                      <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#01AFD1] text-gray-800 font-medium bg-transparent">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information Tab */}
              {activeTab === 'Contact Information' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
                    <button onClick={handleUpdateProfile} disabled={saving} className="text-sm font-bold text-[#01AFD1] hover:underline flex items-center gap-1">
                      {saving ? 'Saving...' : <><span className="material-symbols-outlined text-[16px]">edit</span> Edit</>}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Email Address (Read Only)</label>
                      <input type="email" value={user.email} readOnly className="w-full border-b border-gray-200 py-2 focus:outline-none text-gray-500 font-medium bg-transparent cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Phone Number</label>
                      <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#01AFD1] text-gray-800 font-medium bg-transparent" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Address / City</label>
                      <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#01AFD1] text-gray-800 font-medium bg-transparent" />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'Security' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
                  <p className="text-sm text-gray-500 mb-4">You can reset your password by entering your email address below.</p>
                  <Link to="/forgot-password" className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors">
                    Reset Password
                  </Link>
                </div>
              )}

              {/* My Trips Tab */}
              {activeTab === 'My Trips' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">My Trips</h2>
                    <Link to="/my-trips" className="text-sm font-bold text-[#01AFD1] hover:underline">View All</Link>
                  </div>

                  {bookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bookings.slice(0, 4).map(booking => (
                        <Link key={booking.id} to={`/my-trip/${booking.id}`} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:shadow-md transition-all group">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {(booking.banner_image || booking.image_url) ? (
                              <img src={booking.banner_image || booking.image_url} alt="Trip" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            ) : (
                              <span className="material-symbols-outlined text-gray-400 flex items-center justify-center w-full h-full">luggage</span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{booking.package_title}</h4>
                            <p className="text-xs text-gray-500 font-semibold">{booking.booking_status}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No trips booked yet.</p>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'Notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Notifications</h2>
                  <p className="text-sm text-gray-500">You currently have no new notifications.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
