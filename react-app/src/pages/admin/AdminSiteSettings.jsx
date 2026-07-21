import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Save, AlertCircle, CheckCircle, RefreshCw, 
  Monitor, LayoutTemplate, MessageSquare, Link as LinkIcon, Box
} from 'lucide-react';

const AdminSiteSettings = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Settings states
  const [settings, setSettings] = useState({
    hero: {},
    navbar: {},
    footer: {},
    contact: {},
    social_links: {},
    package_detail_settings: {}
  });

  const TABS = [
    { id: 'hero', label: 'Hero Section', icon: Monitor },
    { id: 'navbar', label: 'Navbar', icon: LayoutTemplate },
    { id: 'footer', label: 'Footer & Contact', icon: LayoutTemplate },
    { id: 'social_links', label: 'Social Media', icon: LinkIcon },
    { id: 'package_detail_settings', label: 'Package Detail', icon: Box },
  ];

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('site_settings')
        .select('*');
      
      if (fetchErr) throw fetchErr;

      if (data) {
        const newSettings = { ...settings };
        data.forEach(item => {
          newSettings[item.setting_key] = item.setting_value;
        });
        setSettings(newSettings);
      }
    } catch (err) {
      console.error('Error fetching site settings:', err);
      setError(err.message || 'Failed to load site settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleChange = (key, field, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleJsonChange = (key, field, valueString) => {
    try {
      const parsed = JSON.parse(valueString);
      setSettings(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          [field]: parsed
        }
      }));
    } catch (e) {
      // Allow invalid typing until save, we'll validate on save or just leave it stringified if needed.
    }
  };

  const handleSave = async (key) => {
    setSaving(true);
    setError(null);
    try {
      const { error: upsertErr } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: key, 
          setting_value: settings[key],
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (upsertErr) throw upsertErr;

      // Special case: if saving footer, also save contact
      if (key === 'footer') {
        const { error: contactErr } = await supabase
          .from('site_settings')
          .upsert({ 
            setting_key: 'contact', 
            setting_value: settings.contact,
            updated_at: new Date().toISOString()
          }, { onConflict: 'setting_key' });
        if (contactErr) throw contactErr;
      }

      setSuccess('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <RefreshCw size={32} className="animate-spin mb-3" />
        <span className="text-sm">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-500 mt-1">Manage global website configuration and content.</p>
        </div>
        <button
          onClick={() => fetchSettings()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Reload
        </button>
      </div>

      {success && (
        <div className="bg-green-50 text-green-800 text-sm px-4 py-3 rounded-lg border border-green-200 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
        {/* Tabs sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4">
          <nav className="flex md:flex-col gap-1 overflow-x-auto hide-scrollbar">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 p-6 md:p-8 min-h-[500px]">
          
          {/* HERO TAB */}
          {activeTab === 'hero' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Hero Section Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Media Type</label>
                  <select 
                    value={settings.hero.media_type || 'video'} 
                    onChange={e => handleChange('hero', 'media_type', e.target.value)}
                    className={inputClass}
                  >
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Active</label>
                  <select 
                    value={settings.hero.is_active !== false ? 'true' : 'false'} 
                    onChange={e => handleChange('hero', 'is_active', e.target.value === 'true')}
                    className={inputClass}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No (Hide Hero)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Desktop Media URL</label>
                  <input type="text" value={settings.hero.desktop_media_url || ''} onChange={e => handleChange('hero', 'desktop_media_url', e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Mobile Media URL</label>
                  <input type="text" value={settings.hero.mobile_media_url || ''} onChange={e => handleChange('hero', 'mobile_media_url', e.target.value)} className={inputClass} placeholder="https://..." />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Heading (HTML allowed)</label>
                  <input type="text" value={settings.hero.heading || ''} onChange={e => handleChange('hero', 'heading', e.target.value)} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Subtitle (HTML allowed)</label>
                  <input type="text" value={settings.hero.subtitle || ''} onChange={e => handleChange('hero', 'subtitle', e.target.value)} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Primary Button Text</label>
                  <input type="text" value={settings.hero.primary_button_text || ''} onChange={e => handleChange('hero', 'primary_button_text', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Primary Button Route</label>
                  <input type="text" value={settings.hero.primary_button_route || ''} onChange={e => handleChange('hero', 'primary_button_route', e.target.value)} className={inputClass} />
                </div>
                
                <div>
                  <label className={labelClass}>Secondary Button Text</label>
                  <input type="text" value={settings.hero.secondary_button_text || ''} onChange={e => handleChange('hero', 'secondary_button_text', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Secondary Button Route</label>
                  <input type="text" value={settings.hero.secondary_button_route || ''} onChange={e => handleChange('hero', 'secondary_button_route', e.target.value)} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Overlay Opacity (0-100)</label>
                  <input type="number" min="0" max="100" value={settings.hero.overlay_opacity || '30'} onChange={e => handleChange('hero', 'overlay_opacity', e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('hero')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Hero Settings'}
                </button>
              </div>
            </div>
          )}

          {/* NAVBAR TAB */}
          {activeTab === 'navbar' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Navbar Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Logo Text</label>
                  <input type="text" value={settings.navbar.logo_text || ''} onChange={e => handleChange('navbar', 'logo_text', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Logo Image URL (Overrides text if set)</label>
                  <input type="text" value={settings.navbar.logo_image_url || ''} onChange={e => handleChange('navbar', 'logo_image_url', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Search Placeholder</label>
                  <input type="text" value={settings.navbar.search_placeholder || ''} onChange={e => handleChange('navbar', 'search_placeholder', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Menu Button Text (Mobile)</label>
                  <input type="text" value={settings.navbar.menu_button_text || ''} onChange={e => handleChange('navbar', 'menu_button_text', e.target.value)} className={inputClass} />
                </div>
                
                <div className="md:col-span-2">
                  <label className={labelClass}>Main Links</label>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                    <p className="font-medium">Manage links, icons, badges, mega menus, schedules, and visibility from Website Pages → Menu Manager.</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('navbar')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Navbar Settings
                </button>
              </div>
            </div>
          )}

          {/* FOOTER TAB */}
          {activeTab === 'footer' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Footer & Contact Info</h2>
              <div className="grid grid-cols-1 gap-6">
                
                <div>
                  <label className={labelClass}>Company Description</label>
                  <textarea value={settings.footer.company_description || ''} onChange={e => handleChange('footer', 'company_description', e.target.value)} className={inputClass} rows={3} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input type="text" value={settings.contact.phone || ''} onChange={e => handleChange('contact', 'phone', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="text" value={settings.contact.email || ''} onChange={e => handleChange('contact', 'email', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Address</label>
                    <input type="text" value={settings.contact.address || ''} onChange={e => handleChange('contact', 'address', e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Copyright Text</label>
                  <input type="text" value={settings.footer.copyright_text || ''} onChange={e => handleChange('footer', 'copyright_text', e.target.value)} className={inputClass} />
                </div>

                <div className="md:col-span-1">
                  <label className={labelClass}>Footer Navigation</label>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                    <p className="font-medium">Manage links, icons, badges, mega menus, schedules, and visibility from Website Pages → Menu Manager.</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('footer')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Footer Settings
                </button>
              </div>
            </div>
          )}

          {/* SOCIAL MEDIA TAB */}
          {activeTab === 'social_links' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Social Media URLs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Twitter</label>
                  <input type="url" value={settings.social_links.twitter || ''} onChange={e => handleChange('social_links', 'twitter', e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
                <div>
                  <label className={labelClass}>Instagram</label>
                  <input type="url" value={settings.social_links.instagram || ''} onChange={e => handleChange('social_links', 'instagram', e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
                <div>
                  <label className={labelClass}>Facebook</label>
                  <input type="url" value={settings.social_links.facebook || ''} onChange={e => handleChange('social_links', 'facebook', e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
                <div>
                  <label className={labelClass}>YouTube</label>
                  <input type="url" value={settings.social_links.youtube || ''} onChange={e => handleChange('social_links', 'youtube', e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp Link</label>
                  <input type="url" value={settings.social_links.whatsapp || ''} onChange={e => handleChange('social_links', 'whatsapp', e.target.value)} className={inputClass} placeholder="https://wa.me/..." />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('social_links')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Social Links
                </button>
              </div>
            </div>
          )}

          {/* PACKAGE DETAIL TAB */}
          {activeTab === 'package_detail_settings' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Package Detail Page Defaults</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                  <label className={labelClass}>Default Badge Text</label>
                  <input type="text" value={settings.package_detail_settings.default_badge_text || ''} onChange={e => handleChange('package_detail_settings', 'default_badge_text', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Show Badge</label>
                  <select 
                    value={settings.package_detail_settings.show_badge !== false ? 'true' : 'false'} 
                    onChange={e => handleChange('package_detail_settings', 'show_badge', e.target.value === 'true')}
                    className={inputClass}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                
                <div>
                  <label className={labelClass}>GST Label</label>
                  <input type="text" value={settings.package_detail_settings.gst_label || ''} onChange={e => handleChange('package_detail_settings', 'gst_label', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Default Enquiry Button Text</label>
                  <input type="text" value={settings.package_detail_settings.default_enquiry_text || ''} onChange={e => handleChange('package_detail_settings', 'default_enquiry_text', e.target.value)} className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>WhatsApp Number</label>
                  <input type="text" value={settings.package_detail_settings.whatsapp_number || ''} onChange={e => handleChange('package_detail_settings', 'whatsapp_number', e.target.value)} className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>WhatsApp Message Template</label>
                  <p className="text-xs text-gray-500 mb-2">Available placeholders: {"{package_title}"}, {"{price}"}, {"{duration}"}, {"{travellers}"}, {"{departure_from}"}</p>
                  <textarea 
                    value={settings.package_detail_settings.whatsapp_template || ''} 
                    onChange={e => handleChange('package_detail_settings', 'whatsapp_template', e.target.value)} 
                    className={inputClass} 
                    rows={5} 
                  />
                </div>
                
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('package_detail_settings')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Package Defaults
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminSiteSettings;
