import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User, Save, Shield, Phone, Mail } from 'lucide-react';

const CustomerProfile = () => {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    emergency_contact: ''
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setEmail(session.user.email || '');
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          emergency_contact: data.emergency_contact || ''
        });
      }
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      const updates = {
        id: session.user.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        emergency_contact: profile.emergency_contact,
        updated_at: new Date()
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      
      if (error) throw error;
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01AFD1]"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and contact details.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-8 flex flex-col items-center border-b border-gray-200">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-3xl mb-4">
            {profile.first_name?.charAt(0) || 'C'}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{profile.first_name} {profile.last_name}</h2>
          <p className="text-gray-500 text-sm">{email}</p>
        </div>
        
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2"><User size={16}/> Personal Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isEditing ? (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  disabled 
                  type="text" 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed outline-none" 
                  value={`${profile.first_name} ${profile.last_name}`.trim()} 
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">First Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#01AFD1] outline-none" 
                    value={profile.first_name} 
                    onChange={e=>setProfile({...profile, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#01AFD1] outline-none" 
                    value={profile.last_name} 
                    onChange={e=>setProfile({...profile, last_name: e.target.value})}
                  />
                </div>
              </>
            )}
          </div>
          
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 mt-8 flex items-center gap-2"><Phone size={16}/> Contact Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <input 
                  disabled 
                  type="email" 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed pl-10" 
                  value={email} 
                />
                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Shield size={10}/> Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
              <input 
                disabled={!isEditing}
                type="tel" 
                className={`w-full px-4 py-2 border rounded-lg outline-none ${!isEditing ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:border-[#01AFD1]'}`} 
                value={profile.phone} 
                onChange={e=>setProfile({...profile, phone: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Emergency Contact (Optional)</label>
              <input 
                disabled={!isEditing}
                type="text" 
                placeholder="Name & Phone Number"
                className={`w-full px-4 py-2 border rounded-lg outline-none ${!isEditing ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:border-[#01AFD1]'}`} 
                value={profile.emergency_contact} 
                onChange={e=>setProfile({...profile, emergency_contact: e.target.value})}
              />
              <p className="text-[10px] text-gray-500 mt-1">We will only contact them in case of an emergency during your trip.</p>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${message.includes('Error') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-end pt-4 gap-3">
            {!isEditing ? (
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                className="bg-[#01AFD1] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#0092b3] transition-colors flex items-center gap-2 cursor-pointer"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={() => { setIsEditing(false); fetchProfile(); }}
                  className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="bg-[#01AFD1] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#0092b3] transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerProfile;
