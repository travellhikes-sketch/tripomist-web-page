import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Edit3, 
  Trash2, 
  Plus, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const AdminInterests = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  const initialFormState = {
    name: '',
    slug: '',
    image_url: '',
    route: '',
    display_order: 0,
    is_active: true
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interest_categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setInterests(data || []);
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

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData(item);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentItem) {
        const { error } = await supabase
          .from('interest_categories')
          .update(formData)
          .eq('id', currentItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('interest_categories')
          .insert([formData]);
        if (error) throw error;
      }
      fetchData();
      handleCancel();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this interest category?')) return;
    try {
      const { error } = await supabase
        .from('interest_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('interest_categories')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      setInterests(interests.map(d => d.id === id ? { ...d, is_active: !currentStatus } : d));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interest Categories</h1>
          <p className="text-gray-500 mt-1">Manage the 'Destination According To Interest' cards.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-[#136b8a] text-white px-4 py-2 rounded-xl hover:bg-[#0f556e] transition-colors shadow-sm font-medium"
          >
            <Plus size={18} />
            Add Interest
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
          <h2 className="text-lg font-bold">{currentItem ? 'Edit Interest' : 'New Interest'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full p-2 border rounded" required placeholder="e.g. Only Trek" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Category filter)</label>
              <input type="text" name="slug" value={formData.slug || ''} onChange={handleInputChange} className="w-full p-2 border rounded" required placeholder="e.g. trek" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route (URL)</label>
              <input type="text" name="route" value={formData.route || ''} onChange={handleInputChange} className="w-full p-2 border rounded" required placeholder="e.g. /trips/trek" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input type="url" name="image_url" value={formData.image_url || ''} onChange={handleInputChange} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input type="number" name="display_order" value={formData.display_order} onChange={handleInputChange} className="w-full p-2 border rounded" />
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 mr-2" />
              <label className="text-sm font-medium text-gray-700">Active</label>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button type="submit" className="bg-[#136b8a] text-white px-6 py-2 rounded-lg hover:bg-[#0f556e]">Save Interest</button>
            <button type="button" onClick={handleCancel} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      ) : loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a]"></div></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {interests.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-gray-100">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{item.name}</h3>
              <p className="text-[10px] text-gray-500 mb-3 font-mono">{item.route}</p>
              
              <div className="flex justify-between items-center w-full mt-auto pt-3 border-t border-gray-50">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {item.is_active ? 'ON' : 'OFF'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete">
                    <Trash2 size={14} />
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

export default AdminInterests;
