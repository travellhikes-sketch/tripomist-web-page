import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Edit2, Trash2, X, Check, ArrowUp, ArrowDown } from 'lucide-react';
import MediaUploader from '../../components/admin/MediaUploader';

export default function AdminExploreDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [route, setRoute] = useState('');
  const [parentId, setParentId] = useState('');
  const [heroBannerUrl, setHeroBannerUrl] = useState('');
  const [heroMediaType, setHeroMediaType] = useState('image');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [allowPackagePlacement, setAllowPackagePlacement] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('explore_departments')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      alert('Failed to fetch explore departments');
      console.error(error);
    } else {
      setDepartments(data || []);
    }
    setLoading(false);
  };

  const openModal = (dept = null) => {
    if (dept) {
      setEditingId(dept.id);
      setTitle(dept.title);
      setSubtitle(dept.subtitle || '');
      setSlug(dept.slug);
      setIcon(dept.icon || '');
      setRoute(dept.route || '');
      setParentId(dept.parent_id || '');
      setHeroBannerUrl(dept.hero_banner_url || '');
      setHeroMediaType(dept.hero_media_type || 'image');
      setDescription(dept.description || '');
      setIsActive(dept.is_active);
      setAllowPackagePlacement(dept.allow_package_placement);
      setDisplayOrder(dept.display_order);
    } else {
      setEditingId(null);
      setTitle('');
      setSubtitle('');
      setSlug('');
      setIcon('');
      setRoute('');
      setParentId('');
      setHeroBannerUrl('');
      setHeroMediaType('image');
      setDescription('');
      setIsActive(true);
      setAllowPackagePlacement(true);
      setDisplayOrder(departments.length + 1);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (!editingId) {
      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  // Upload is handled by MediaUploader

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !slug) {
      alert('Title and Slug are required');
      return;
    }

    const payload = {
      title,
      subtitle: subtitle || null,
      slug,
      icon: icon || null,
      route: route || null,
      parent_id: parentId || null,
      hero_banner_url: heroBannerUrl || null,
      hero_media_type: heroMediaType,
      description: description || null,
      is_active: isActive,
      allow_package_placement: allowPackagePlacement,
      display_order: parseInt(displayOrder) || 0
    };

    if (editingId) {
      const { error } = await supabase.from('explore_departments').update(payload).eq('id', editingId);
      if (error) {
        alert('Failed to update department');
      } else {
        alert('Department updated successfully');
        closeModal();
        fetchDepartments();
      }
    } else {
      const { error } = await supabase.from('explore_departments').insert(payload);
      if (error) {
        alert('Failed to create department');
      } else {
        alert('Department created successfully');
        closeModal();
        fetchDepartments();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    // Check if it's a parent of others
    const children = departments.filter(d => d.parent_id === id);
    if (children.length > 0) {
      alert('Cannot delete because it has child items. Remove children first.');
      return;
    }

    const { error } = await supabase.from('explore_departments').delete().eq('id', id);
    if (error) {
      alert('Failed to delete item');
    } else {
      alert('Item deleted successfully');
      fetchDepartments();
    }
  };

  const moveOrder = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === departments.length - 1) return;

    const newDepts = [...departments];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap display_orders
    const currentOrder = newDepts[index].display_order;
    const targetOrder = newDepts[targetIndex].display_order;

    newDepts[index].display_order = targetOrder;
    newDepts[targetIndex].display_order = currentOrder;

    // Sort to update UI immediately
    newDepts.sort((a, b) => a.display_order - b.display_order);
    setDepartments(newDepts);

    // Save to DB
    await Promise.all([
      supabase.from('explore_departments').update({ display_order: targetOrder }).eq('id', newDepts[targetIndex].id),
      supabase.from('explore_departments').update({ display_order: currentOrder }).eq('id', newDepts[index].id)
    ]);
  };

  const topLevel = departments.filter(d => !d.parent_id);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Explore Departments...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Explore Navigation</h1>
          <p className="text-gray-600 text-sm mt-1">Manage the dynamic navigation bar below the main search</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <Plus size={18} /> Add New Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-semibold w-16 text-center">Order</th>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-center">Packages?</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">No navigation items found. Create one above.</td>
              </tr>
            ) : (
              departments.map((dept, index) => (
                <tr key={dept.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col items-center">
                      <button onClick={() => moveOrder(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><ArrowUp size={16} /></button>
                      <span className="text-xs font-medium my-1 text-gray-500">{dept.display_order}</span>
                      <button onClick={() => moveOrder(index, 'down')} disabled={index === departments.length - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><ArrowDown size={16} /></button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {dept.icon && <span className="material-symbols-outlined text-gray-400 text-lg">{dept.icon}</span>}
                      <div>
                        <div className="font-medium text-gray-900">{dept.parent_id ? '— ' + dept.title : dept.title}</div>
                        <div className="text-xs text-gray-500">{dept.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {dept.parent_id ? 'Child Menu' : 'Top Level'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${dept.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {dept.allow_package_placement ? (
                      <Check size={16} className="text-green-500 mx-auto" />
                    ) : (
                      <X size={16} className="text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(dept)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(dept.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" value={title} onChange={handleTitleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Sales Offers" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input type="text" value={subtitle} onChange={e=>setSubtitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Limited Time Only" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input type="text" value={slug} onChange={e=>setSlug(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="sales-offers" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material Icon (optional)</label>
                  <input type="text" value={icon} onChange={e=>setIcon(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="local_offer" />
                  <p className="text-xs text-gray-500 mt-1">Google Material Symbols name</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Route (optional)</label>
                  <input type="text" value={route} onChange={e=>setRoute(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="/explore/sales-offers" />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to use /explore/slug</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Menu (for dropdowns)</label>
                <select value={parentId} onChange={e=>setParentId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                  <option value="">None (Top Level)</option>
                  {topLevel.filter(d => d.id !== editingId).map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <MediaUploader
                url={heroBannerUrl}
                onUrlChange={setHeroBannerUrl}
                folder="departments"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About / Description</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Text for the About section on the dynamic page..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 flex items-center justify-center rounded border transition-colors ${isActive ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                    {isActive && <Check size={14} className="text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={isActive} onChange={e=>setIsActive(e.target.checked)} />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Show in Navigation</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 flex items-center justify-center rounded border transition-colors ${allowPackagePlacement ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                    {allowPackagePlacement && <Check size={14} className="text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={allowPackagePlacement} onChange={e=>setAllowPackagePlacement(e.target.checked)} />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Allow Package Placement</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                  <Check size={18} /> {editingId ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
