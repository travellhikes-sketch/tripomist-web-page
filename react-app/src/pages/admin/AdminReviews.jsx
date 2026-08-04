import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import MediaUploader from '../../components/admin/MediaUploader';
import {
  Plus, Edit2, Trash2, Search, Star, Image as ImageIcon,
  Save, X, Settings, List, MessageSquare, Play, Video
} from 'lucide-react';

const AdminReviews = () => {
  // Tabs
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'page_settings', 'homepage_settings'

  // Reviews Tab State
  const [reviews, setReviews] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterApproved, setFilterApproved] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_image_url: '',
    rating: 5,
    review_text: '',
    package_id: '',
    package_title: '',
    destination: '',
    review_date: new Date().toISOString().split('T')[0],
    is_featured: false,
    is_approved: true,
    display_order: 0,
    source: 'Google',
    verified: true,
    read_more_link: ''
  });

  // Page Settings State
  const [pageSettings, setPageSettings] = useState({
    heading: 'Customer Reviews',
    subheading: 'What our travelers say about their journeys with us.',
    banner_url: '',
    mobile_banner_url: '',
    show_banner: true,
    gallery_heading: 'Travel Memories Gallery'
  });

  // Testimonials / Summary Settings State
  const [testimonialsSettings, setTestimonialsSettings] = useState({
    heading: 'Client testimonials',
    subtext: 'Real travelers. Real stories. Real opinions to help you make the right choice.',
    bg_color: '#ffffff',
    text_color: '#1f2937',
    enable_autoscroll: true,
    autoplay_speed: 4000,
    rating_label: 'EXCELLENT',
    avg_rating: 4.8,
    review_count: '2,154',
    source_name: 'Google',
    show_summary: true,
    is_active: true,
    button_text: 'See all testimonials',
    see_all_link: '/reviews'
  });

  // Media Gallery State
  const [galleryList, setGalleryList] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [newMedia, setNewMedia] = useState({
    media_type: 'image',
    media_url: '',
    thumbnail_url: '',
    title: '',
    display_order: 0,
    is_active: true
  });
  const [mediaSaving, setMediaSaving] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchPackages();
    fetchPageSettings();
    fetchTestimonialsSettings();
    fetchGalleryMedia();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('Pakage')
        .select('id, title, destination')
        .eq('status', 'active');
      if (fetchErr) throw fetchErr;
      setPackages(data || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
    }
  };

  const fetchPageSettings = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'reviews_page_settings')
        .single();
      if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;
      if (data?.setting_value) {
        setPageSettings(prev => ({ ...prev, ...data.setting_value }));
      }
    } catch (err) {
      console.error('Error fetching page settings:', err);
    }
  };

  const fetchTestimonialsSettings = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'testimonials_section')
        .single();
      if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;
      if (data?.setting_value) {
        setTestimonialsSettings(prev => ({ ...prev, ...data.setting_value }));
      }
    } catch (err) {
      console.error('Error fetching testimonials settings:', err);
    }
  };

  const fetchGalleryMedia = async () => {
    setGalleryLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('gallery_media')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (fetchErr) throw fetchErr;
      setGalleryList(data || []);
    } catch (err) {
      console.error('Error fetching gallery media:', err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const openModal = (review = null) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        customer_name: review.customer_name || '',
        customer_email: review.customer_email || '',
        customer_phone: review.customer_phone || '',
        customer_image_url: review.customer_image_url || '',
        rating: review.rating || 5,
        review_text: review.review_text || '',
        package_id: review.package_id || '',
        package_title: review.package_title || '',
        destination: review.destination || '',
        review_date: review.review_date || new Date().toISOString().split('T')[0],
        is_featured: review.is_featured || false,
        is_approved: review.is_approved || false,
        display_order: review.display_order || 0,
        source: review.source || 'Google',
        verified: review.verified !== false,
        read_more_link: review.read_more_link || ''
      });
    } else {
      setEditingReview(null);
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_image_url: '',
        rating: 5,
        review_text: '',
        package_id: '',
        package_title: '',
        destination: '',
        review_date: new Date().toISOString().split('T')[0],
        is_featured: false,
        is_approved: true,
        display_order: 0,
        source: 'Google',
        verified: true,
        read_more_link: ''
      });
    }
    setIsModalOpen(true);
  };

  const handlePackageChange = (e) => {
    const pkgId = e.target.value;
    const selectedPkg = packages.find(p => String(p.id) === String(pkgId));
    setFormData(prev => ({
      ...prev,
      package_id: pkgId,
      package_title: selectedPkg ? selectedPkg.title : '',
      destination: selectedPkg ? selectedPkg.destination : prev.destination
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (formData.rating < 1 || formData.rating > 5) throw new Error("Rating must be between 1 and 5");
      if (!formData.review_text.trim()) throw new Error("Review text cannot be empty");

      const payload = {
        ...formData,
        package_id: formData.package_id ? Number(formData.package_id) : null,
      };

      if (editingReview) {
        const { error: updateErr } = await supabase
          .from('reviews')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingReview.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('reviews')
          .insert([payload]);
        if (insertErr) throw insertErr;
      }

      setIsModalOpen(false);
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert(err.message || err.details || err.hint || JSON.stringify(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const { error: deleteErr } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      if (deleteErr) throw deleteErr;
      fetchReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (id, field, currentValue) => {
    try {
      const { error: updateErr } = await supabase
        .from('reviews')
        .update({ [field]: !currentValue, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (updateErr) throw updateErr;
      fetchReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  // Page Settings Save
  const handleSavePageSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error: upsertErr } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'reviews_page_settings',
          setting_value: pageSettings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
      if (upsertErr) throw upsertErr;
      alert('Reviews page settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Testimonials Settings Save
  const handleSaveTestimonialsSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Keep existing manual cards override untouched to preserve it in testimonials_section setting_value.
      const payload = {
        ...testimonialsSettings,
        cards: testimonialsSettings.cards || [] // Preserve existing cards if they exist
      };

      const { error: upsertErr } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'testimonials_section',
          setting_value: payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
      if (upsertErr) throw upsertErr;
      alert('Testimonials settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Gallery CRUD Operations
  const handleAddMedia = async (e) => {
    e.preventDefault();
    if (!newMedia.media_url) {
      alert('Please upload or enter a Media URL.');
      return;
    }
    setNewMedia(prev => ({ ...prev })); // Dummy update to trigger rerender if needed
    setMediaSaving(true);
    try {
      const { error: insertErr } = await supabase
        .from('gallery_media')
        .insert([newMedia]);
      if (insertErr) throw insertErr;

      setNewMedia({
        media_type: 'image',
        media_url: '',
        thumbnail_url: '',
        title: '',
        display_order: 0,
        is_active: true
      });
      fetchGalleryMedia();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setMediaSaving(false);
    }
  };

  const handleUpdateMediaField = async (id, field, value) => {
    try {
      const { error: updateErr } = await supabase
        .from('gallery_media')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (updateErr) throw updateErr;
      fetchGalleryMedia();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMedia = async (id) => {
    if (!window.confirm("Are you sure you want to delete this media?")) return;
    try {
      const { error: deleteErr } = await supabase
        .from('gallery_media')
        .delete()
        .eq('id', id);
      if (deleteErr) throw deleteErr;
      fetchGalleryMedia();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtering and Sorting Reviews
  let filteredReviews = reviews.filter(r => {
    const searchMatch =
      (r.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.package_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.review_text || '').toLowerCase().includes(searchTerm.toLowerCase());

    const ratingMatch = filterRating === 'all' || r.rating.toString() === filterRating;
    const approvedMatch = filterApproved === 'all' || (filterApproved === 'true' ? r.is_approved : !r.is_approved);
    const featuredMatch = filterFeatured === 'all' || (filterFeatured === 'true' ? r.is_featured : !r.is_featured);

    return searchMatch && ratingMatch && approvedMatch && featuredMatch;
  });

  filteredReviews.sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'order') return (a.display_order || 0) - (b.display_order || 0);
    return 0;
  });

  const renderStars = (rating) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} className={i < rating ? "" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews & Gallery Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer reviews, testimonials, trust-summary stats, and the media gallery.</p>
        </div>
        {activeTab === 'list' && (
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Add Review
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <List size={18} /> Customer Reviews
          </button>
          <button
            onClick={() => setActiveTab('page_settings')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'page_settings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <ImageIcon size={18} /> Reviews Page Settings
          </button>
          <button
            onClick={() => setActiveTab('homepage_settings')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'homepage_settings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Settings size={18} /> Testimonials Settings
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* TAB 1: REVIEWS LIST */}
      {activeTab === 'list' && (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by customer, package, or destination..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filterRating} onChange={e => setFilterRating(e.target.value)}>
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filterApproved} onChange={e => setFilterApproved(e.target.value)}>
                <option value="all">All Status</option>
                <option value="true">Approved</option>
                <option value="false">Hidden</option>
              </select>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filterFeatured} onChange={e => setFilterFeatured(e.target.value)}>
                <option value="all">All Types</option>
                <option value="true">Featured Only</option>
                <option value="false">Standard Only</option>
              </select>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="order">Display Order</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating & Review</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package / Destination</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading reviews...</td></tr>
                  ) : filteredReviews.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No reviews found.</td></tr>
                  ) : (
                    filteredReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                              {review.customer_image_url ? (
                                <img src={review.customer_image_url} alt="" className="h-10 w-10 object-cover" />
                              ) : (
                                <ImageIcon size={20} className="text-gray-400" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{review.customer_name}</div>
                              <div className="text-sm text-gray-500">{review.customer_email || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="mb-1">{renderStars(review.rating)}</div>
                          <div className="text-sm text-gray-900 line-clamp-2" title={review.review_text}>{review.review_text}</div>
                          <div className="text-xs text-gray-500 mt-1">{new Date(review.review_date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{review.package_title || '-'}</div>
                          <div className="text-sm text-gray-500">{review.destination || 'General Review'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2 items-center">
                            <button
                              onClick={() => handleToggleStatus(review.id, 'is_approved', review.is_approved)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${review.is_approved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                            >
                              {review.is_approved ? 'Approved' : 'Hidden'}
                            </button>
                            <button
                              onClick={() => handleToggleStatus(review.id, 'is_featured', review.is_featured)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${review.is_featured ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                            >
                              {review.is_featured ? 'Featured' : 'Standard'}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => openModal(review)} className="text-blue-600 hover:text-blue-900 mx-2 p-1 bg-blue-50 rounded">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(review.id)} className="text-red-600 hover:text-red-900 mx-2 p-1 bg-red-50 rounded">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: REVIEWS PAGE SETTINGS (BANNER & GALLERY) */}
      {activeTab === 'page_settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Banner Settings */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Banner Settings</h2>

            <form onSubmit={handleSavePageSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Main Heading</label>
                <input
                  type="text"
                  value={pageSettings.heading}
                  onChange={e => setPageSettings({...pageSettings, heading: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Subheading</label>
                <input
                  type="text"
                  value={pageSettings.subheading}
                  onChange={e => setPageSettings({...pageSettings, subheading: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gallery Heading</label>
                <input
                  type="text"
                  value={pageSettings.gallery_heading}
                  onChange={e => setPageSettings({...pageSettings, gallery_heading: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show_banner"
                  checked={pageSettings.show_banner}
                  onChange={e => setPageSettings({...pageSettings, show_banner: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="show_banner" className="ml-2 text-sm font-medium text-gray-900">Show Header Banner</label>
              </div>

              <div className="border-t pt-4">
                <MediaUploader
                  url={pageSettings.banner_url}
                  onUrlChange={url => setPageSettings({...pageSettings, banner_url: url})}
                  label="Desktop Banner Image"
                  folder="reviews"
                />
              </div>

              <div className="border-t pt-4">
                <MediaUploader
                  url={pageSettings.mobile_banner_url}
                  onUrlChange={url => setPageSettings({...pageSettings, mobile_banner_url: url})}
                  label="Mobile Banner Image (Optional)"
                  folder="reviews"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Banner Settings'}
              </button>
            </form>
          </div>

          {/* Right panel: Gallery Media Management */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Manage Travel Media Gallery</h2>

            {/* Add New Media Form */}
            <form onSubmit={handleAddMedia} className="bg-gray-50 p-4 rounded-xl border space-y-4">
              <h3 className="text-sm font-bold text-gray-800">Add Image/Video to Gallery</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                  <select
                    value={newMedia.media_type}
                    onChange={e => setNewMedia({...newMedia, media_type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caption / Title</label>
                  <input
                    type="text"
                    value={newMedia.title}
                    onChange={e => setNewMedia({...newMedia, title: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Paragliding in Manali"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={newMedia.display_order}
                    onChange={e => setNewMedia({...newMedia, display_order: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="new_media_active"
                    checked={newMedia.is_active}
                    onChange={e => setNewMedia({...newMedia, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="new_media_active" className="ml-2 text-sm font-medium text-gray-900">Active (Visible)</label>
                </div>
              </div>

              <div className="border-t pt-4">
                <MediaUploader
                  url={newMedia.media_url}
                  onUrlChange={url => setNewMedia({...newMedia, media_url: url})}
                  label="Upload Media File"
                  folder="gallery"
                />
              </div>

              {newMedia.media_type === 'video' && (
                <div className="border-t pt-4">
                  <MediaUploader
                    url={newMedia.thumbnail_url}
                    onUrlChange={url => setNewMedia({...newMedia, thumbnail_url: url})}
                    label="Video Thumbnail Image"
                    folder="gallery_thumbs"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={mediaSaving}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                <Plus size={16} /> {mediaSaving ? 'Adding...' : 'Add to Media Gallery'}
              </button>
            </form>

            {/* Existing Media List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800">Uploaded Gallery Media ({galleryList.length})</h3>

              {galleryLoading ? (
                <p className="text-gray-500 text-sm">Loading gallery media...</p>
              ) : galleryList.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No gallery items uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {galleryList.map(item => (
                    <div key={item.id} className="border rounded-xl p-4 flex gap-4 bg-white hover:shadow-sm">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img src={item.thumbnail_url || item.media_url} alt="" className="w-full h-full object-cover" />
                        {item.media_type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-5 h-5 text-white fill-current" />
                          </div>
                        )}
                      </div>

                      <div className="flex-grow space-y-2 min-w-0">
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={e => handleUpdateMediaField(item.id, 'title', e.target.value)}
                          className="w-full font-semibold text-sm border-b focus:border-blue-500 focus:outline-none"
                          placeholder="Untitled Caption"
                        />

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="capitalize">{item.media_type}</span>
                          <div className="flex items-center gap-2">
                            <span>Order:</span>
                            <input
                              type="number"
                              value={item.display_order}
                              onChange={e => handleUpdateMediaField(item.id, 'display_order', Number(e.target.value))}
                              className="w-12 border rounded px-1 text-center"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleUpdateMediaField(item.id, 'is_active', !item.is_active)}
                            className={`px-2 py-0.5 rounded text-xs font-bold border ${item.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => handleDeleteMedia(item.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOMEPAGE TESTIMONIALS & TRUST SUMMARY DISPLAY SETTINGS */}
      {activeTab === 'homepage_settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel: Trust Summary Display settings */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Trust Summary Settings</h2>

            <form onSubmit={handleSaveTestimonialsSettings} className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show_summary"
                  checked={testimonialsSettings.show_summary !== false}
                  onChange={e => setTestimonialsSettings({...testimonialsSettings, show_summary: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="show_summary" className="ml-2 text-sm font-medium text-gray-900">Show Google Trust Summary Block</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating Label (e.g. EXCELLENT)</label>
                <input
                  type="text"
                  value={testimonialsSettings.rating_label || ''}
                  onChange={e => setTestimonialsSettings({...testimonialsSettings, rating_label: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="EXCELLENT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Average Star Rating (e.g. 4.8)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={testimonialsSettings.avg_rating || ''}
                  onChange={e => setTestimonialsSettings({...testimonialsSettings, avg_rating: Number(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="4.8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Displayed Total Review Count (e.g. 2154)</label>
                <input
                  type="text"
                  value={testimonialsSettings.review_count || ''}
                  onChange={e => setTestimonialsSettings({...testimonialsSettings, review_count: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="2,154"
                />
                <p className="text-xs text-gray-400 mt-1">This display value is manual and formatting (e.g. adding commas) is preserved exactly.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Name (e.g. Google)</label>
                <input
                  type="text"
                  value={testimonialsSettings.source_name || ''}
                  onChange={e => setTestimonialsSettings({...testimonialsSettings, source_name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Google"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Trust Summary'}
              </button>
            </form>
          </div>

          {/* Panel: Homepage Testimonial Slider Configuration */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Homepage Slider Configuration</h2>

            <form onSubmit={handleSaveTestimonialsSettings} className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="testimonials_is_active"
                  checked={testimonialsSettings.is_active !== false}
                  onChange={e => setTestimonialsSettings({...testimonialsSettings, is_active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="testimonials_is_active" className="ml-2 text-sm font-medium text-gray-900">Show Testimonials Carousel on Homepage</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carousel Section Heading</label>
                <input
                  type="text"
                  value={testimonialsSettings.heading || ''}
                  onChange={e => setTestimonialsSettings({...testimonialsSettings, heading: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Client testimonials"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carousel Subtext</label>
                <input
                  type="text"
                  value={testimonialsSettings.subtext || ''}
                  onChange={e => setTestimonialsSettings({...testimonialsSettings, subtext: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <input
                    type="color"
                    value={testimonialsSettings.bg_color || '#ffffff'}
                    onChange={e => setTestimonialsSettings({...testimonialsSettings, bg_color: e.target.value})}
                    className="w-full border rounded-lg h-9 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                  <input
                    type="color"
                    value={testimonialsSettings.text_color || '#1f2937'}
                    onChange={e => setTestimonialsSettings({...testimonialsSettings, text_color: e.target.value})}
                    className="w-full border rounded-lg h-9 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="enable_autoscroll"
                    checked={testimonialsSettings.enable_autoscroll !== false}
                    onChange={e => setTestimonialsSettings({...testimonialsSettings, enable_autoscroll: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="enable_autoscroll" className="ml-2 text-sm font-medium text-gray-900">Enable Autoscroll</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Autoscroll Speed (ms)</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={testimonialsSettings.autoplay_speed || 4000}
                    onChange={e => setTestimonialsSettings({...testimonialsSettings, autoplay_speed: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">See All Button Text</label>
                  <input
                    type="text"
                    value={testimonialsSettings.button_text || ''}
                    onChange={e => setTestimonialsSettings({...testimonialsSettings, button_text: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="See all testimonials"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">See All Link Route</label>
                  <input
                    type="text"
                    value={testimonialsSettings.see_all_link || ''}
                    onChange={e => setTestimonialsSettings({...testimonialsSettings, see_all_link: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="/reviews"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Slider Config'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-900/75" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative inline-block w-full max-w-2xl p-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl sm:my-8">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingReview ? 'Edit Review' : 'Add New Review'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                    <input type="text" required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                    <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.customer_email} onChange={e => setFormData({...formData, customer_email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                    <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Image URL</label>
                    <input type="url" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.customer_image_url} onChange={e => setFormData({...formData, customer_image_url: e.target.value})} placeholder="https://..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5) *</label>
                    <input type="number" min="1" max="5" required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
                    <input type="date" required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.review_date} onChange={e => setFormData({...formData, review_date: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source (e.g. Google)</label>
                    <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="Google" />
                  </div>
                  <div className="flex items-center pt-6">
                    <input type="checkbox" id="modal_verified" className="h-4 w-4 text-blue-600 rounded" checked={formData.verified} onChange={e => setFormData({...formData, verified: e.target.checked})} />
                    <label htmlFor="modal_verified" className="ml-2 block text-sm text-gray-900">Verified Review</label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Read More URL Link</label>
                  <input type="url" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.read_more_link} onChange={e => setFormData({...formData, read_more_link: e.target.value})} placeholder="https://maps.google.com/..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Text *</label>
                  <textarea required rows={4} className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.review_text} onChange={e => setFormData({...formData, review_text: e.target.value})} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link to Package</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.package_id || ''} onChange={handlePackageChange}>
                      <option value="">General Review (No Package)</option>
                      {packages.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Overwrite</label>
                    <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} placeholder="e.g. Manali" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                  <div className="flex items-center">
                    <input type="checkbox" id="is_approved" className="h-4 w-4 text-blue-600 rounded" checked={formData.is_approved} onChange={e => setFormData({...formData, is_approved: e.target.checked})} />
                    <label htmlFor="is_approved" className="ml-2 block text-sm text-gray-900">Approved (Public)</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="is_featured" className="h-4 w-4 text-blue-600 rounded" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />
                    <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">Featured (Homepage)</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input type="number" className="w-full border rounded-lg px-3 py-1 text-sm" value={formData.display_order} onChange={e => setFormData({...formData, display_order: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
