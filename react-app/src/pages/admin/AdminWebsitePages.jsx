import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Save, AlertCircle, CheckCircle, RefreshCw, Eye, Edit3,
  Undo, Redo, Bold, Italic, Underline, List, ListOrdered,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Eraser
} from 'lucide-react';
import MediaUploader from '../../components/admin/MediaUploader';

// Simple, beautiful, custom Rich Text Editor component
const RichTextEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '<p><br></p>';
    }
  }, [value]);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleLink = () => {
    const url = prompt("Enter URL link:");
    if (url) {
      exec("createLink", url);
    }
  };

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-gray-200">
        <button type="button" onClick={() => exec('undo')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Undo"><Undo size={16} /></button>
        <button type="button" onClick={() => exec('redo')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Redo"><Redo size={16} /></button>
        <div className="w-[1px] bg-gray-300 mx-1" />
        <select onChange={(e) => exec('formatBlock', e.target.value)} className="text-xs border rounded px-2 py-1 bg-white font-medium text-gray-700 outline-none" defaultValue="P">
          <option value="P">Paragraph</option>
          <option value="H1">Heading 1</option>
          <option value="H2">Heading 2</option>
          <option value="H3">Heading 3</option>
        </select>
        <div className="w-[1px] bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('bold')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 font-bold" title="Bold"><Bold size={16} /></button>
        <button type="button" onClick={() => exec('italic')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 italic" title="Italic"><Italic size={16} /></button>
        <button type="button" onClick={() => exec('underline')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 underline" title="Underline"><Underline size={16} /></button>
        <div className="w-[1px] bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Bulleted List"><List size={16} /></button>
        <button type="button" onClick={() => exec('insertOrderedList')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Numbered List"><ListOrdered size={16} /></button>
        <button type="button" onClick={handleLink} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Insert Link"><LinkIcon size={16} /></button>
        <div className="w-[1px] bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('justifyLeft')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Align Left"><AlignLeft size={16} /></button>
        <button type="button" onClick={() => exec('justifyCenter')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Align Center"><AlignCenter size={16} /></button>
        <button type="button" onClick={() => exec('justifyRight')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Align Right"><AlignRight size={16} /></button>
        <div className="w-[1px] bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('removeFormat')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Clear Formatting"><Eraser size={16} /></button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto outline-none prose max-w-none text-left text-gray-800"
        style={{ direction: 'ltr' }}
      />
    </div>
  );
};

const AdminWebsitePages = () => {
  const { pageKey } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    hero_image_url: '',
    mobile_banner_image: '',
    seo_title: '',
    seo_description: '',
    is_active: true,
    content: ''
  });

  const convertContentToHtml = (content) => {
    if (typeof content === 'string') return content;
    if (!content) return '';
    let html = '';
    if (content.paragraphs && Array.isArray(content.paragraphs)) {
      content.paragraphs.forEach(p => {
        html += `<p>${p}</p>`;
      });
    }
    if (content.sections && Array.isArray(content.sections)) {
      content.sections.forEach(sec => {
        if (sec.heading) html += `<h2>${sec.heading}</h2>`;
        if (sec.text) html += `<p>${sec.text}</p>`;
        if (sec.bullets && Array.isArray(sec.bullets)) {
          html += `<ul>`;
          sec.bullets.forEach(b => {
            html += `<li>${b}</li>`;
          });
          html += `</ul>`;
        }
      });
    }
    if (content.contact) {
      if (content.contact.email || content.contact.phone) {
        html += `<h3>Contact Information</h3>`;
        html += `<p>`;
        if (content.contact.email) html += `<strong>Email:</strong> <a href="mailto:${content.contact.email}">${content.contact.email}</a><br/>`;
        if (content.contact.phone) html += `<strong>Phone:</strong> ${content.contact.phone}`;
        html += `</p>`;
      }
    }
    return html;
  };

  const fetchPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('website_pages')
        .select('*')
        .eq('page_key', pageKey)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          title: data.title || '',
          subtitle: data.subtitle || '',
          hero_image_url: data.hero_image_url || '',
          mobile_banner_image: data.mobile_banner_image || '',
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          is_active: data.is_active ?? true,
          content: convertContentToHtml(data.content)
        });
      } else {
        setFormData({
          title: '', subtitle: '', hero_image_url: '', mobile_banner_image: '', seo_title: '', seo_description: '',
          is_active: true, content: ''
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
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('website_pages')
        .upsert({
          page_key: pageKey,
          title: formData.title,
          subtitle: formData.subtitle,
          hero_image_url: formData.hero_image_url || null,
          mobile_banner_image: formData.mobile_banner_image || null,
          seo_title: formData.seo_title || null,
          seo_description: formData.seo_description || null,
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

  const sanitizeHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/on\w+\s*=\s*\w+/gi, '')
      .replace(/javascript:/gi, '#');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <RefreshCw className="animate-spin mr-2" size={24} /> Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{pageKey.replace('-', ' ')} Page</h1>
          <p className="text-gray-500 mt-1">Manage content, media, and SEO settings for this page.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 bg-white text-sm font-medium"
          >
            {isPreviewMode ? <Edit3 size={16} /> : <Eye size={16} />}
            {isPreviewMode ? 'Edit Mode' : 'Preview Page'}
          </button>
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

      {isPreviewMode ? (
        /* Render Premium Layout Preview */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Preview Mode (Simulated Layout)
            </div>

            {/* Optional Banner */}
            {formData.hero_image_url && (
              <div className="w-full px-6 pt-6">
                <div className="relative w-full h-[200px] md:h-[300px] rounded-[24px] overflow-hidden shadow-md">
                  <img
                    src={formData.hero_image_url}
                    alt={formData.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="p-6 md:p-12">
              <div className="mb-8 border-b border-gray-100 pb-6 text-left">
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
                  {formData.title || 'Page Title'}
                </h1>
                {formData.subtitle && (
                  <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
                    {formData.subtitle}
                  </p>
                )}
              </div>
              <div
                className="prose max-w-none text-left text-base md:text-lg leading-relaxed text-[#3e4850]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.content) }}
              />
            </div>
          </div>
        </div>
      ) : (
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

          {/* Premium Rich Content Editor */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-bold text-lg text-gray-800 border-b pb-2">Page Content</h2>
            <RichTextEditor
              value={formData.content}
              onChange={(newHtml) => setFormData(prev => ({ ...prev, content: newHtml }))}
            />
          </div>

          <div className="flex justify-end gap-3 sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm z-10">
            <button type="button" onClick={fetchPage} className="px-6 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">Reset</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-white bg-[#136b8a] rounded-xl hover:bg-[#0f556e] font-medium flex items-center gap-2 disabled:opacity-50">
              <Save size={18} /> {saving ? 'Saving...' : 'Save Page'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminWebsitePages;
