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
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/login?redirect=/profile');
      } else {
        setUser(user);
        setEditName(user.user_metadata?.full_name || '');
        setEditPhone(user.user_metadata?.phone || '');
        setEditDob(user.user_metadata?.dob || '');
        setEditGender(user.user_metadata?.gender || '');
        setEditCity(user.user_metadata?.city || user.user_metadata?.address || '');
        setEditPhoto(user.user_metadata?.avatar_url || '');
      }
      setLoading(false);
    });
  }, [navigate]);

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
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      // Clear message after 3s
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

      <section className="bg-[#136b8a] pt-16 pb-32 relative overflow-hidden">
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
          
          <form onSubmit={handleUpdateProfile} className="p-6 md:p-10">
            
            {message.text && (
              <div className={`p-4 mb-6 rounded-xl flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                <span className="material-symbols-outlined text-[20px]">
                  {message.type === 'error' ? 'error' : 'check_circle'}
                </span>
                <p className="text-sm font-semibold mt-0.5">{message.text}</p>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8 items-start mb-8 pb-8 border-b border-gray-100">
              <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-dashed border-blue-200 overflow-hidden">
                {editPhoto ? (
                  <img src={editPhoto} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                )}
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-gray-700 mb-1">Profile Photo URL</label>
                <input 
                  type="url" 
                  value={editPhoto}
                  onChange={(e) => setEditPhoto(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]/50 focus:border-[#136b8a] transition-all bg-gray-50 hover:bg-white"
                />
                <p className="text-xs text-gray-400 mt-2">Enter a direct link to an image to use as your avatar.</p>
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
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">
                  Email Address
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Read Only</span>
                </label>
                <input 
                  type="email" 
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
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
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
              <Link to="/my-account" className="px-6 py-3 text-gray-600 font-bold hover:text-gray-900 transition-colors">
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#136b8a] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0f556e] disabled:bg-gray-400 transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </main>

      <Footer />
    </div>
  );
}
