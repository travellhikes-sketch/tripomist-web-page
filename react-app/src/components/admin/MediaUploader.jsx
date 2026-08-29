import React, { useState } from 'react';
import { UploadCloud, X, Image as ImageIcon, Video } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient'; // Ensure correct path

export default function MediaUploader({ 
  url, 
  onUrlChange, 
  bucket = 'website-assets', // Unused now, forced below
  folder = 'uploads',
  label = 'Hero Banner / Media',
  hint = ''
}) {
  const [uploading, setUploading] = useState(false);

  const isVideo = (mediaUrl) => {
    if (!mediaUrl) return false;
    const lowerUrl = mediaUrl.toLowerCase();
    return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.ogg') || lowerUrl.includes('video');
  };

  const handleUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('website-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('website-assets')
        .getPublicUrl(filePath);

      onUrlChange(publicUrl);
    } catch (error) {
      alert('Error uploading media! Make sure the bucket exists and permissions are set.');
      console.error('Upload Error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-3">{hint}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <input 
          type="text" 
          value={url} 
          onChange={e => onUrlChange(e.target.value)} 
          placeholder="Paste URL (https://...)" 
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#01AFD1] outline-none" 
        />
        <label className="bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm font-medium transition-colors shrink-0">
          {uploading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <UploadCloud size={18} />
          )}
          Upload
          <input 
            type="file" 
            accept="image/*,video/*" 
            className="hidden" 
            onChange={handleUpload} 
            disabled={uploading} 
          />
        </label>
        {url && (
          <button 
            type="button" 
            onClick={() => onUrlChange('')}
            className="px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium shrink-0"
            title="Remove Media"
          >
            <X size={16} />
            Remove
          </button>
        )}
      </div>

      {url && (
        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 bg-black/5 relative max-w-sm aspect-video flex items-center justify-center">
          {isVideo(url) ? (
            <video src={url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
          ) : (
            <img src={url} className="w-full h-full object-cover" alt="Media Preview" />
          )}
          <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs backdrop-blur-sm flex items-center gap-1">
            {isVideo(url) ? <Video size={12}/> : <ImageIcon size={12}/>}
            {isVideo(url) ? 'Video' : 'Image'}
          </div>
        </div>
      )}
    </div>
  );
}
