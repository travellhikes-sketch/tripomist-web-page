import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Edit3,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import MediaUploader from '../../components/admin/MediaUploader';
import WebsiteLinkPicker from '../../components/admin/WebsiteLinkPicker';

const AdminHomepageSections = () => {
  const [sections, setSections] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    homepage_promo_banners: { banners: [] },
    homepage_static_banner: {},
    explore_more_settings: { display_style: 'normal' }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // Navigation State
  const [showTypeChooser, setShowTypeChooser] = useState(false);
  const [activeFormType, setActiveFormType] = useState(null); // 'normal', 'promo', 'static', 'explore_more', null
  const [currentItem, setCurrentItem] = useState(null); // only used for 'normal'
  const [saving, setSaving] = useState(false);

  const [createPageModalOpen, setCreatePageModalOpen] = useState(false);
  const [createPageData, setCreatePageData] = useState({ title: '', route: '', hero_image: '', explore_more_style: 'normal', target_field: null, target_index: null });
  const [createPageLoading, setCreatePageLoading] = useState(false);

  const initialFormState = {
    section_key: '',
    title: '',
    subtitle: '',
    icon: '',
    view_all_text: 'View All',
    view_all_route: '',
    display_order: 0,
    max_cards: 10,
    is_active: true,
    display_style: 'simple',
    advanced_cta_enabled: true,
    advanced_cta_text: 'View Trip',
    explore_more_style: 'normal'
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sectionsRes, settingsRes] = await Promise.all([
        supabase.from('homepage_sections').select('*').order('display_order', { ascending: true }),
        supabase.from('site_settings').select('*').in('setting_key', ['homepage_promo_banners', 'homepage_static_banner', 'explore_more_settings'])
      ]);

      if (sectionsRes.error) throw sectionsRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setSections(sectionsRes.data || []);
      
      let newSettings = {
        homepage_promo_banners: { banners: [] },
        homepage_static_banner: {},
        explore_more_settings: { display_style: 'normal' }
      };
      
      if (settingsRes.data) {
        settingsRes.data.forEach(item => {
          newSettings[item.setting_key] = item.setting_value;
        });
      }
      
      // Prefill defaults if not in DB
      if (!newSettings.homepage_promo_banners || !Array.isArray(newSettings.homepage_promo_banners.banners)) {
        newSettings.homepage_promo_banners = { banners: [] };
      }
      if (!newSettings.homepage_static_banner || Object.keys(newSettings.homepage_static_banner).length === 0) {
        newSettings.homepage_static_banner = {
          active: true,
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200',
          title: 'Our Ongoing Trips',
          subtitle: '',
          clickable: true,
          cta_text: 'Explore Packages',
          cta_link: '/trips/ongoing_packages'
        };
      }
      if (!newSettings.explore_more_settings || Object.keys(newSettings.explore_more_settings).length === 0) {
        newSettings.explore_more_settings = { display_style: 'normal' };
      }
      
      setSiteSettings(newSettings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Normal Package Section Handlers ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEditNormal = (item) => {
    setCurrentItem(item);
    const exploreMoreStyle = siteSettings.explore_more_settings?.[item.id] || 'normal';
    setFormData({
      ...initialFormState,
      ...item,
      view_all_text: item.view_all_text || 'View All',
      display_style: item.display_style || 'simple',
      advanced_cta_enabled: item.advanced_cta_enabled ?? true,
      advanced_cta_text: item.advanced_cta_text || 'View Trip',
      explore_more_style: exploreMoreStyle
    });
    setActiveFormType('normal');
  };

  const handleDeleteNormal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package section?')) return;
    try {
      const { error } = await supabase.from('homepage_sections').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActiveNormal = async (id, currentStatus) => {
    try {
      const { error } = await supabase.from('homepage_sections').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      setSections(sections.map(d => d.id === id ? { ...d, is_active: !currentStatus } : d));
    } catch (err) {
      setError(err.message);
    }
  };

    const handleCreatePackagePage = async (e) => {
      e.preventDefault();
      setCreatePageLoading(true);
      setError(null);
      try {
        const sectionKey = createPageData.route.replace('/trips/', '').replace(/[^a-z0-9_]+/g, '');
        const { data, error: insertError } = await supabase
          .from('homepage_sections')
          .insert({
            section_key: sectionKey,
            title: createPageData.title,
            view_all_route: createPageData.route,
            hero_image: createPageData.hero_image,
            is_active: true,
            display_order: sections.length + 1
          })
          .select()
          .single();
        
        if (insertError) throw insertError;

        // If they provided explore_more_style, we should update site_settings explore_more_settings mapping
        // Removed explore_more_style logic

        await fetchData(); // refresh sections list
        setSuccess('Linked Package Page created successfully!');

        // Update the picker value in the parent form
        if (createPageData.target_field === 'homepage_promo_banners') {
           const list = [...(siteSettings.homepage_promo_banners?.banners || [])];
           list[createPageData.target_index] = { ...list[createPageData.target_index], cta_link: createPageData.route, cta_url: createPageData.route };
           handleSettingsChange('homepage_promo_banners', 'banners', list);
        } else if (createPageData.target_field === 'homepage_static_banner') {
           handleSettingsChange('homepage_static_banner', 'cta_link', createPageData.route);
        }
        
        setCreatePageModalOpen(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setCreatePageLoading(false);
      }
    };

    const handleSaveNormal = async (e) => {
    e.preventDefault();
      setSaving(true);
      try {
        let { ...dataToSave } = formData;
        dataToSave.view_all_text = dataToSave.view_all_text || 'View All';
      
      if (!currentItem) {
        const generatedKey = dataToSave.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
        dataToSave.section_key = generatedKey;
        dataToSave.view_all_route = `/trips/${generatedKey}`;
      }

      if (currentItem) {
        const { error } = await supabase.from('homepage_sections').update(dataToSave).eq('id', currentItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('homepage_sections').insert([dataToSave]);
        if (error) throw error;
      }

      await fetchData();
      handleCancel();
      setSuccess('Section saved successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- Site Settings Handlers (Promo & Static) ---
  const handleSettingsChange = (key, field, value) => {
    setSiteSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async (settingKey) => {
    setSaving(true);
    try {
      const { error: upsertErr } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: settingKey, 
          setting_value: siteSettings[settingKey],
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (upsertErr) throw upsertErr;
      await fetchData();
      setSuccess('Settings saved successfully!');
      handleCancel();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setActiveFormType(null);
    setShowTypeChooser(false);
    setCurrentItem(null);
    setFormData(initialFormState);
  };

  const inputClass = "w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Sections</h1>
          <p className="text-gray-500 mt-1">Manage all homepage content layouts, banners, and package rails.</p>
        </div>
        {!activeFormType && !showTypeChooser && (
          <button
            onClick={() => setShowTypeChooser(true)}
            className="flex items-center gap-2 bg-[#136b8a] text-white px-4 py-2 rounded-xl hover:bg-[#0f556e] transition-colors shadow-sm font-medium"
          >
            <Plus size={18} />
            Add Section
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a]"></div></div>
      ) : showTypeChooser ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">What do you want to add?</h2>
          <div className="space-y-4">
            <button onClick={() => { setShowTypeChooser(false); setActiveFormType('normal'); }} className="w-full p-4 border rounded-xl hover:border-[#136b8a] hover:bg-blue-50 transition-colors text-left font-medium text-gray-800 flex flex-col">
              <span>Normal Packages Section</span>
              <span className="text-xs text-gray-500 font-normal mt-1">e.g. Recommended, Best Seller, Upcoming Trips</span>
            </button>
            <button onClick={() => { setShowTypeChooser(false); setActiveFormType('promo'); }} className="w-full p-4 border rounded-xl hover:border-[#136b8a] hover:bg-blue-50 transition-colors text-left font-medium text-gray-800 flex flex-col">
              <span>Big Promo Banner</span>
              <span className="text-xs text-gray-500 font-normal mt-1">Large image carousel for main promotions</span>
            </button>
            <button onClick={() => { setShowTypeChooser(false); setActiveFormType('static'); }} className="w-full p-4 border rounded-xl hover:border-[#136b8a] hover:bg-blue-50 transition-colors text-left font-medium text-gray-800 flex flex-col">
              <span>Short Banner</span>
              <span className="text-xs text-gray-500 font-normal mt-1">Single wide static banner (e.g. Ongoing Trips)</span>
            </button>
          </div>
          <div className="mt-6 text-center">
            <button onClick={() => setShowTypeChooser(false)} className="text-sm text-gray-500 hover:text-gray-800 font-medium">Cancel</button>
          </div>
        </div>
      ) : activeFormType === 'normal' ? (
        <form onSubmit={handleSaveNormal} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
             <h2 className="text-xl font-bold">{currentItem ? 'Edit Normal Packages Section' : 'New Packages Section'}</h2>
             <button type="button" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 font-medium text-sm">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <input type="text" name="title" value={formData.title || ''} onChange={handleInputChange} className={inputClass} required placeholder="e.g. Best Seller" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View All Button Text</label>
              <input type="text" name="view_all_text" value={formData.view_all_text || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g. View All" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Packages Shown</label>
              <input type="number" name="max_cards" value={formData.max_cards} onChange={handleInputChange} className={inputClass} required />
            </div>

            <div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Style</label>
                <select name="display_style" value={formData.display_style || 'simple'} onChange={handleInputChange} className={inputClass}>
                  <option value="simple">Simple (Standard Carousel)</option>
                  <option value="advanced">Advanced (3D Coverflow)</option>
                  <option value="advanced_1_1">Advanced (1:1 Card Slider)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Advanced styles use premium interactive layouts.</p>
              </div>

              <div>
                <label className={labelClass}>Section Width</label>  <p className="text-xs text-gray-500 mt-1">Style for "Explore More Trips" shown when "View All" is clicked.</p>
              </div>
            </div>

            {formData.display_style?.startsWith('advanced') && (
              <>
                <div className="flex items-center mt-6">
                  <input type="checkbox" name="advanced_cta_enabled" checked={formData.advanced_cta_enabled !== false} onChange={handleInputChange} className="w-5 h-5 mr-3 text-[#136b8a] rounded focus:ring-[#136b8a]" />
                  <label className="text-sm font-medium text-gray-700">Show CTA Button in Advanced Style</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advanced CTA Text</label>
                  <input type="text" name="advanced_cta_text" value={formData.advanced_cta_text || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g. View Trip" />
                </div>
              </>
            )}

            <div className="flex items-center mt-6">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-5 h-5 mr-3 text-[#136b8a] rounded focus:ring-[#136b8a]" />
              <label className="text-sm font-medium text-gray-700">Section is Active</label>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
             <MediaUploader
               currentImage={formData.hero_image}
               onImageUploaded={(url) => setFormData({ ...formData, hero_image: url })}
               label="Listing Page Hero Image"
               hint="Optional. This image will appear at the top of the 'View All' listing page for this section. Use a wide banner image (e.g. 1920x600)."
             />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={saving} className="bg-[#136b8a] text-white px-6 py-2.5 rounded-lg hover:bg-[#0f556e] font-medium disabled:opacity-50 inline-flex gap-2 items-center">
               <Save size={18} /> Save Section
            </button>
            <button type="button" onClick={handleCancel} disabled={saving} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      ) : activeFormType === 'promo' ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
             <h2 className="text-xl font-bold">Manage Big Promo Banner</h2>
             <button type="button" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 font-medium text-sm">Cancel</button>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                const banners = siteSettings.homepage_promo_banners?.banners || [];
                const newBanner = {
                  id: `pb_${Date.now()}`,
                  title: 'NEW BANNER',
                  subtitle: '',
                  image: '',
                  image_url: '',
                  cta_text: 'Explore Trip',
                  cta_label: 'Explore Trip',
                  cta_link: '',
                  cta_url: '',
                  active: true,
                  is_active: true,
                  clickable: true,
                  display_order: banners.length + 1
                };
                handleSettingsChange('homepage_promo_banners', 'banners', [...banners, newBanner]);
              }}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={16} /> Add Carousel Item
            </button>
          </div>

          <div className="space-y-6">
            {(siteSettings.homepage_promo_banners?.banners || []).map((banner, idx) => (
              <div key={banner.id} className="border border-gray-200 rounded-xl bg-gray-50 p-6 relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="flex gap-1 border rounded-lg bg-white overflow-hidden shadow-sm mr-2">
                    <button
                      onClick={() => {
                        if (idx === 0) return;
                        const updatedList = [...(siteSettings.homepage_promo_banners?.banners || [])];
                        const temp = updatedList[idx - 1];
                        updatedList[idx - 1] = updatedList[idx];
                        updatedList[idx] = temp;
                        handleSettingsChange('homepage_promo_banners', 'banners', updatedList);
                      }}
                      disabled={idx === 0}
                      className="p-1.5 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <div className="w-px bg-gray-200"></div>
                    <button
                      onClick={() => {
                        const list = siteSettings.homepage_promo_banners?.banners || [];
                        if (idx === list.length - 1) return;
                        const updatedList = [...list];
                        const temp = updatedList[idx + 1];
                        updatedList[idx + 1] = updatedList[idx];
                        updatedList[idx] = temp;
                        handleSettingsChange('homepage_promo_banners', 'banners', updatedList);
                      }}
                      disabled={idx === (siteSettings.homepage_promo_banners?.banners || []).length - 1}
                      className="p-1.5 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to remove this promo banner?')) {
                        const list = (siteSettings.homepage_promo_banners?.banners || []).filter(b => b.id !== banner.id);
                        handleSettingsChange('homepage_promo_banners', 'banners', list);
                      }
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors bg-white shadow-sm border border-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className={labelClass}>Banner Title</label>
                    <input
                      type="text"
                      value={banner.title || ''}
                      onChange={e => {
                        const list = (siteSettings.homepage_promo_banners?.banners || []).map(b => b.id === banner.id ? { ...b, title: e.target.value } : b);
                        handleSettingsChange('homepage_promo_banners', 'banners', list);
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      value={banner.active !== false ? 'true' : 'false'}
                      onChange={e => {
                        const list = (siteSettings.homepage_promo_banners?.banners || []).map(b => b.id === banner.id ? { ...b, active: e.target.value === 'true', is_active: e.target.value === 'true' } : b);
                        handleSettingsChange('homepage_promo_banners', 'banners', list);
                      }}
                      className={inputClass}
                    >
                      <option value="true">Active (Show)</option>
                      <option value="false">Inactive (Hide)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Subtitle / Description</label>
                    <input
                      type="text"
                      value={banner.subtitle || ''}
                      onChange={e => {
                        const list = (siteSettings.homepage_promo_banners?.banners || []).map(b => b.id === banner.id ? { ...b, subtitle: e.target.value } : b);
                        handleSettingsChange('homepage_promo_banners', 'banners', list);
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2 border rounded-xl p-4 bg-white">
                    <MediaUploader
                      url={banner.image || banner.image_url || ''}
                      onUrlChange={url => {
                        const list = (siteSettings.homepage_promo_banners?.banners || []).map(b => b.id === banner.id ? { ...b, image: url, image_url: url } : b);
                        handleSettingsChange('homepage_promo_banners', 'banners', list);
                      }}
                      folder="promo_banners"
                      label="Banner Image"
                      hint="Recommended: Wide ratio (e.g. 1200x500px). Supports images/videos."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>CTA Button Text</label>
                    <input
                      type="text"
                      value={banner.cta_text || banner.cta_label || ''}
                      onChange={e => {
                        const list = (siteSettings.homepage_promo_banners?.banners || []).map(b => b.id === banner.id ? { ...b, cta_text: e.target.value, cta_label: e.target.value } : b);
                        handleSettingsChange('homepage_promo_banners', 'banners', list);
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <div>
                      <WebsiteLinkPicker
                        label="CTA Destination (Route or URL)"
                        value={banner.cta_link || banner.cta_url || ''}
                        onChange={val => {
                          if (val.startsWith('CREATE_PACKAGE:')) {
                            const term = val.replace('CREATE_PACKAGE:', '');
                            setCreatePageModalOpen(true);
                            setCreatePageData({ title: term, route: `/trips/${term.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, hero_image: '', explore_more_style: 'normal', target_field: 'homepage_promo_banners', target_index: idx });
                          } else {
                            const list = (siteSettings.homepage_promo_banners?.banners || []).map(b => b.id === banner.id ? { ...b, cta_link: val, cta_url: val } : b);
                            handleSettingsChange('homepage_promo_banners', 'banners', list);
                          }
                        }}
                      />
                      {(() => {
                        const link = banner.cta_link || banner.cta_url || '';
                        const linkedSection = sections.find(s => (s.view_all_route || `/trips/${s.section_key}`) === link);
                        if (!linkedSection) return null;
                        return (
                          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <h4 className="text-sm font-semibold text-gray-800 mb-1">Linked Package Page</h4>
                            <p className="text-xs text-gray-500 mb-3">Page: {linkedSection.title} | Route: {link}</p>
                            <MediaUploader
                              url={linkedSection.hero_image || ''}
                              onUrlChange={async (url) => {
                                const { error } = await supabase.from('homepage_sections').update({ hero_image: url }).eq('id', linkedSection.id);
                                if (!error) setSections(sections.map(s => s.id === linkedSection.id ? { ...s, hero_image: url } : s));
                              }}
                              folder="homepage_sections"
                              label="Listing Page Hero Image"
                            />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex gap-3 border-t mt-6">
            <button onClick={() => handleSaveSettings('homepage_promo_banners')} disabled={saving} className="inline-flex items-center gap-2 bg-[#136b8a] text-white px-6 py-2.5 rounded-lg hover:bg-[#0f556e] transition-colors font-medium disabled:opacity-50">
              <Save size={18} /> Save Promo Banners
            </button>
            <button type="button" onClick={handleCancel} disabled={saving} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </div>
      ) : activeFormType === 'static' ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
             <h2 className="text-xl font-bold">Edit Short Banner</h2>
             <button type="button" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 font-medium text-sm">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={siteSettings.homepage_static_banner?.active !== false ? 'true' : 'false'}
                onChange={e => handleSettingsChange('homepage_static_banner', 'active', e.target.value === 'true')}
                className={inputClass}
              >
                <option value="true">Active (Show Banner)</option>
                <option value="false">Inactive (Hide Banner)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Clickable (Yes / No)</label>
              <select
                value={siteSettings.homepage_static_banner?.clickable !== false ? 'true' : 'false'}
                onChange={e => handleSettingsChange('homepage_static_banner', 'clickable', e.target.value === 'true')}
                className={inputClass}
              >
                <option value="true">YES (Navigates to Link/URL on click)</option>
                <option value="false">NO (Display Only - No Navigation)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Banner Title (optional)</label>
              <input
                type="text"
                value={siteSettings.homepage_static_banner?.title || ''}
                onChange={e => handleSettingsChange('homepage_static_banner', 'title', e.target.value)}
                className={inputClass}
                placeholder="e.g. KEDARNATH"
              />
            </div>

            <div>
              <label className={labelClass}>Banner Subtitle (optional)</label>
              <input
                type="text"
                value={siteSettings.homepage_static_banner?.subtitle || ''}
                onChange={e => handleSettingsChange('homepage_static_banner', 'subtitle', e.target.value)}
                className={inputClass}
                placeholder="e.g. Journey to the Sacred Himalayas"
              />
            </div>

            <div>
              <label className={labelClass}>CTA Button Text (optional)</label>
              <input
                type="text"
                value={siteSettings.homepage_static_banner?.cta_text || ''}
                onChange={e => handleSettingsChange('homepage_static_banner', 'cta_text', e.target.value)}
                className={inputClass}
                placeholder="e.g. Explore Trip"
              />
            </div>

            <div>
              <WebsiteLinkPicker
                label="CTA Link / URL"
                value={siteSettings.homepage_static_banner?.cta_link || ''}
                onChange={val => {
                  if (val.startsWith('CREATE_PACKAGE:')) {
                    const term = val.replace('CREATE_PACKAGE:', '');
                    setCreatePageModalOpen(true);
                    setCreatePageData({ title: term, route: `/trips/${term.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, hero_image: '', explore_more_style: 'normal', target_field: 'homepage_static_banner' });
                  } else {
                    handleSettingsChange('homepage_static_banner', 'cta_link', val);
                  }
                }}
                placeholder="e.g. /trips/ongoing_packages"
              />
              {(() => {
                const link = siteSettings.homepage_static_banner?.cta_link || '';
                const linkedSection = sections.find(s => (s.view_all_route || `/trips/${s.section_key}`) === link);
                if (!linkedSection) return null;
                return (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">Linked Package Page</h4>
                    <p className="text-xs text-gray-500 mb-3">Page: {linkedSection.title} | Route: {link}</p>
                    <MediaUploader
                      url={linkedSection.hero_image || ''}
                      onUrlChange={async (url) => {
                        const { error } = await supabase.from('homepage_sections').update({ hero_image: url }).eq('id', linkedSection.id);
                        if (!error) setSections(sections.map(s => s.id === linkedSection.id ? { ...s, hero_image: url } : s));
                      }}
                      folder="homepage_sections"
                      label="Listing Page Hero Image"
                    />
                  </div>
                );
              })()}
            </div>

            <div className="md:col-span-2 border rounded-xl p-4 bg-white">
              <MediaUploader
                url={siteSettings.homepage_static_banner?.image || ''}
                onUrlChange={url => handleSettingsChange('homepage_static_banner', 'image', url)}
                folder="homepage_static_banner"
                label="Banner Image"
                hint="Recommended: Wide landscape image (~1200x300px)."
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t mt-6">
            <button
              onClick={() => handleSaveSettings('homepage_static_banner')}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#136b8a] text-white px-6 py-2.5 rounded-lg hover:bg-[#0f556e] font-medium transition-colors disabled:opacity-50"
            >
              <Save size={18} /> Save Short Banner
            </button>
            <button type="button" onClick={handleCancel} disabled={saving} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Normal Sections */}
          {sections.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">Normal Package Section</span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {item.is_active ? 'ACTIVE' : 'HIDDEN'}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>

                <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                  <p className="text-xs text-gray-600"><strong>View All:</strong> {item.view_all_text}</p>
                  <p className="text-xs text-gray-600"><strong>Route:</strong> {item.view_all_route || 'None'}</p>
                  <p className="text-xs text-gray-600"><strong>Max Cards:</strong> {item.max_cards}</p>
                  <p className="text-xs text-gray-600"><strong>Style:</strong> {item.display_style === 'advanced' ? 'Advanced (3D)' : item.display_style === 'advanced_1_1' ? 'Advanced (1:1)' : 'Simple'}</p>
                </div>
              </div>

              <div className="flex justify-between items-center w-full mt-4 pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">Order: {item.display_order}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleActiveNormal(item.id, item.is_active)} className={`p-1.5 rounded-lg border ${item.is_active ? 'text-amber-600 hover:bg-amber-50 border-amber-100' : 'text-emerald-600 hover:bg-emerald-50 border-emerald-100'}`} title="Toggle Visibility">
                    {item.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>
                  <button onClick={() => handleEditNormal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100" title="Edit">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDeleteNormal(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Big Promo Banner */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">Big Promo Banner</span>
                <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700">ACTIVE</span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{(siteSettings.homepage_promo_banners?.banners || []).length} Banners</h3>
            </div>
            <div className="flex justify-end items-center w-full mt-4 pt-4 border-t border-gray-50">
              <button onClick={() => setActiveFormType('promo')} className="flex items-center gap-2 px-3 py-1.5 bg-[#136b8a] text-white hover:bg-[#0f556e] rounded-lg text-sm font-medium transition-colors">
                <Edit3 size={14} /> Manage Banners
              </button>
            </div>
          </div>

          {/* Short Banner */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded uppercase">Short Banner</span>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${siteSettings.homepage_static_banner?.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {siteSettings.homepage_static_banner?.active !== false ? 'ACTIVE' : 'HIDDEN'}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{siteSettings.homepage_static_banner?.title || 'Static Banner'}</h3>
            </div>
            <div className="flex justify-end items-center w-full mt-4 pt-4 border-t border-gray-50">
              <button onClick={() => setActiveFormType('static')} className="flex items-center gap-2 px-3 py-1.5 bg-[#136b8a] text-white hover:bg-[#0f556e] rounded-lg text-sm font-medium transition-colors">
                <Edit3 size={14} /> Edit Banner
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Create Linked Package Page Modal */}
      {createPageModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Package Page</h2>
                <p className="text-sm text-gray-500 mt-1">Generate a new listing page and automatically link it to this banner.</p>
              </div>
              <button 
                onClick={() => setCreatePageModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePackagePage} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Page Title</label>
                <input
                  type="text"
                  required
                  value={createPageData.title}
                  onChange={e => setCreatePageData({...createPageData, title: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#136b8a] focus:ring-1 focus:ring-[#136b8a] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Route</label>
                <input
                  type="text"
                  required
                  value={createPageData.route}
                  onChange={e => setCreatePageData({...createPageData, route: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#136b8a] focus:ring-1 focus:ring-[#136b8a] outline-none transition-all"
                />
              </div>

              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                <MediaUploader
                  url={createPageData.hero_image}
                  onUrlChange={url => setCreatePageData({...createPageData, hero_image: url})}
                  folder="homepage_sections"
                  label="Listing Page Hero Image"
                  hint="Recommended: Wide landscape image for the top of the package page."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setCreatePageModalOpen(false)}
                  disabled={createPageLoading}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createPageLoading || !createPageData.title || !createPageData.route}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#136b8a] hover:bg-[#0f556e] rounded-xl transition-colors disabled:opacity-50"
                >
                  {createPageLoading ? 'Creating...' : 'Create & Link Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomepageSections;
