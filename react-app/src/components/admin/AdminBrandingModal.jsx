import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import MediaUploader from './MediaUploader';

export default function AdminBrandingModal({ currentBranding, onClose, onUpdate }) {
  const [title, setTitle] = useState(currentBranding?.admin_title || 'TripoMist Admin');
  const [logoUrl, setLogoUrl] = useState(currentBranding?.admin_logo_url || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const brandingObj = {
        admin_title: title,
        admin_logo_url: logoUrl
      };

      const { error } = await supabase.from('site_settings').upsert({
        setting_key: 'admin_branding',
        setting_value: brandingObj,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });

      if (error) throw error;
      
      if (onUpdate) await onUpdate();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error updating admin branding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Admin Branding</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Panel Name</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-[#01AFD1]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TripoMist Admin"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Logo (Optional)</label>
            <MediaUploader 
              url={logoUrl}
              onUrlChange={setLogoUrl}
              folder="admin-branding"
              label="Upload Admin Logo"
              hint="Max 2MB. Png recommended."
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
            {loading ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </div>
    </div>
  );
}
