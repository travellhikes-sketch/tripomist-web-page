import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
      setLoading(false);
    }
    loadProfile();
  }, [navigate]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds the 5MB limit.');
      return;
    }

    // Validate file type
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

      // Upload file to Supabase Storage bucket 'avatars'
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Set the photo state immediately (show preview)
      setEditPhoto(publicUrl);

      // Update Auth user metadata immediately so navbar updates
      const { error: updateErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      if (updateErr) throw updateErr;

      // Upsert into profiles table immediately
      await supabase
        .from('profiles')
        .upsert({
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
    e.preventDefault();
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

      // Upsert into profiles table
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: editName,
            phone: editPhone,
            avatar_url: editPhoto,
            updated_at: new Date().toISOString()
          });
      } catch (upsertErr) {
        console.warn('Profiles table upsert failed (continuing with Auth update):', upsertErr);
      }

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Update profile error:', err);
      setMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans animate-pulse">
        <Navbar />
        <section className="bg-[#136b8a] pt-28 pb-32 relative">
          <div className="max-w-4xl mx-auto px-4">
            <div className="h-4 bg-teal-800/50 rounded w-24 mb-4"></div>
            <div className="h-8 bg-teal-800/50 rounded w-48 mb-2"></div>
            <div className="h-4 bg-teal-800/50 rounded w-64"></div>
          </div>
        </section>
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 -mt-20 pb-20 relative z-20">
          <div className="bg-white rounded-3xl p-8 md:p-10 space-y-6 border border-gray-100 shadow-sm">
            <div className="flex gap-6 items-center border-b border-gray-50 pb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full"></div>
              <div className="flex-1 h-10 bg-gray-100 rounded-xl max-w-md"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <section className="bg-[#136b8a] pt-20 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1400&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 flex items-center gap-2 text-teal-100">
          <Link to="/my-account" className="hover:text-white flex items-center gap-1 transition-colors font-semibold text-sm">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 mt-6 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Edit Profile</h1>
          <p className="text-teal-100 mt-2">Manage your personal details and preferences.</p>
        </div>
      </section>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 -mt-20 pb-20 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleUpdateProfile} className="p-6 md:p-10 pt-8">
            
            {message.text && (
              <div className={`p-4 mb-6 rounded-xl flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                <span className="material-symbols-outlined text-[20px]">
                  {message.type === 'error' ? 'error' : 'check_circle'}
                </span>
                <p className="text-sm font-semibold mt-0.5">{message.text}</p>
              </div>
            )}

            {/* Profile Photo Upload Circle */}
            <div className="flex flex-col md:flex-row gap-8 items-center mb-8 pb-8 border-b border-gray-100">
              <div className="relative group cursor-pointer">
                <label htmlFor="avatar-upload" className="cursor-pointer block relative">
                  <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center border-2 border-dashed border-blue-200 overflow-hidden group-hover:border-primary transition-all relative">
                    {editPhoto ? (
                      <img src={editPhoto} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold flex-col gap-1">
                      <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                      <span>Change</span>
                    </div>

                    {/* Uploading Progress */}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                </label>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={handleImageUpload} 
                  disabled={uploading}
                  className="hidden" 
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="font-bold text-gray-900 text-lg mb-1">Profile Photo</h3>
                <p className="text-gray-500 text-sm">Click the circle to upload a profile image. JPG, PNG, or WEBP. Max size 5MB.</p>
                {uploadError && (
                  <p className="text-red-600 text-xs font-bold mt-2 flex items-center justify-center md:justify-start gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {uploadError}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]/50 focus:border-[#136b8a] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center justify-between">
                  Email Address 
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Read Only</span>
                </label>
                <input 
                  type="email" 
                  value={user.email} 
                  readOnly 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]/50 focus:border-[#136b8a] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                <input 
                  type="text" 
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]/50 focus:border-[#136b8a] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]/50 focus:border-[#136b8a] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
                <select 
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]/50 focus:border-[#136b8a] transition-all bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <Link 
                to="/my-account" 
                className="flex-1 py-4 border border-gray-200 text-gray-750 font-bold rounded-xl text-center hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={saving || uploading}
                className="flex-1 py-4 bg-[#136b8a] hover:bg-[#0f556e] disabled:bg-gray-400 text-white font-bold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>

        </div>
      </main>

      <Footer />
    </div>
  );
}
