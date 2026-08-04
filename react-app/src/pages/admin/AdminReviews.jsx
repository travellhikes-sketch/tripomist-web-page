import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Plus, Edit2, Trash2, Search, Filter, 
  CheckCircle, XCircle, Star, Image as ImageIcon, 
  ChevronDown, ChevronUp, Save, X
} from 'lucide-react';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterApproved, setFilterApproved] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modal State
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
    display_order: 0
  });

  useEffect(() => {
    fetchReviews();
    fetchPackages();
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
        display_order: review.display_order || 0
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
        display_order: 0
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

  // Filtering and Sorting
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
          <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer reviews and testimonials.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Add Review
        </button>
      </div>

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

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

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
