import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import MediaUploader from './MediaUploader';

export default function AdminProfileModal({ currentProfile, onClose, onUpdate }) {
  const [fullName, setFullName] = useState(currentProfile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile?.avatar_url || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) throw error;
      
      if (onUpdate) await onUpdate();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-[#01AFD1]"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Photo</label>
            <MediaUploader 
              url={avatarUrl}
              onUrlChange={setAvatarUrl}
              folder="admin-profiles"
              label="Upload Profile Photo"
              hint="Max 2MB. Jpeg, Png."
            />
          </div>
        </div>

        <div className="flex items-center justify-end p-4 border-t border-gray-100 gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#01AFD1] hover:bg-[#0092b3] rounded-md disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
