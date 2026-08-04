import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Save, AlertCircle, CheckCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';
import MediaUploader from '../../components/admin/MediaUploader';

const AdminWebsitePages = () => {
  const { pageKey } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const defaultContent = {
    paragraphs: [],
    sections: [],
    contact: { email: '', phone: '' }
  };

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    hero_image_url: '',
    mobile_banner_image: '',
    seo_title: '',
    seo_description: '',
    is_active: true,
    content: defaultContent
  });

  const fetchPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('website_pages')
        .select('*')
        .eq('page_key', pageKey)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

      if (data) {
        setFormData({
          title: data.title || '',
          subtitle: data.subtitle || '',
          hero_image_url: data.hero_image_url || '',
          mobile_banner_image: data.mobile_banner_image || '',
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          is_active: data.is_active ?? true,
          content: { ...defaultContent, ...(data.content || {}) }
        });
      } else {
        // Reset if not found
        setFormData({
          title: '', subtitle: '', hero_image_url: '', mobile_banner_image: '', seo_title: '', seo_description: '',
          is_active: true, content: defaultContent
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pageKey) {
      fetchPage();
    }
  }, [pageKey]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('website_pages')
        .upsert({
          page_key: pageKey,
          title: formData.title,
          subtitle: formData.subtitle,
          hero_image_url: formData.hero_image_url,
          mobile_banner_image: formData.mobile_banner_image,
          seo_title: formData.seo_title,
          seo_description: formData.seo_description,
          is_active: formData.is_active,
          content: formData.content,
          updated_at: new Date().toISOString()
        }, { onConflict: 'page_key' });

      if (error) throw error;
      setSuccess('Page saved successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Content Handlers
  const handleParagraphChange = (index, value) => {
    const newParagraphs = [...formData.content.paragraphs];
    newParagraphs[index] = value;
    setFormData(prev => ({ ...prev, content: { ...prev.content, paragraphs: newParagraphs }}));
  };

  const addParagraph = () => {
    setFormData(prev => ({ ...prev, content: { ...prev.content, paragraphs: [...(prev.content.paragraphs || []), ''] }}));
  };

  const removeParagraph = (index) => {
    const newParagraphs = [...formData.content.paragraphs];
    newParagraphs.splice(index, 1);
    setFormData(prev => ({ ...prev, content: { ...prev.content, paragraphs: newParagraphs }}));
  };

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        sections: [...(prev.content.sections || []), { heading: '', text: '', bullets: [] }]
      }
    }));
  };

  const removeSection = (index) => {
    const newSections = [...formData.content.sections];
    newSections.splice(index, 1);
    setFormData(prev => ({ ...prev, content: { ...prev.content, sections: newSections }}));
  };

  const updateSection = (index, field, value) => {
    const newSections = [...formData.content.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setFormData(prev => ({ ...prev, content: { ...prev.content, sections: newSections }}));
  };

  const updateSectionBullets = (index, bulletsString) => {
    const newSections = [...formData.content.sections];
    newSections[index] = { ...newSections[index], bullets: bulletsString.split('\n').filter(b => b.trim() !== '') };
    setFormData(prev => ({ ...prev, content: { ...prev.content, sections: newSections }}));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <RefreshCw className="animate-spin mr-2" size={24} /> Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{pageKey.replace('-', ' ')} Page</h1>
          <p className="text-gray-500 mt-1">Manage content and SEO settings for this page.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 mb-6 border border-red-100">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 mb-6 border border-emerald-100">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-lg text-gray-800 border-b pb-2">Header Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Title / Main Heading</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#136b8a] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (Optional)</label>
              <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#136b8a] outline-none" />
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desktop Banner Image (hero_image_url)</label>
                <MediaUploader
                  currentImage={formData.hero_image_url}
                  onImageUploaded={(url) => setFormData(prev => ({...prev, hero_image_url: url}))}
                  onImageRemoved={() => setFormData(prev => ({...prev, hero_image_url: ''}))}
                  folder="website_pages"
                  bucket="public_assets"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Banner Image (Optional fallback)</label>
                <MediaUploader
                  currentImage={formData.mobile_banner_image}
                  onImageUploaded={(url) => setFormData(prev => ({...prev, mobile_banner_image: url}))}
                  onImageRemoved={() => setFormData(prev => ({...prev, mobile_banner_image: ''}))}
                  folder="website_pages"
                  bucket="public_assets"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center mt-2">
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 mr-2" />
              <label className="text-sm font-medium text-gray-700">Page is Active (Visible to public)</label>
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-lg text-gray-800 border-b pb-2">SEO Settings</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title (Optional)</label>
            <input type="text" value={formData.seo_title} onChange={e => setFormData({...formData, seo_title: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#136b8a] outline-none" placeholder="Defaults to Page Title if empty" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
            <textarea value={formData.seo_description} onChange={e => setFormData({...formData, seo_description: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#136b8a] outline-none" rows={2} />
          </div>
        </div>

        {/* Content Builder */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <h2 className="font-bold text-lg text-gray-800 border-b pb-2">Page Content</h2>

          {/* Main Paragraphs */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 flex justify-between items-center">
              Main Paragraphs
              <button type="button" onClick={addParagraph} className="text-sm text-[#136b8a] hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1"><Plus size={14} /> Add Paragraph</button>
            </h3>
            {formData.content?.paragraphs?.map((p, i) => (
              <div key={i} className="flex gap-2">
                <textarea value={p} onChange={e => handleParagraphChange(i, e.target.value)} className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#136b8a] outline-none" rows={3} placeholder="Paragraph text..." />
                <button type="button" onClick={() => removeParagraph(i)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg h-fit"><Trash2 size={18} /></button>
              </div>
            ))}
            {(!formData.content?.paragraphs || formData.content.paragraphs.length === 0) && <p className="text-sm text-gray-400 italic">No paragraphs added.</p>}
          </div>

          {/* Sections */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <h3 className="font-semibold text-gray-700 flex justify-between items-center">
              Sections (Headings & Lists)
              <button type="button" onClick={addSection} className="text-sm text-[#136b8a] hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1"><Plus size={14} /> Add Section</button>
            </h3>
            {formData.content?.sections?.map((sec, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 relative">
                <button type="button" onClick={() => removeSection(i)} className="absolute top-3 right-3 text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heading</label>
                  <input type="text" value={sec.heading || ''} onChange={e => updateSection(i, 'heading', e.target.value)} className="w-full p-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-[#136b8a] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Text (Optional)</label>
                  <textarea value={sec.text || ''} onChange={e => updateSection(i, 'text', e.target.value)} className="w-full p-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-[#136b8a] outline-none" rows={2} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bullet Points (One per line)</label>
                  <textarea value={(sec.bullets || []).join('\n')} onChange={e => updateSectionBullets(i, e.target.value)} className="w-full p-2 border border-gray-200 rounded text-sm font-mono focus:ring-1 focus:ring-[#136b8a] outline-none" rows={4} placeholder="- First point&#10;- Second point" />
                </div>
              </div>
            ))}
            {(!formData.content?.sections || formData.content.sections.length === 0) && <p className="text-sm text-gray-400 italic">No sections added.</p>}
          </div>

          {/* Contact Info (if relevant) */}
          <div className="space-y-3 pt-4 border-t border-gray-50">
            <h3 className="font-semibold text-gray-700">Contact Information Display</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Support Email</label>
                <input type="email" value={formData.content?.contact?.email || ''} onChange={e => setFormData(prev => ({...prev, content: {...prev.content, contact: {...prev.content.contact, email: e.target.value}}}))} className="w-full p-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Support Phone</label>
                <input type="text" value={formData.content?.contact?.phone || ''} onChange={e => setFormData(prev => ({...prev, content: {...prev.content, contact: {...prev.content.contact, phone: e.target.value}}}))} className="w-full p-2 border border-gray-200 rounded text-sm outline-none" />
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-3 sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm">
          <button type="button" onClick={() => fetchPage()} className="px-6 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">Reset</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 text-white bg-[#136b8a] rounded-xl hover:bg-[#0f556e] font-medium flex items-center gap-2 disabled:opacity-50">
            <Save size={18} /> {saving ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminWebsitePages;
