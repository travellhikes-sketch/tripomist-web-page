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

const AdminHomepageSections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  const initialFormState = {
    section_key: '',
    title: '',
    subtitle: '',
    icon: '',
    view_all_text: 'View All',
    view_all_route: '',
    display_order: 0,
    max_cards: 10,
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
        .from('homepage_sections')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setSections(data || []);
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
          .from('homepage_sections')
          .update(formData)
          .eq('id', currentItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('homepage_sections')
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
    if (!confirm('Are you sure you want to delete this section settings?')) return;
    try {
      const { error } = await supabase
        .from('homepage_sections')
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
        .from('homepage_sections')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      setSections(sections.map(d => d.id === id ? { ...d, is_active: !currentStatus } : d));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Sections Settings</h1>
          <p className="text-gray-500 mt-1">Manage titles, visibility, and limits for homepage package sections.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
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

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-bold">{currentItem ? 'Edit Section' : 'New Section'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Key</label>
              <input type="text" name="section_key" value={formData.section_key || ''} onChange={handleInputChange} className="w-full p-2 border rounded" required placeholder="e.g. best_seller" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" name="title" value={formData.title || ''} onChange={handleInputChange} className="w-full p-2 border rounded" required placeholder="e.g. Best Seller" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input type="text" name="subtitle" value={formData.subtitle || ''} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="e.g. Top Choice" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Icon</label>
              <input type="text" name="icon" value={formData.icon || ''} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="e.g. award_star" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View All Text</label>
              <input type="text" name="view_all_text" value={formData.view_all_text || ''} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="e.g. View All" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View All Route</label>
              <input type="text" name="view_all_route" value={formData.view_all_route || ''} onChange={handleInputChange} className="w-full p-2 border rounded" placeholder="e.g. /trips/best-seller" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input type="number" name="display_order" value={formData.display_order} onChange={handleInputChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Cards Shown</label>
              <input type="number" name="max_cards" value={formData.max_cards} onChange={handleInputChange} className="w-full p-2 border rounded" />
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 mr-2" />
              <label className="text-sm font-medium text-gray-700">Section is Active</label>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button type="submit" className="bg-[#136b8a] text-white px-6 py-2 rounded-lg hover:bg-[#0f556e]">Save Section</button>
            <button type="button" onClick={handleCancel} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      ) : loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a]"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono uppercase">{item.section_key}</span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {item.is_active ? 'ACTIVE' : 'HIDDEN'}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                {item.subtitle && <p className="text-sm text-gray-500 mt-1">Subtitle: {item.subtitle}</p>}
                
                <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                  <p className="text-xs text-gray-600"><strong>View All:</strong> {item.view_all_text}</p>
                  <p className="text-xs text-gray-600"><strong>Route:</strong> {item.view_all_route || 'None'}</p>
                  <p className="text-xs text-gray-600"><strong>Max Cards:</strong> {item.max_cards}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center w-full mt-4 pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400 font-mono">Order: {item.display_order}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleActive(item.id, item.is_active)} className={`p-1.5 rounded-lg border ${item.is_active ? 'text-amber-600 hover:bg-amber-50 border-amber-100' : 'text-emerald-600 hover:bg-emerald-50 border-emerald-100'}`} title="Toggle Visibility">
                    {item.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>
                  <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100" title="Edit">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100" title="Delete">
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

export default AdminHomepageSections;
