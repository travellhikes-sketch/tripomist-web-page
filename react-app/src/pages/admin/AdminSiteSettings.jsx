import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import MediaUploader from '../../components/admin/MediaUploader';

const normalizeBanner = (banner, index) => {
  if (!banner) return null;
  const id = banner.id || `pb_${index}_${Date.now()}`;
  const image = banner.image || banner.image_url || '';
  const title = banner.title || '';
  const subtitle = banner.subtitle || '';
  const cta_text = banner.cta_text || banner.cta_label || '';
  const cta_link = banner.cta_link || banner.cta_url || '';
  const active = banner.active !== undefined ? banner.active : (banner.is_active !== undefined ? banner.is_active : true);
  const display_order = banner.display_order !== undefined ? parseInt(banner.display_order, 10) : (index + 1);
  return {
    id,
    image,
    image_url: image,
    title,
    subtitle,
    cta_text,
    cta_label: cta_text,
    cta_link,
    cta_url: cta_link,
    active,
    is_active: active,
    display_order
  };
};
import {
  Save, AlertCircle, CheckCircle, RefreshCw,
  Monitor, LayoutTemplate, MessageSquare, Link as LinkIcon, Box,
  Shield, BarChart2, Trash2, ArrowUp, ArrowDown, Plus,
  Image, Layers
} from 'lucide-react';

const AdminSiteSettings = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const [settings, setSettings] = useState({
    hero: {},
    navbar: {},
    footer: {},
    contact: {},
    social_links: {},
    package_detail_settings: {},
    explore_more_settings: {},
    trust_benefits: {},
    homepage_promo_banners: {},
    why_choose_us_banners: {},
    stats_strip: {},
    testimonials_section: {},
    customer_support: {},
    homepage_static_banner: {},
    search_page_hero: {},
    homepage_section_order: [],
    typography: {}
  });

  const [homepageSectionOrder, setHomepageSectionOrder] = useState([]);

  const TABS = [
    { id: 'hero', label: 'Hero Section', icon: Monitor },
    { id: 'search_page_hero', label: 'Search Page Hero', icon: Monitor },
    { id: 'navbar', label: 'Navbar & IG Badge', icon: LayoutTemplate },
    { id: 'footer', label: 'Footer & Contact', icon: LayoutTemplate },
    { id: 'social_links', label: 'Social Media', icon: LinkIcon },
    { id: 'package_detail_settings', label: 'Package Detail', icon: Box },
    { id: 'why_choose_us_banners', label: 'Why Choose Us Banners', icon: Shield },
    { id: 'stats_strip', label: 'Stats Strip', icon: BarChart2 },
    { id: 'customer_support', label: 'Customer Support', icon: MessageSquare },
    { id: 'homepage_section_order', label: 'Homepage Layout', icon: Layers },
    { id: 'typography', label: 'Typography', icon: LayoutTemplate }
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
            ],
            promo_banners: []
          };
        } else {
          const existingBanners = newSettings.trust_benefits.promo_banners;
          if (existingBanners) {
            newSettings.trust_benefits.promo_banners = existingBanners.map((b, idx) => normalizeBanner(b, idx));
          }
        }

        // Prefill homepage_promo_banners
        if (!newSettings.homepage_promo_banners || !Array.isArray(newSettings.homepage_promo_banners.banners)) {
          newSettings.homepage_promo_banners = {
            banners: [
              { id: 'pb1', title: 'VALLEY OF FLOWERS', subtitle: 'Explore the Himalayan Bloom', image: 'https://res.cloudinary.com/yefluulb/image/upload/v1784911022/file_000000008360820babc664eada874536_if2ae0.png', image_url: 'https://res.cloudinary.com/yefluulb/image/upload/v1784911022/file_000000008360820babc664eada874536_if2ae0.png', cta_text: 'Explore Trip', cta_label: 'Explore Trip', cta_link: '/itinerary/valley-of-flowers-with-hemkund-sahib', cta_url: '/itinerary/valley-of-flowers-with-hemkund-sahib', active: true, is_active: true, display_order: 1, clickable: true },
              { id: 'pb2', title: 'KEDARNATH', subtitle: 'Journey to the Sacred Himalayas', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200', cta_text: 'Explore Trip', cta_label: 'Explore Trip', cta_link: '/destinations/uttarakhand', cta_url: '/destinations/uttarakhand', active: true, is_active: true, display_order: 2, clickable: true },
              { id: 'pb3', title: 'HAMPTA PASS', subtitle: 'Cross Into Another World', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200', cta_text: 'Explore Trek', cta_label: 'Explore Trek', cta_link: '/itinerary/hampta-pass-trek', cta_url: '/itinerary/hampta-pass-trek', active: true, is_active: true, display_order: 3, clickable: true },
              { id: 'pb4', title: 'LADAKH', subtitle: 'Ride Beyond the Ordinary', image: 'https://images.unsplash.com/photo-1581793746485-04698e79a4e8?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1581793746485-04698e79a4e8?q=80&w=1200', cta_text: 'Explore Tour', cta_label: 'Explore Tour', cta_link: '/destinations/ladakh', cta_url: '/destinations/ladakh', active: true, is_active: true, display_order: 4, clickable: true }
            ]
          };
        } else {
          newSettings.homepage_promo_banners.banners = newSettings.homepage_promo_banners.banners.map((b, idx) => normalizeBanner(b, idx));
        }

        // Prefill why_choose_us_banners
        if (!newSettings.why_choose_us_banners || !Array.isArray(newSettings.why_choose_us_banners.banners)) {
          newSettings.why_choose_us_banners = {
            title: 'Why Choose Us',
            subtitle: "India's Fastest Growing Travel Company",
            banners: [
              { id: 'tb1', title: 'Best for Solo Travelers', subtitle: 'Travel solo. Return with a tribe. Intimate group sizes ensure personal attention and stronger bonds.', image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1200', active: true, is_active: true, display_order: 1, clickable: false, cta_text: '', cta_label: '', cta_link: '', cta_url: '' },
              { id: 'tb2', title: 'Safe for Girls', subtitle: 'Our group trips have a 60:40 gender ratio with certified female and male trip captains.', image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=1200', active: true, is_active: true, display_order: 2, clickable: false, cta_text: '', cta_label: '', cta_link: '', cta_url: '' },
              { id: 'tb3', title: 'Experienced Trip Captains', subtitle: 'Certified mountaineers and local guides who know the terrain, safety protocols, and cultures.', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200', image_url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200', active: true, is_active: true, display_order: 3, clickable: false, cta_text: '', cta_label: '', cta_link: '', cta_url: '' }
            ]
          };
        } else {
          newSettings.why_choose_us_banners.banners = newSettings.why_choose_us_banners.banners.map((b, idx) => normalizeBanner(b, idx));
          if (!newSettings.why_choose_us_banners.title) {
            newSettings.why_choose_us_banners.title = 'Why Choose Us';
          }
          if (!newSettings.why_choose_us_banners.subtitle) {
            newSettings.why_choose_us_banners.subtitle = "India's Fastest Growing Travel Company";
          }
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
        if (!newSettings.customer_support || Object.keys(newSettings.customer_support).length === 0) {
          newSettings.customer_support = {
            whatsapp: { enabled: true, title: 'WhatsApp', value: '', description: '' },
            call: { enabled: true, title: 'Call Us', value: '', description: '' },
            email: { enabled: true, title: 'Email', value: '', description: '' },
            live_chat: { enabled: true, title: 'Live Chat', description: 'Need quick help? You can chat with our support team directly.' }
          };
        }
        if (!newSettings.homepage_static_banner || Object.keys(newSettings.homepage_static_banner).length === 0) {
          newSettings.homepage_static_banner = {
            active: true,
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200',
            title: 'Our Ongoing Departures',
            subtitle: '',
            clickable: true,
            cta_text: 'Explore Packages',
            cta_link: '/trips/ongoing_packages'
          };
        }
        if (!newSettings.search_page_hero || Object.keys(newSettings.search_page_hero).length === 0) {
          newSettings.search_page_hero = {
            hero_image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
            title: 'Find Your Next Adventure',
            subtitle: ''
          };
        }
        if (!newSettings.explore_more_settings || Object.keys(newSettings.explore_more_settings).length === 0) {
          newSettings.explore_more_settings = {
            'ffffffff-ffff-ffff-ffff-ffffffffffff': 'normal'
          };
        }
        if (!newSettings.typography) {
          newSettings.typography = {
            heading_font: 'Ranchers'
          };
        }
        let mergedOrder = [];
        if (!newSettings.homepage_section_order || !Array.isArray(newSettings.homepage_section_order)) {
          mergedOrder = [
            'destinations',
            'interests',
            'promo_carousel',
            'recommended',
            'static_banner',
            'why_choose_us',
            'why_choose_us_carousel',
            'best_seller',
            'upcoming_trips',
            'stats_strip',
            'international',
            'testimonials'
          ];
          newSettings.homepage_section_order = mergedOrder;
        } else {
          const DEFAULT_ORDER = [
            'destinations',
            'interests',
            'promo_carousel',
            'recommended',
            'static_banner',
            'why_choose_us',
            'why_choose_us_carousel',
            'best_seller',
            'upcoming_trips',
            'stats_strip',
            'international',
            'testimonials'
          ];
          const uniqueSaved = Array.from(new Set(newSettings.homepage_section_order)).filter(key => DEFAULT_ORDER.includes(key));
          const missing = DEFAULT_ORDER.filter(key => !uniqueSaved.includes(key));
          mergedOrder = [...uniqueSaved, ...missing];
          newSettings.homepage_section_order = mergedOrder;
        }

        setHomepageSectionOrder(mergedOrder);
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

  const handleSaveLayoutOrder = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error: upsertErr } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'homepage_section_order',
          setting_value: homepageSectionOrder,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (upsertErr) throw upsertErr;

      setSettings(prev => ({
        ...prev,
        homepage_section_order: homepageSectionOrder
      }));
      setSuccess('Homepage layout order saved successfully!');
    } catch (err) {
      console.error('Error saving layout order:', err);
      setError(err.message || 'Failed to save layout order.');
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
                <div className="md:col-span-2">
                  <MediaUploader
                    currentImage={settings.hero.desktop_media_url}
                    onImageUploaded={(url) => handleChange('hero', 'desktop_media_url', url)}
                    label="Hero Image (Desktop/Default)"
                    hint="Upload the main background image or video for the homepage hero."
                  />
                </div>
                <div className="md:col-span-2">
                  <MediaUploader
                    currentImage={settings.hero.mobile_media_url}
                    onImageUploaded={(url) => handleChange('hero', 'mobile_media_url', url)}
                    label="Hero Image (Mobile - Optional)"
                    hint="Optional. Different image/video for mobile screens."
                  />
                </div>
                <div>
                  <label className={labelClass}>Main Heading Line 1</label>
                  <input type="text" value={settings.hero.heading_line1 || 'Find Yourself'} onChange={e => handleChange('hero', 'heading_line1', e.target.value)} className={inputClass} placeholder="Find Yourself" />
                </div>
                <div>
                  <label className={labelClass}>Main Heading Line 2 (Accent / Blue text)</label>
                  <input type="text" value={settings.hero.heading_line2 || 'With TripoMist'} onChange={e => handleChange('hero', 'heading_line2', e.target.value)} className={inputClass} placeholder="With TripoMist" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Subheading</label>
                  <input type="text" value={settings.hero.subtitle || 'Your Safe Travel Our Responsibility.'} onChange={e => handleChange('hero', 'subtitle', e.target.value)} className={inputClass} />
                </div>
                
                {/* Primary CTA */}
                <div className="border-t pt-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center md:col-span-2 mb-2">
                    <input type="checkbox" checked={settings.hero.show_primary_cta !== false} onChange={e => handleChange('hero', 'show_primary_cta', e.target.checked)} className="w-4 h-4 mr-2" />
                    <label className="text-sm font-bold text-gray-800">Show Primary Button</label>
                  </div>
                  <div>
                    <label className={labelClass}>Primary CTA Text</label>
                    <input type="text" value={settings.hero.primary_cta_text || 'Explore All Departure'} onChange={e => handleChange('hero', 'primary_cta_text', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Primary CTA Destination (Route)</label>
                    <input type="text" value={settings.hero.primary_cta_route || '/all-departures'} onChange={e => handleChange('hero', 'primary_cta_route', e.target.value)} className={inputClass} />
                  </div>
                </div>

                {/* Secondary CTA */}
                <div className="border-t pt-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center md:col-span-2 mb-2">
                    <input type="checkbox" checked={settings.hero.show_secondary_cta !== false} onChange={e => handleChange('hero', 'show_secondary_cta', e.target.checked)} className="w-4 h-4 mr-2" />
                    <label className="text-sm font-bold text-gray-800">Show Secondary Button</label>
                  </div>
                  <div>
                    <label className={labelClass}>Secondary CTA Text</label>
                    <input type="text" value={settings.hero.secondary_cta_text || 'See Upcoming Trips'} onChange={e => handleChange('hero', 'secondary_cta_text', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Secondary CTA Destination (Route)</label>
                    <input type="text" value={settings.hero.secondary_cta_route || '/trips/upcoming-trips'} onChange={e => handleChange('hero', 'secondary_cta_route', e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('hero')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Hero Settings
                </button>
              </div>
            </div>
          )}

          {/* SEARCH PAGE HERO TAB */}
          {activeTab === 'search_page_hero' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Search Page Hero Settings</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <MediaUploader
                    currentImage={settings.search_page_hero.hero_image}
                    onImageUploaded={(url) => handleChange('search_page_hero', 'hero_image', url)}
                    label="Search Page Hero Image"
                    hint="Upload the main background image for the search results page hero."
                  />
                </div>
                <div>
                  <label className={labelClass}>Main Heading</label>
                  <input type="text" value={settings.search_page_hero.title || 'Find Your Next Adventure'} onChange={e => handleChange('search_page_hero', 'title', e.target.value)} className={inputClass} placeholder="Find Your Next Adventure" />
                </div>
                <div>
                  <label className={labelClass}>Subheading</label>
                  <input type="text" value={settings.search_page_hero.subtitle || ''} onChange={e => handleChange('search_page_hero', 'subtitle', e.target.value)} className={inputClass} placeholder="Optional subheading" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('search_page_hero')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Search Hero
                </button>
              </div>
            </div>
          )}

          {/* TYPOGRAPHY TAB */}
          {activeTab === 'typography' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Typography Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Heading Font Family</label>
                  <select
                    value={settings.typography.heading_font || 'Ranchers'}
                    onChange={e => handleChange('typography', 'heading_font', e.target.value)}
                    className={inputClass}
                  >
                    <option value="Ranchers">Ranchers (Playful/Bouncy)</option>
                    <option value="Fredoka">Fredoka (Rounded/Modern)</option>
                    <option value="Inter">Inter (Clean/Professional)</option>
                    <option value="Titan One">Titan One (Bold/Playful)</option>
                    <option value="Lilita One">Lilita One (Round/Bold)</option>
                    <option value="Spicy Rice">Spicy Rice (Chunky/Casual)</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('typography')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Typography
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
                  <label className={labelClass}>GST Enabled</label>
                  <select
                    value={settings.package_detail_settings.gst_enabled !== false ? 'true' : 'false'}
                    onChange={e => handleChange('package_detail_settings', 'gst_enabled', e.target.value === 'true')}
                    className={inputClass}
                  >
                    <option value="true">ON</option>
                    <option value="false">OFF</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>GST Label</label>
                  <input 
                    type="text" 
                    disabled={settings.package_detail_settings.gst_enabled === false}
                    value={settings.package_detail_settings.gst_label || ''} 
                    onChange={e => handleChange('package_detail_settings', 'gst_label', e.target.value)} 
                    className={`${inputClass} ${settings.package_detail_settings.gst_enabled === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`} 
                    placeholder="e.g. 5% GST"
                  />
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
              
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Search Results Explore More Style</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Explore More Display Style</label>
                    <select
                      value={settings.explore_more_settings['ffffffff-ffff-ffff-ffff-ffffffffffff'] || 'normal'}
                      onChange={e => handleChange('explore_more_settings', 'ffffffff-ffff-ffff-ffff-ffffffffffff', e.target.value)}
                      className={inputClass}
                    >
                      <option value="normal">Normal (Horizontal Scroll)</option>
                      <option value="advanced_1_1">Advanced (1:1 Square Slider)</option>
                      <option value="advanced_3d">Advanced (3D Coverflow)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select the visual style for the "Explore More Trips" section shown on the Search Results page.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={() => { handleSave('package_detail_settings'); handleSave('explore_more_settings'); }} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
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

              <div className="pt-4 flex justify-end border-t mt-4">
                <button onClick={() => handleSave('trust_benefits')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Experience Section Settings
                </button>
              </div>
            </div>
          )}

          {/* WHY CHOOSE US TRUST BANNERS TAB */}
          {activeTab === 'why_choose_us_banners' && (
            <div className="space-y-6 animate-in">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-lg font-bold text-gray-900">Why Choose Us Banners Settings</h2>
                <button
                  onClick={() => {
                    const banners = settings.why_choose_us_banners?.banners || [];
                    const newBanner = {
                      id: Date.now().toString(),
                      title: 'NEW TRUST BANNER',
                      subtitle: 'Description of trust point',
                      image: '',
                      image_url: '',
                      cta_text: '',
                      cta_label: '',
                      cta_link: '',
                      cta_url: '',
                      active: true,
                      is_active: true,
                      display_order: banners.length + 1,
                      clickable: false
                    };
                    handleChange('why_choose_us_banners', 'banners', [...banners, newBanner]);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold"
                >
                  <Plus size={14} /> Add Trust Banner
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
                <label className={labelClass + " font-bold text-gray-700"}>Why Choose Us Heading</label>
                <input
                  type="text"
                  value={settings.why_choose_us_banners?.title || ''}
                  onChange={e => handleChange('why_choose_us_banners', 'title', e.target.value)}
                  className={inputClass}
                  placeholder="Why Choose Us"
                />
                <p className="text-xs text-gray-400">This centered heading appears directly above the lower trust carousel on the homepage.</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
                <label className={labelClass + " font-bold text-gray-700"}>Why Choose Us Subheading</label>
                <input
                  type="text"
                  value={settings.why_choose_us_banners?.subtitle || ''}
                  onChange={e => handleChange('why_choose_us_banners', 'subtitle', e.target.value)}
                  className={inputClass}
                  placeholder="India's Fastest Growing Travel Company"
                />
                <p className="text-xs text-gray-400">This subheading appears directly below the heading on the homepage.</p>
              </div>

              <div className="space-y-4">
                {(settings.why_choose_us_banners?.banners || []).map((banner, idx) => (
                  <div key={banner.id} className="bg-gray-55 border p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-semibold text-gray-500">Trust Banner #{idx + 1}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            const list = [...(settings.why_choose_us_banners?.banners || [])];
                            if (idx === 0) return;
                            const temp = list[idx]; list[idx] = list[idx - 1]; list[idx - 1] = temp;
                            const updatedList = list.map((b, i) => ({ ...b, display_order: i + 1 }));
                            handleChange('why_choose_us_banners', 'banners', updatedList);
                          }}
                          disabled={idx === 0}
                          className="p-1 bg-white border rounded text-gray-500 disabled:opacity-50"
                        ><ArrowUp size={12} /></button>
                        <button
                          onClick={() => {
                            const list = [...(settings.why_choose_us_banners?.banners || [])];
                            if (idx === list.length - 1) return;
                            const temp = list[idx]; list[idx] = list[idx + 1]; list[idx + 1] = temp;
                            const updatedList = list.map((b, i) => ({ ...b, display_order: i + 1 }));
                            handleChange('why_choose_us_banners', 'banners', updatedList);
                          }}
                          disabled={idx === (settings.why_choose_us_banners?.banners || []).length - 1}
                          className="p-1 bg-white border rounded text-gray-500 disabled:opacity-50"
                        ><ArrowDown size={12} /></button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this trust banner?")) {
                              const list = (settings.why_choose_us_banners?.banners || [])
                                .filter(b => b.id !== banner.id)
                                .map((b, i) => ({ ...b, display_order: i + 1 }));
                              handleChange('why_choose_us_banners', 'banners', list);
                            }
                          }}
                          className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100"
                        ><Trash2 size={12} /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Banner Title</label>
                        <input type="text" value={banner.title || ''}
                          onChange={e => {
                            const list = (settings.why_choose_us_banners?.banners || []).map(b => b.id === banner.id ? { ...b, title: e.target.value } : b);
                            handleChange('why_choose_us_banners', 'banners', list);
                          }}
                          className={inputClass} placeholder="Best for Solo Travelers" />
                      </div>
                      <div>
                        <label className={labelClass}>Status</label>
                        <select value={(banner.active !== undefined ? banner.active : banner.is_active) !== false ? 'true' : 'false'}
                          onChange={e => {
                            const list = (settings.why_choose_us_banners?.banners || []).map(b => b.id === banner.id ? { ...b, active: e.target.value === 'true', is_active: e.target.value === 'true' } : b);
                            handleChange('why_choose_us_banners', 'banners', list);
                          }}
                          className={inputClass}>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Subtitle / Description</label>
                        <input type="text" value={banner.subtitle || ''}
                          onChange={e => {
                            const list = (settings.why_choose_us_banners?.banners || []).map(b => b.id === banner.id ? { ...b, subtitle: e.target.value } : b);
                            handleChange('why_choose_us_banners', 'banners', list);
                          }}
                          className={inputClass} placeholder="Travel solo. Return with a tribe." />
                      </div>
                      <div className="md:col-span-2">
                        <MediaUploader
                          url={banner.image || banner.image_url || ''}
                          onUrlChange={url => {
                            const list = (settings.why_choose_us_banners?.banners || []).map(b => b.id === banner.id ? { ...b, image: url, image_url: url } : b);
                            handleChange('why_choose_us_banners', 'banners', list);
                          }}
                          folder="why_choose_us_banners"
                          label="Banner Image"
                          hint="Upload a wide trust banner image. Recommended ratio: 1200x200 px."
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Clickable (Yes / No)</label>
                        <select value={banner.clickable ? 'true' : 'false'}
                          onChange={e => {
                            const val = e.target.value === 'true';
                            const list = (settings.why_choose_us_banners?.banners || []).map(b => b.id === banner.id ? { ...b, clickable: val, is_clickable: val } : b);
                            handleChange('why_choose_us_banners', 'banners', list);
                          }}
                          className={inputClass}>
                            <option value="false">NO (Display Only - No Navigation)</option>
                            <option value="true">YES (Navigates to Route/URL on click)</option>
                        </select>
                      </div>
                      {banner.clickable && (
                        <>
                          <div>
                            <label className={labelClass}>CTA Button Label (optional)</label>
                            <input type="text" value={banner.cta_text || banner.cta_label || ''}
                              onChange={e => {
                                const list = (settings.why_choose_us_banners?.banners || []).map(b => b.id === banner.id ? { ...b, cta_text: e.target.value, cta_label: e.target.value } : b);
                                handleChange('why_choose_us_banners', 'banners', list);
                              }}
                              className={inputClass} placeholder="Learn More" />
                          </div>
                          <div>
                            <label className={labelClass}>CTA Link / URL</label>
                            <input type="text" value={banner.cta_link || banner.cta_url || ''}
                              onChange={e => {
                                const list = (settings.why_choose_us_banners?.banners || []).map(b => b.id === banner.id ? { ...b, cta_link: e.target.value, cta_url: e.target.value } : b);
                                handleChange('why_choose_us_banners', 'banners', list);
                              }}
                              className={inputClass} placeholder="/group-trips or https://..." />
                          </div>
                        </>
                      )}
                      <div>
                        <label className={labelClass}>Display Order</label>
                        <input type="number" value={banner.display_order || ''}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 1;
                            const list = (settings.why_choose_us_banners?.banners || []).map(b => b.id === banner.id ? { ...b, display_order: val } : b);
                            handleChange('why_choose_us_banners', 'banners', list);
                          }}
                          className={inputClass} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('why_choose_us_banners')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Why Choose Us Settings
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
                <div>
                  <label className={labelClass}>Background Image URL</label>
                  <input
                    type="text"
                    value={settings.stats_strip.background_image || ''}
                    onChange={e => handleChange('stats_strip', 'background_image', e.target.value)}
                    className={inputClass}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Leave empty for a plain background.</p>
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

          {/* CUSTOMER SUPPORT TAB */}
          {activeTab === 'customer_support' && (
            <div className="space-y-6 animate-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Customer Account Support Configuration</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* WhatsApp */}
                <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><MessageSquare size={16}/> WhatsApp</h3>
                    <select value={settings.customer_support?.whatsapp?.enabled !== false ? 'true' : 'false'} onChange={e => handleChange('customer_support', 'whatsapp', { ...settings.customer_support.whatsapp, enabled: e.target.value === 'true' })} className={inputClass + " w-32 py-1"}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Label/Title</label>
                    <input type="text" value={settings.customer_support?.whatsapp?.title || ''} onChange={e => handleChange('customer_support', 'whatsapp', { ...settings.customer_support.whatsapp, title: e.target.value })} className={inputClass} placeholder="WhatsApp" />
                  </div>
                  <div>
                    <label className={labelClass}>WhatsApp Number</label>
                    <input type="text" value={settings.customer_support?.whatsapp?.value || ''} onChange={e => handleChange('customer_support', 'whatsapp', { ...settings.customer_support.whatsapp, value: e.target.value })} className={inputClass} placeholder="+91 00000 00000" />
                  </div>
                  <div>
                    <label className={labelClass}>Optional Description</label>
                    <textarea value={settings.customer_support?.whatsapp?.description || ''} onChange={e => handleChange('customer_support', 'whatsapp', { ...settings.customer_support.whatsapp, description: e.target.value })} className={inputClass} rows={2} />
                  </div>
                </div>

                {/* Call */}
                <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><MessageSquare size={16}/> Call</h3>
                    <select value={settings.customer_support?.call?.enabled !== false ? 'true' : 'false'} onChange={e => handleChange('customer_support', 'call', { ...settings.customer_support.call, enabled: e.target.value === 'true' })} className={inputClass + " w-32 py-1"}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Label/Title</label>
                    <input type="text" value={settings.customer_support?.call?.title || ''} onChange={e => handleChange('customer_support', 'call', { ...settings.customer_support.call, title: e.target.value })} className={inputClass} placeholder="Call Us" />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input type="text" value={settings.customer_support?.call?.value || ''} onChange={e => handleChange('customer_support', 'call', { ...settings.customer_support.call, value: e.target.value })} className={inputClass} placeholder="+91 00000 00000" />
                  </div>
                  <div>
                    <label className={labelClass}>Optional Description</label>
                    <textarea value={settings.customer_support?.call?.description || ''} onChange={e => handleChange('customer_support', 'call', { ...settings.customer_support.call, description: e.target.value })} className={inputClass} rows={2} />
                  </div>
                </div>

                {/* Email */}
                <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><MessageSquare size={16}/> Email</h3>
                    <select value={settings.customer_support?.email?.enabled !== false ? 'true' : 'false'} onChange={e => handleChange('customer_support', 'email', { ...settings.customer_support.email, enabled: e.target.value === 'true' })} className={inputClass + " w-32 py-1"}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Label/Title</label>
                    <input type="text" value={settings.customer_support?.email?.title || ''} onChange={e => handleChange('customer_support', 'email', { ...settings.customer_support.email, title: e.target.value })} className={inputClass} placeholder="Email" />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="text" value={settings.customer_support?.email?.value || ''} onChange={e => handleChange('customer_support', 'email', { ...settings.customer_support.email, value: e.target.value })} className={inputClass} placeholder="support@example.com" />
                  </div>
                  <div>
                    <label className={labelClass}>Optional Description</label>
                    <textarea value={settings.customer_support?.email?.description || ''} onChange={e => handleChange('customer_support', 'email', { ...settings.customer_support.email, description: e.target.value })} className={inputClass} rows={2} />
                  </div>
                </div>

                {/* Live Chat */}
                <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><MessageSquare size={16}/> Live Chat</h3>
                    <select value={settings.customer_support?.live_chat?.enabled !== false ? 'true' : 'false'} onChange={e => handleChange('customer_support', 'live_chat', { ...settings.customer_support.live_chat, enabled: e.target.value === 'true' })} className={inputClass + " w-32 py-1"}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Label/Title</label>
                    <input type="text" value={settings.customer_support?.live_chat?.title || ''} onChange={e => handleChange('customer_support', 'live_chat', { ...settings.customer_support.live_chat, title: e.target.value })} className={inputClass} placeholder="Live Chat" />
                  </div>
                  <div>
                    <label className={labelClass}>Explanatory Text</label>
                    <textarea value={settings.customer_support?.live_chat?.description || ''} onChange={e => handleChange('customer_support', 'live_chat', { ...settings.customer_support.live_chat, description: e.target.value })} className={inputClass} rows={3} placeholder="Need quick help? You can chat with our support team directly." />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={() => handleSave('customer_support')} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save size={16} /> Save Support Settings
                </button>
              </div>
            </div>
          )}

          {/* HOMEPAGE SECTION ORDER TAB */}
          {activeTab === 'homepage_section_order' && (() => {
            const list = homepageSectionOrder || [];
            
            // Map keys to human-readable names
            const SECTION_NAMES = {
              destinations: 'Destinations Circular Strip',
              interests: 'Destination According To Interest Strip',
              promo_carousel: 'Top Large Promo Banner Carousel',
              recommended: 'Recommended Packages Grid',
              static_banner: 'Homepage Static Banner',
              why_choose_us: 'Why Choose Us (Heading Title)',
              why_choose_us_carousel: 'Why Choose Us (Trust Carousel)',
              best_seller: 'Best Seller Packages Grid',
              upcoming_trips: 'Upcoming Trips Packages Grid',
              stats_strip: 'Stats Counters Strip',
              international: 'International Packages Grid',
              testimonials: 'Customer Testimonials Carousel'
            };

            const moveSection = (fromIndex, toIndex) => {
              if (
                fromIndex < 0 ||
                toIndex < 0 ||
                fromIndex >= list.length ||
                toIndex >= list.length
              ) return;

              const next = [...list];
              const [moved] = next.splice(fromIndex, 1);
              next.splice(toIndex, 0, moved);

              setHomepageSectionOrder(next);
            };

            const handleReset = () => {
              const DEFAULT_ORDER = [
                'destinations',
                'interests',
                'promo_carousel',
                'recommended',
                'static_banner',
                'why_choose_us',
                'why_choose_us_carousel',
                'best_seller',
                'upcoming_trips',
                'stats_strip',
                'international',
                'testimonials'
              ];
              setHomepageSectionOrder(DEFAULT_ORDER);
            };

            return (
              <div className="space-y-6 animate-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-2 gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Homepage Layout Manager</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Drag sections or use up/down arrows to reorder how they appear on the homepage.</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleReset();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Reset to Default Order
                  </button>
                </div>

                <div className="space-y-2 max-w-2xl">
                  {list.map((key, index) => (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', index.toString());
                        e.currentTarget.classList.add('opacity-50');
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('opacity-50');
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (isNaN(fromIndex) || fromIndex === index) return;
                        moveSection(fromIndex, index);
                      }}
                      className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 text-sm">{SECTION_NAMES[key] || key}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 ml-2 font-mono uppercase tracking-wider">{key}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            moveSection(index, index - 1);
                          }}
                          disabled={index === 0}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                          title="Move Up"
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            moveSection(index, index + 1);
                          }}
                          disabled={index === list.length - 1}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                          title="Move Down"
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end border-t mt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSaveLayoutOrder();
                    }}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <Save size={16} /> Save Homepage Section Order
                  </button>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
};

export default AdminSiteSettings;
