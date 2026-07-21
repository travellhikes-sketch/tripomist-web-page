import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Image, 
  Edit3, 
  Trash2, 
  Plus, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  
  const initialFormState = {
    label: '',
    title: '',
    highlighted_text: '',
    subtitle: '',
    price_text: '',
    desktop_image: '',
    button_text: 'Explore Now',
    button_link: '',
    display_order: 0,
    is_active: true
  };
  const [formData, setFormData] = useState(initialFormState);

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
    setFormData(banner);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentBanner(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentBanner) {
        const { error } = await supabase
          .from('promotional_banners')
          .update(formData)
          .eq('id', currentBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotional_banners')
          .insert([formData]);
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
      const { error } = await supabase
        .from('promotional_banners')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('promotional_banners')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotional Banners</h1>
          <p className="text-gray-500 mt-1">Manage the large sliding banners on the homepage.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-[#136b8a] text-white px-4 py-2 rounded-xl hover:bg-[#0f556e] transition-colors shadow-sm font-medium"
          >
            <Plus size={18} />
            Add Banner
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-bold">{currentBanner ? 'Edit Banner' : 'New Banner'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Small Top Label</label>
              <input type="text" name="label" value={formData.label || ''} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="e.g. Special Summer Offer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" name="title" value={formData.title || ''} onChange={handleInputChange} className="w-full p-2 border rounded" required placeholder="e.g. BURNT OUT?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Highlighted Text</label>
              <input type="text" name="highlighted_text" value={formData.highlighted_text || ''} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="e.g. ESCAPE TO CHANDRATAAL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input type="text" name="subtitle" value={formData.subtitle || ''} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="e.g. THIS SUMMER" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Text</label>
              <input type="text" name="price_text" value={formData.price_text || ''} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="e.g. Trips starting at Rs 17,999" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input type="url" name="desktop_image" value={formData.desktop_image || ''} onChange={handleInputChange} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input type="text" name="button_text" value={formData.button_text || ''} onChange={handleInputChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
              <input type="text" name="button_link" value={formData.button_link || ''} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="e.g. /itinerary/spiti-valley" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input type="number" name="display_order" value={formData.display_order} onChange={handleInputChange} className="w-full p-2 border rounded" />
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 mr-2" />
              <label className="text-sm font-medium text-gray-700">Active Banner</label>
            </div>
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
