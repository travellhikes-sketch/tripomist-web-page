import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Save, AlertCircle, CheckCircle, RefreshCw,
  Monitor, LayoutTemplate, MessageSquare, Link as LinkIcon, Box,
  Shield, BarChart2, Trash2, ArrowUp, ArrowDown, Plus
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
    package_detail_settings: {},
    trust_benefits: {},
    stats_strip: {},
    testimonials_section: {}
  });

  const TABS = [
    { id: 'hero', label: 'Hero Section', icon: Monitor },
    { id: 'navbar', label: 'Navbar & IG Badge', icon: LayoutTemplate },
    { id: 'footer', label: 'Footer & Contact', icon: LayoutTemplate },
    { id: 'social_links', label: 'Social Media', icon: LinkIcon },
    { id: 'package_detail_settings', label: 'Package Detail', icon: Box },
    { id: 'trust_benefits', label: 'Trust & Benefits', icon: Shield },
    { id: 'stats_strip', label: 'Stats Strip', icon: BarChart2 }
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

        // Prefill default structures if missing
        if (!newSettings.trust_benefits || !newSettings.trust_benefits.cards) {
          newSettings.trust_benefits = {
            is_active: true,
            title: 'The TripoMist Experience',
            subtitle: "We don't just organize trips; we curate experiences. Here's why 50,000+ travellers choose us",
            cards: [
              { id: '1', heading: 'Handpicked Stays', description: 'We personally verify every hotel, homestay, and camp to ensure premium comfort and safety.', icon: 'Home', is_active: true },
              { id: '2', heading: 'Certified Guides', description: 'Travel with experienced trip captains who know the mountains like the back of their hand.', icon: 'Shield', is_active: true },
              { id: '3', heading: 'Small Groups', description: 'Intimate group sizes (12-16 pax) ensure personal attention and stronger bonds among travellers.', icon: 'Users', is_active: true },
              { id: '4', heading: 'Local Community', description: 'Start your journey from Delhi with like-minded locals. Pre-trip meetups to break the ice.', icon: 'Sparkles', is_active: true }
            ]
          };
        }
        if (!newSettings.stats_strip || !newSettings.stats_strip.cards) {
          newSettings.stats_strip = {
            is_active: true,
            cards: [
              { id: '1', value: '4.9 ★', label: 'GOOGLE REVIEWS', icon: 'Star', is_active: true },
              { id: '2', value: '10K+', label: 'HAPPY TRAVELLERS', icon: 'Users', is_active: true },
              { id: '3', value: '100+', label: 'COMPLETED TRIPS', icon: 'Map', is_active: true }
            ]
          };
        }

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
      if (key === 'footer' && settings.contact) {
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

  // Card helpers for trust_benefits and stats_strip
  const addCard = (key, defaultObj) => {
    const list = settings[key]?.cards || [];
    const newList = [...list, { ...defaultObj, id: Date.now().toString() }];
    handleChange(key, 'cards', newList);
  };

  const deleteCard = (key, id) => {
    const list = settings[key]?.cards || [];
    const newList = list.filter(item => item.id !== id);
    handleChange(key, 'cards', newList);
  };

  const updateCard = (key, id, field, value) => {
    const list = settings[key]?.cards || [];
    const newList = list.map(item => item.id === id ? { ...item, [field]: value } : item);
    handleChange(key, 'cards', newList);
  };

  const moveCard = (key, index, direction) => {
    const list = settings[key]?.cards || [];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;
    const newList = [...list];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newList[index];
    newList[index] = newList[targetIdx];
    newList[targetIdx] = temp;
    handleChange(key, 'cards', newList);
  };

  // Footer Company links helpers
  const addFooterLink = () => {
    const cols = settings.footer?.columns || [{ title: 'Company', links: [] }];
    const firstCol = { ...cols[0] };
    firstCol.links = [...(firstCol.links || []), { label: 'New Link', href: '/' }];
    const newCols = [firstCol, ...cols.slice(1)];
    handleChange('footer', 'columns', newCols);
  };

  const deleteFooterLink = (idx) => {
    const cols = settings.footer?.columns || [{ title: 'Company', links: [] }];
    const firstCol = { ...cols[0] };
    firstCol.links = (firstCol.links || []).filter((_, i) => i !== idx);
    const newCols = [firstCol, ...cols.slice(1)];
    handleChange('footer', 'columns', newCols);
  };

  const updateFooterLink = (idx, field, value) => {
    const cols = settings.footer?.columns || [{ title: 'Company', links: [] }];
    const firstCol = { ...cols[0] };
    firstCol.links = (firstCol.links || []).map((link, i) => i === idx ? { ...link, [field]: value } : link);
    const newCols = [firstCol, ...cols.slice(1)];
    handleChange('footer', 'columns', newCols);
  };

  const moveFooterLink = (idx, direction) => {
    const cols = settings.footer?.columns || [{ title: 'Company', links: [] }];
    const firstCol = { ...cols[0] };
    const list = firstCol.links || [];
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === list.length - 1) return;
    const newList = [...list];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = newList[idx];
    newList[idx] = newList[targetIdx];
    newList[targetIdx] = temp;
    firstCol.links = newList;
    const newCols = [firstCol, ...cols.slice(1)];
    handleChange('footer', 'columns', newCols);
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
          <p className="text-gray-500 mt-1">Manage global website configurations, badges, testimonials, and footers.</p>
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
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Hero Header Settings</h2>
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
                  <label className={labelClass}>Overlay Opacity (%)</label>
                  <input type="number" min="0" max="100" value={settings.hero.overlay_opacity || '30'} onChange={e => handleChange('hero', 'overlay_opacity', e.target.value)} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Desktop Media URL</label>
                  <input type="url" value={settings.hero.desktop_media_url || ''} onChange={e => handleChange('hero', 'desktop_media_url', e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Mobile Media URL</label>
                  <input type="url" value={settings.hero.mobile_media_url || ''} onChange={e => handleChange('hero', 'mobile_media_url', e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Main Heading (HTML supported)</label>
                  <input type="text" value={settings.hero.heading || ''} onChange={e => handleChange('hero', 'heading', e.target.value)} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Subtitle</label>
                  <input type="text" value={settings.hero.subtitle || ''} onChange={e => handleChange('hero', 'subtitle', e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('hero')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Hero Settings
                </button>
              </div>
            </div>
          )}

          {/* NAVBAR TAB */}
          {activeTab === 'navbar' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Navbar Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Logo Text</label>
                  <input type="text" value={settings.navbar.logo_text || ''} onChange={e => handleChange('navbar', 'logo_text', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Logo Image URL (Overrides text)</label>
                  <input type="url" value={settings.navbar.logo_image_url || ''} onChange={e => handleChange('navbar', 'logo_image_url', e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
                <div>
                  <label className={labelClass}>Menu Button Label</label>
                  <input type="text" value={settings.navbar.menu_button_text || 'Menu'} onChange={e => handleChange('navbar', 'menu_button_text', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Search Field Placeholder</label>
                  <input type="text" value={settings.navbar.search_placeholder || ''} onChange={e => handleChange('navbar', 'search_placeholder', e.target.value)} className={inputClass} />
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h3 className="text-md font-bold text-gray-800 mb-4">Instagram Follower Badge Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Show Instagram Badge</label>
                      <select
                        value={settings.navbar.show_instagram_badge !== false ? 'true' : 'false'}
                        onChange={e => handleChange('navbar', 'show_instagram_badge', e.target.value === 'true')}
                        className={inputClass}
                      >
                        <option value="true">Show</option>
                        <option value="false">Hide</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Follower Count Label</label>
                      <input type="text" value={settings.navbar.instagram_follower_count || '248k'} onChange={e => handleChange('navbar', 'instagram_follower_count', e.target.value)} className={inputClass} placeholder="248k" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Instagram Profile URL</label>
                      <input type="url" value={settings.navbar.instagram_url || ''} onChange={e => handleChange('navbar', 'instagram_url', e.target.value)} className={inputClass} placeholder="https://instagram.com/..." />
                    </div>
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
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Footer & Contact Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Footer Background Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.footer.bg_color || '#CAEBE8'} onChange={e => handleChange('footer', 'bg_color', e.target.value)} className="w-10 h-10 border rounded-lg cursor-pointer" />
                    <input type="text" value={settings.footer.bg_color || '#CAEBE8'} onChange={e => handleChange('footer', 'bg_color', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Footer Text Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.footer.text_color || '#0f3a46'} onChange={e => handleChange('footer', 'text_color', e.target.value)} className="w-10 h-10 border rounded-lg cursor-pointer" />
                    <input type="text" value={settings.footer.text_color || '#0f3a46'} onChange={e => handleChange('footer', 'text_color', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Show Footer</label>
                  <select
                    value={settings.footer.show_footer !== false ? 'true' : 'false'}
                    onChange={e => handleChange('footer', 'show_footer', e.target.value === 'true')}
                    className={inputClass}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Company Description</label>
                  <textarea value={settings.footer.company_description || ''} onChange={e => handleChange('footer', 'company_description', e.target.value)} className={inputClass} rows={3} />
                </div>
              </div>

              {/* Company links CRUD */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-bold text-gray-800">Company Column Links</h3>
                  <button onClick={addFooterLink} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold">
                    <Plus size={14} /> Add Link
                  </button>
                </div>
                <div className="space-y-3">
                  {(settings.footer?.columns?.[0]?.links || []).map((link, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-gray-50 p-3 rounded-lg border">
                      <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input type="text" value={link.label} onChange={e => updateFooterLink(idx, 'label', e.target.value)} className={inputClass} placeholder="Link Label" />
                        <input type="text" value={link.href} onChange={e => updateFooterLink(idx, 'href', e.target.value)} className={inputClass} placeholder="Link URL" />
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => moveFooterLink(idx, 'up')} disabled={idx === 0} className="p-1.5 bg-white border rounded text-gray-600 disabled:opacity-50"><ArrowUp size={14} /></button>
                        <button onClick={() => moveFooterLink(idx, 'down')} disabled={idx === (settings.footer.columns[0].links.length - 1)} className="p-1.5 bg-white border rounded text-gray-600 disabled:opacity-50"><ArrowDown size={14} /></button>
                        <button onClick={() => deleteFooterLink(idx)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              {/* Sync check */}
              <div className="border-t pt-4">
                <h3 className="text-md font-bold text-gray-800 mb-2">Sync Information</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  * Note: The <strong>Destination</strong> and <strong>Trip Type</strong> footer columns are automatically synchronized in real-time with your active Destination circles and Interest circles from the database. Reordering/updating those categories directly updates the footer.
                </p>
              </div>

              {/* Contact sub-settings */}
              {settings.contact && (
                <div className="border-t pt-4">
                  <h3 className="text-md font-bold text-gray-800 mb-4">Contact Info Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <input type="text" value={settings.contact.phone || ''} onChange={e => setSettings(prev => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <input type="email" value={settings.contact.email || ''} onChange={e => setSettings(prev => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))} className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Physical Address</label>
                      <input type="text" value={settings.contact.address || ''} onChange={e => setSettings(prev => ({ ...prev, contact: { ...prev.contact, address: e.target.value } }))} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('footer')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Footer & Contact Settings
                </button>
              </div>
            </div>
          )}

          {/* SOCIAL LINKS TAB */}
          {activeTab === 'social_links' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Social Media Link URLs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Twitter</label>
                  <input type="url" value={settings.social_links.twitter || ''} onChange={e => handleChange('social_links', 'twitter', e.target.value)} className={inputClass} placeholder="https://twitter.com/..." />
                </div>
                <div>
                  <label className={labelClass}>Instagram</label>
                  <input type="url" value={settings.social_links.instagram || ''} onChange={e => handleChange('social_links', 'instagram', e.target.value)} className={inputClass} placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label className={labelClass}>Facebook</label>
                  <input type="url" value={settings.social_links.facebook || ''} onChange={e => handleChange('social_links', 'facebook', e.target.value)} className={inputClass} placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label className={labelClass}>YouTube</label>
                  <input type="url" value={settings.social_links.youtube || ''} onChange={e => handleChange('social_links', 'youtube', e.target.value)} className={inputClass} placeholder="https://youtube.com/..." />
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
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Package Detail Defaults</h2>
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
                  <label className={labelClass}>WhatsApp Template</label>
                  <textarea value={settings.package_detail_settings.whatsapp_template || ''} onChange={e => handleChange('package_detail_settings', 'whatsapp_template', e.target.value)} className={inputClass} rows={4} />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('package_detail_settings')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Package Defaults
                </button>
              </div>
            </div>
          )}

          {/* TRUST & BENEFITS TAB */}
          {activeTab === 'trust_benefits' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">TripoMist Experience Section</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Section Visibility</label>
                  <select
                    value={settings.trust_benefits.is_active !== false ? 'true' : 'false'}
                    onChange={e => handleChange('trust_benefits', 'is_active', e.target.value === 'true')}
                    className={inputClass}
                  >
                    <option value="true">Show Section</option>
                    <option value="false">Hide Section</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Section Title</label>
                  <input type="text" value={settings.trust_benefits.title || ''} onChange={e => handleChange('trust_benefits', 'title', e.target.value)} className={inputClass} placeholder="The TripoMist Experience" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Section Subtitle</label>
                  <input type="text" value={settings.trust_benefits.subtitle || ''} onChange={e => handleChange('trust_benefits', 'subtitle', e.target.value)} className={inputClass} placeholder="We don't just organize trips; we curate experiences..." />
                </div>
              </div>

              {/* Cards List */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-bold text-gray-800">Feature Cards</h3>
                  <button onClick={() => addCard('trust_benefits', { icon: 'Sparkles', heading: 'New Feature', description: 'Feature description', is_active: true })} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold">
                    <Plus size={14} /> Add Feature Card
                  </button>
                </div>
                <div className="space-y-4">
                  {(settings.trust_benefits.cards || []).map((card, idx) => (
                    <div key={card.id} className="bg-gray-50 border p-4 rounded-xl space-y-3 relative">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-xs font-semibold text-gray-500">Feature #{idx + 1}</span>
                        <div className="flex gap-1">
                          <button onClick={() => moveCard('trust_benefits', idx, 'up')} disabled={idx === 0} className="p-1 bg-white border rounded text-gray-500 disabled:opacity-50"><ArrowUp size={12} /></button>
                          <button onClick={() => moveCard('trust_benefits', idx, 'down')} disabled={idx === (settings.trust_benefits.cards.length - 1)} className="p-1 bg-white border rounded text-gray-500 disabled:opacity-50"><ArrowDown size={12} /></button>
                          <button onClick={() => deleteCard('trust_benefits', card.id)} className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className={labelClass}>Icon</label>
                          <select value={card.icon || 'Home'} onChange={e => updateCard('trust_benefits', card.id, 'icon', e.target.value)} className={inputClass}>
                            <option value="Home">Home / House</option>
                            <option value="Building">Building / Hotel</option>
                            <option value="Shield">Shield / Certified</option>
                            <option value="ShieldCheck">Shield Check</option>
                            <option value="Users">Users / Small Groups</option>
                            <option value="Sparkles">Sparkles / Community</option>
                            <option value="Heart">Heart</option>
                            <option value="Compass">Compass</option>
                            <option value="Star">Star</option>
                            <option value="Smile">Smile</option>
                            <option value="Award">Award</option>
                            <option value="ThumbsUp">Thumbs Up</option>
                            <option value="MapPin">Map Pin</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Feature Title</label>
                          <input type="text" value={card.heading || card.title || ''} onChange={e => updateCard('trust_benefits', card.id, 'heading', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Status</label>
                          <select value={card.is_active !== false ? 'true' : 'false'} onChange={e => updateCard('trust_benefits', card.id, 'is_active', e.target.value === 'true')} className={inputClass}>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <label className={labelClass}>Description</label>
                          <textarea value={card.description || ''} onChange={e => updateCard('trust_benefits', card.id, 'description', e.target.value)} className={inputClass} rows={2} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('trust_benefits')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Experience Section Settings
                </button>
              </div>
            </div>
          )}

          {/* STATS STRIP TAB */}
          {activeTab === 'stats_strip' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Homepage Stats Bar Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Section Visibility</label>
                  <select
                    value={settings.stats_strip.is_active !== false ? 'true' : 'false'}
                    onChange={e => handleChange('stats_strip', 'is_active', e.target.value === 'true')}
                    className={inputClass}
                  >
                    <option value="true">Show Section</option>
                    <option value="false">Hide Section</option>
                  </select>
                </div>
              </div>

              {/* Stats Cards CRUD */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-bold text-gray-800">Stats Items</h3>
                  <button onClick={() => addCard('stats_strip', { value: '100+', label: 'COMPLETED TRIPS', icon: 'Map', is_active: true })} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold">
                    <Plus size={14} /> Add Stat Item
                  </button>
                </div>
                <div className="space-y-4">
                  {(settings.stats_strip.cards || []).map((card, idx) => (
                    <div key={card.id} className="bg-gray-50 border p-4 rounded-xl space-y-3 relative">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-xs font-semibold text-gray-500">Stat Item #{idx + 1}</span>
                        <div className="flex gap-1">
                          <button onClick={() => moveCard('stats_strip', idx, 'up')} disabled={idx === 0} className="p-1 bg-white border rounded text-gray-500 disabled:opacity-50"><ArrowUp size={12} /></button>
                          <button onClick={() => moveCard('stats_strip', idx, 'down')} disabled={idx === (settings.stats_strip.cards.length - 1)} className="p-1 bg-white border rounded text-gray-500 disabled:opacity-50"><ArrowDown size={12} /></button>
                          <button onClick={() => deleteCard('stats_strip', card.id)} className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className={labelClass}>Value</label>
                          <input type="text" value={card.value !== undefined ? card.value : (card.number ? `${card.number}+` : '')} onChange={e => updateCard('stats_strip', card.id, 'value', e.target.value)} className={inputClass} placeholder="e.g. 4.9 ★ or 10K+" />
                        </div>
                        <div>
                          <label className={labelClass}>Stat Label</label>
                          <input type="text" value={card.label || ''} onChange={e => updateCard('stats_strip', card.id, 'label', e.target.value)} className={inputClass} placeholder="e.g. GOOGLE REVIEWS" />
                        </div>
                        <div>
                          <label className={labelClass}>Optional Icon</label>
                          <select value={card.icon || 'Star'} onChange={e => updateCard('stats_strip', card.id, 'icon', e.target.value)} className={inputClass}>
                            <option value="Star">Star</option>
                            <option value="Users">Users</option>
                            <option value="Map">Map</option>
                            <option value="Compass">Compass</option>
                            <option value="Calendar">Calendar</option>
                            <option value="Award">Award</option>
                            <option value="Briefcase">Briefcase</option>
                            <option value="Heart">Heart</option>
                            <option value="Smile">Smile</option>
                            <option value="ThumbsUp">Thumbs Up</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Status</label>
                          <select value={card.is_active !== false ? 'true' : 'false'} onChange={e => updateCard('stats_strip', card.id, 'is_active', e.target.value === 'true')} className={inputClass}>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('stats_strip')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Stats Settings
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
