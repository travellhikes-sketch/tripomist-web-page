import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Image, Edit3, Trash2, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import MediaUploader from '../../components/admin/MediaUploader';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  
  const initialFormState = {
    label: '', title: '', highlighted_text: '', subtitle: '', price_text: '', desktop_image: '',
    button_text: 'Explore Now', button_link: '', display_order: 0, is_active: true,
    slug: '', mobile_banner: '', short_description: '', full_description: '',
    duration: '', price: '', original_price: '', discount_text: '', destination: '', state: '',
    itinerary: '', inclusions: '', exclusions: '', costings: '', status: 'active', is_clickable: true,
    internal_name: '', promo_stripe_text: '', page_title: '', page_subtitle: '', content: '',
    cta_text: 'View Offer', cta_link: '', start_date: '', end_date: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEdit = (banner) => {
    setCurrentBanner(banner);
    setFormData({
      ...banner,
      price: banner.price != null ? banner.price : '',
      original_price: banner.original_price != null ? banner.original_price : '',
      itinerary: banner.itinerary ? JSON.stringify(banner.itinerary, null, 2) : '',
      inclusions: banner.inclusions ? JSON.stringify(banner.inclusions, null, 2) : '',
      exclusions: banner.exclusions ? JSON.stringify(banner.exclusions, null, 2) : '',
      costings: banner.costings ? JSON.stringify(banner.costings, null, 2) : '',
      is_clickable: banner.is_clickable ?? true,
      status: banner.status || 'active',
      start_date: banner.start_date ? new Date(banner.start_date).toISOString().slice(0, 16) : '',
      end_date: banner.end_date ? new Date(banner.end_date).toISOString().slice(0, 16) : ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentBanner(null);
    setFormData(initialFormState);
    setJsonError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setJsonError('');

    let parsedItinerary = null, parsedInclusions = null, parsedExclusions = null, parsedCostings = null;
    try {
      if (formData.itinerary && formData.itinerary.trim()) parsedItinerary = JSON.parse(formData.itinerary);
      if (formData.inclusions && formData.inclusions.trim()) parsedInclusions = JSON.parse(formData.inclusions);
      if (formData.exclusions && formData.exclusions.trim()) parsedExclusions = JSON.parse(formData.exclusions);
      if (formData.costings && formData.costings.trim()) parsedCostings = JSON.parse(formData.costings);
    } catch (err) {
      setJsonError('Invalid JSON: ' + err.message);
      return;
    }

    const submitData = {
      ...formData,
      price: formData.price ? Number(formData.price) : null,
      original_price: formData.original_price ? Number(formData.original_price) : null,
      itinerary: parsedItinerary,
      inclusions: parsedInclusions,
      exclusions: parsedExclusions,
      costings: parsedCostings,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
    };

    try {
      if (currentBanner) {
        const { error } = await supabase.from('promotional_banners').update(submitData).eq('id', currentBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('promotional_banners').insert([submitData]);
        if (error) throw error;
      }
      fetchBanners();
      handleCancel();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const { error } = await supabase.from('promotional_banners').delete().eq('id', id);
      if (error) throw error;
      fetchBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase.from('promotional_banners').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    } catch (err) {
      setError(err.message);
    }
  };

  const inputClass = "w-full p-2 border border-gray-300 rounded focus:border-[#136b8a] outline-none text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotional Banners</h1>
          <p className="text-gray-500 mt-1">Manage sliding banners and banner detail pages.</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-[#136b8a] text-white px-4 py-2 rounded-xl hover:bg-[#0f556e] transition-colors shadow-sm font-medium">
            <Plus size={18} /> Add Banner
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold">{currentBanner ? 'Edit Banner' : 'New Banner'}</h2>
          
          {jsonError && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{jsonError}</div>}

          {/* Core Banner Visuals */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold border-b pb-2">1. Visuals & Layout</h3>
            <div className="grid grid-cols-1 gap-6 mb-4">
              <MediaUploader 
                url={formData.desktop_image} 
                onUrlChange={(url) => setFormData({...formData, desktop_image: url})} 
                folder="banners" 
                label="Desktop Image URL *"
              />
              <MediaUploader 
                url={formData.mobile_banner} 
                onUrlChange={(url) => setFormData({...formData, mobile_banner: url})} 
                folder="banners" 
                label="Mobile Image URL (Optional)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Small Top Label</label><input type="text" name="label" value={formData.label || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Title *</label><input type="text" name="title" value={formData.title || ''} onChange={handleInputChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Highlighted Text</label><input type="text" name="highlighted_text" value={formData.highlighted_text || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Subtitle</label><input type="text" name="subtitle" value={formData.subtitle || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Display Order</label><input type="number" name="display_order" value={formData.display_order} onChange={handleInputChange} className={inputClass} /></div>
            </div>
          </div>

          {/* Navigation & Status */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold border-b pb-2">2. Interactions & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2 justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_clickable" checked={formData.is_clickable} onChange={handleInputChange} className="w-4 h-4" />
                  <span className="text-sm font-medium">Banner is Clickable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4" />
                  <span className="text-sm font-medium">Banner is Active</span>
                </label>
              </div>
              <div><label className={labelClass}>Button CTA Text</label><input type="text" name="button_text" value={formData.button_text || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Legacy Link (Ignore if using Detail Page)</label><input type="text" name="button_link" value={formData.button_link || ''} onChange={handleInputChange} className={inputClass} /></div>
            </div>
          </div>

          {/* Banner Detail Content */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold border-b pb-2">3. Detail Page Content (If Clickable is ON)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={labelClass}>Slug *</label><input type="text" name="slug" value={formData.slug || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Destination</label><input type="text" name="destination" value={formData.destination || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>State</label><input type="text" name="state" value={formData.state || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Duration</label><input type="text" name="duration" value={formData.duration || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Price (₹)</label><input type="number" name="price" value={formData.price || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Original Price (₹)</label><input type="number" name="original_price" value={formData.original_price || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Discount Text</label><input type="text" name="discount_text" value={formData.discount_text || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Price Summary Text</label><input type="text" name="price_text" value={formData.price_text || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g. Starting from 19999" /></div>
            </div>
            <div><label className={labelClass}>Short Description</label><textarea name="short_description" value={formData.short_description || ''} onChange={handleInputChange} className={inputClass} rows={2} /></div>
            <div><label className={labelClass}>Full Description</label><textarea name="full_description" value={formData.full_description || ''} onChange={handleInputChange} className={inputClass} rows={4} /></div>
          </div>

          {/* Dynamic Promo Offer Page Content */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold border-b pb-2">3b. Promo Offer Page & Stripe Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Internal Promo Name</label><input type="text" name="internal_name" value={formData.internal_name || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Promo Stripe Text</label><input type="text" name="promo_stripe_text" value={formData.promo_stripe_text || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Promo Page Title</label><input type="text" name="page_title" value={formData.page_title || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Promo Page Subtitle</label><input type="text" name="page_subtitle" value={formData.page_subtitle || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>CTA Button Text</label><input type="text" name="cta_text" value={formData.cta_text || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>CTA Button Link</label><input type="text" name="cta_link" value={formData.cta_link || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Start Date</label><input type="datetime-local" name="start_date" value={formData.start_date || ''} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>End Date</label><input type="datetime-local" name="end_date" value={formData.end_date || ''} onChange={handleInputChange} className={inputClass} /></div>
            </div>
            <div><label className={labelClass}>Full Offer Content</label><textarea name="content" value={formData.content || ''} onChange={handleInputChange} className={inputClass} rows={4} /></div>
          </div>

          {/* Detail JSONs */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold border-b pb-2">4. Detail JSON Fields</h3>
            <div><label className={labelClass}>Itinerary JSON</label><textarea name="itinerary" value={formData.itinerary || ''} onChange={handleInputChange} className={`${inputClass} font-mono`} rows={4} /></div>
            <div><label className={labelClass}>Inclusions JSON</label><textarea name="inclusions" value={formData.inclusions || ''} onChange={handleInputChange} className={`${inputClass} font-mono`} rows={3} /></div>
            <div><label className={labelClass}>Exclusions JSON</label><textarea name="exclusions" value={formData.exclusions || ''} onChange={handleInputChange} className={`${inputClass} font-mono`} rows={3} /></div>
            <div><label className={labelClass}>Costings JSON</label><textarea name="costings" value={formData.costings || ''} onChange={handleInputChange} className={`${inputClass} font-mono`} rows={3} /></div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button type="submit" className="bg-[#136b8a] text-white px-6 py-2 rounded-lg hover:bg-[#0f556e]">Save Banner</button>
            <button type="button" onClick={handleCancel} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      ) : loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a]"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <img src={banner.desktop_image} alt={banner.title} className="w-full h-40 object-cover rounded-xl mb-4" />
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{banner.title} <span className="text-[#136b8a]">{banner.highlighted_text}</span></h3>
                    <p className="text-xs text-gray-500 mt-1">{banner.label} • {banner.price_text}</p>
                    {banner.is_clickable && banner.slug && <p className="text-xs text-blue-500 mt-1 hover:underline cursor-pointer">/banner/{banner.slug}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${banner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {banner.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400 font-mono">Order: {banner.display_order}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleActive(banner.id, banner.is_active)} className={`p-1.5 rounded-lg border ${banner.is_active ? 'text-amber-600 hover:bg-amber-50 border-amber-100' : 'text-emerald-600 hover:bg-emerald-50 border-emerald-100'}`} title="Toggle Status">
                    {banner.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>
                  <button onClick={() => handleEdit(banner)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100" title="Edit">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(banner.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
