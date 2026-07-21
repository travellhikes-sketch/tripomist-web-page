import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Plus, Edit2, Trash2, Save, X, Search, RefreshCw, 
  ExternalLink, Link as LinkIcon, Monitor, Smartphone, 
  GripVertical, AlertCircle, CheckCircle2, Clock, Globe, Lock, User
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AdminMenuManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  
  const [formData, setFormData] = useState({
    label: '', item_type: 'link', route: '', external_url: '', parent_id: '',
    location: 'both', display_order: 0, is_active: true, show_on_desktop: true, show_on_mobile: true, open_in_new_tab: false, icon: '',
    badge_is_active: false, badge_text: '', badge_type: 'new',
    mega_menu_enabled: false, mega_menu_column: 1,
    visible_from: '', visible_until: '', visibility_role: 'everyone'
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('navigation_items')
        .select('*')
        .order('display_order', { ascending: true });
        
      if (fetchErr) throw fetchErr;
      setItems(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const showFeedback = (type, message) => {
    setSaveStatus({ type, message });
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        label: item.label,
        item_type: item.item_type,
        route: item.route || '',
        external_url: item.external_url || '',
        parent_id: item.parent_id || '',
        location: item.location,
        display_order: item.display_order,
        is_active: item.is_active,
        show_on_desktop: item.show_on_desktop,
        show_on_mobile: item.show_on_mobile,
        open_in_new_tab: item.open_in_new_tab,
        icon: item.icon || '',
        badge_is_active: item.badge_is_active || false,
        badge_text: item.badge_text || '',
        badge_type: item.badge_type || 'new',
        mega_menu_enabled: item.mega_menu_enabled || false,
        mega_menu_column: item.mega_menu_column || 1,
        visible_from: item.visible_from ? new Date(item.visible_from).toISOString().slice(0, 16) : '',
        visible_until: item.visible_until ? new Date(item.visible_until).toISOString().slice(0, 16) : '',
        visibility_role: item.visibility_role || 'everyone'
      });
    } else {
      setEditingItem(null);
      setFormData({
        label: '', item_type: 'link', route: '', external_url: '', parent_id: '',
        location: 'both', display_order: items.length > 0 ? Math.max(...items.map(i => i.display_order)) + 1 : 1,
        is_active: true, show_on_desktop: true, show_on_mobile: true, open_in_new_tab: false, icon: '',
        badge_is_active: false, badge_text: '', badge_type: 'new',
        mega_menu_enabled: false, mega_menu_column: 1,
        visible_from: '', visible_until: '', visibility_role: 'everyone'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    if (formData.visible_from && formData.visible_until && new Date(formData.visible_until) <= new Date(formData.visible_from)) {
      alert("Visible Until must be later than Visible From.");
      setSaving(false);
      return;
    }
    
    if (formData.item_type !== 'dropdown' && !formData.route && !formData.external_url) {
      alert("Links and buttons must have either an internal route or an external URL.");
      setSaving(false);
      return;
    }

    const payload = {
      ...formData,
      parent_id: formData.parent_id || null,
      route: formData.item_type === 'link' || formData.item_type === 'button' ? formData.route : null,
      external_url: formData.item_type === 'link' || formData.item_type === 'button' ? formData.external_url : null,
      visible_from: formData.visible_from ? new Date(formData.visible_from).toISOString() : null,
      visible_until: formData.visible_until ? new Date(formData.visible_until).toISOString() : null,
      mega_menu_enabled: formData.item_type === 'dropdown' ? formData.mega_menu_enabled : false
    };

    try {
      if (editingItem) {
        const { error: updateErr } = await supabase.from('navigation_items').update(payload).eq('id', editingItem.id);
        if (updateErr) throw updateErr;
        showFeedback('success', 'Menu item updated successfully.');
      } else {
        const { error: insertErr } = await supabase.from('navigation_items').insert([payload]);
        if (insertErr) throw insertErr;
        showFeedback('success', 'Menu item added successfully.');
      }
      await fetchItems();
      handleCloseModal();
    } catch (err) {
      showFeedback('error', `Error saving item: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item? Any child items will have their parent reset.')) return;
    try {
      const { error: deleteErr } = await supabase.from('navigation_items').delete().eq('id', id);
      if (deleteErr) throw deleteErr;
      fetchItems();
      showFeedback('success', 'Item deleted.');
    } catch (err) {
      showFeedback('error', `Error deleting item: ${err.message}`);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    let siblingItems = [];
    if (type === 'PARENT') {
      siblingItems = items.filter(i => !i.parent_id).sort((a, b) => a.display_order - b.display_order);
    } else {
      siblingItems = items.filter(i => i.parent_id === source.droppableId).sort((a, b) => a.display_order - b.display_order);
    }
    
    const newSiblingItems = Array.from(siblingItems);
    const [movedItem] = newSiblingItems.splice(source.index, 1);
    newSiblingItems.splice(destination.index, 0, movedItem);
    
    const updates = newSiblingItems.map((item, idx) => ({
      id: item.id,
      display_order: idx + 1
    }));
    
    const newItems = items.map(item => {
      const update = updates.find(u => u.id === item.id);
      return update ? { ...item, display_order: update.display_order } : item;
    });
    setItems(newItems);
    
    try {
      for (const update of updates) {
        await supabase.from('navigation_items').update({ display_order: update.display_order }).eq('id', update.id);
      }
      showFeedback('success', 'Display order updated.');
    } catch (err) {
      showFeedback('error', 'Error updating display order.');
      fetchItems();
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'all' || item.location === filterLocation || item.location === 'both';
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? item.is_active : !item.is_active);
    return matchesSearch && matchesLocation && matchesStatus;
  });

  const parentOptions = items.filter(i => i.item_type === 'dropdown' && (!editingItem || i.id !== editingItem.id));
  
  const topLevelFiltered = filteredItems.filter(i => !i.parent_id).sort((a,b) => a.display_order - b.display_order);
  const getChildrenFiltered = (parentId) => filteredItems.filter(i => i.parent_id === parentId).sort((a,b) => a.display_order - b.display_order);

  const isDragDisabled = searchTerm !== '' || filterLocation !== 'all' || filterStatus !== 'all';

  const renderStatus = (item) => {
    const now = new Date();
    const from = item.visible_from ? new Date(item.visible_from) : null;
    const until = item.visible_until ? new Date(item.visible_until) : null;
    
    if (!item.is_active) return <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs border border-red-200">Inactive</span>;
    if (until && now > until) return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">Expired</span>;
    if (from && now < from) return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs border border-amber-200">Scheduled</span>;
    return <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs border border-green-200">Active</span>;
  };

  const renderRoleIcon = (role) => {
    switch (role) {
      case 'guest': return <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"><User size={12}/> Guest</span>;
      case 'user': return <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100"><CheckCircle2 size={12}/> User</span>;
      case 'admin': return <span className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200"><Lock size={12}/> Admin</span>;
      default: return <span className="flex items-center gap-1 text-xs text-gray-500"><Globe size={12}/> Everyone</span>;
    }
  };

  const renderRow = (item, provided, isChild = false) => (
    <div 
      ref={provided.innerRef} 
      {...provided.draggableProps} 
      className={`grid grid-cols-12 gap-3 p-3 items-center text-sm border-b border-gray-100 transition-colors ${isChild ? 'bg-gray-50/50 pl-10' : 'bg-white hover:bg-slate-50'}`}
    >
      <div className="col-span-3 flex items-center gap-3 overflow-hidden">
        <div {...provided.dragHandleProps} className={`cursor-grab text-gray-400 hover:text-gray-600 ${isDragDisabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}>
          <GripVertical size={16} />
        </div>
        <div className="font-mono text-xs text-gray-400 w-4">{item.display_order}</div>
        <div className="flex items-center gap-2 truncate">
          {item.icon && <span className="material-symbols-outlined text-[16px] text-gray-500">{item.icon}</span>}
          <span className={`font-medium ${isChild ? 'text-gray-700' : 'text-gray-900'} truncate`} title={item.label}>{item.label}</span>
          {item.badge_is_active && item.badge_text && (
             <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">{item.badge_type}</span>
          )}
        </div>
      </div>
      
      <div className="col-span-1">
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${
          item.item_type === 'dropdown' ? 'bg-purple-100 text-purple-700' :
          item.item_type === 'button' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {item.item_type}
        </span>
      </div>

      <div className="col-span-2 flex flex-col gap-1 truncate text-xs">
        {item.item_type === 'dropdown' ? (
          <span className="text-gray-400 italic">Has children</span>
        ) : (
          <>
            {item.route && <span className="text-blue-600 flex items-center gap-1 truncate" title={item.route}><LinkIcon size={12} className="shrink-0"/> {item.route}</span>}
            {item.external_url && <span className="text-green-600 flex items-center gap-1 truncate" title={item.external_url}><ExternalLink size={12} className="shrink-0"/> {item.external_url}</span>}
            {!item.route && !item.external_url && <span className="text-gray-400">None</span>}
          </>
        )}
      </div>

      <div className="col-span-1">
        <span className="capitalize text-gray-600 text-xs">{item.location.replace('_', ' ')}</span>
      </div>

      <div className="col-span-1 flex items-center gap-1.5">
        {item.show_on_desktop ? <Monitor size={14} className="text-slate-700" title="Desktop" /> : <Monitor size={14} className="text-gray-200" />}
        {item.show_on_mobile ? <Smartphone size={14} className="text-slate-700" title="Mobile" /> : <Smartphone size={14} className="text-gray-200" />}
        {item.mega_menu_enabled && <span className="text-[10px] bg-slate-800 text-white px-1 rounded ml-1" title={`Mega Menu Col: ${item.mega_menu_column}`}>MM</span>}
      </div>

      <div className="col-span-2 flex flex-col items-start gap-1">
        {renderRoleIcon(item.visibility_role)}
        {(item.visible_from || item.visible_until) && (
          <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
            <Clock size={10}/> Scheduled
          </span>
        )}
      </div>

      <div className="col-span-1">
        {renderStatus(item)}
      </div>

      <div className="col-span-1 flex justify-end gap-1">
        <button onClick={() => handleOpenModal(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={14} /></button>
        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={14} /></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {saveStatus.message && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${saveStatus.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {saveStatus.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium text-sm">{saveStatus.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Manager</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage dynamic navigation, mega menus, badges, and scheduling.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 bg-white text-sm font-medium">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium shadow-sm">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by label..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 text-sm" />
          </div>
          <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="py-2 px-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-primary/50 text-sm">
            <option value="all">All Locations</option>
            <option value="navbar">Navbar</option>
            <option value="mobile_menu">Mobile Menu</option>
            <option value="footer">Footer</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="py-2 px-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-primary/50 text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {isDragDisabled && (
          <div className="px-4 py-2 bg-blue-50/50 text-blue-700 text-xs border-b border-blue-100 flex items-center gap-2">
            <AlertCircle size={14} /> Drag-and-drop sorting is disabled while filters are active.
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-12 gap-3 px-3 py-3 bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-3 pl-7">Label</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-2">Route / URL</div>
              <div className="col-span-1">Location</div>
              <div className="col-span-1">Device</div>
              <div className="col-span-2">Visibility</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            <div className="bg-white">
              {loading ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={24} /> Loading...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">No menu items found.</div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="root" type="PARENT" isDropDisabled={isDragDisabled}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {topLevelFiltered.map((parentItem, index) => (
                          <Draggable key={parentItem.id} draggableId={parentItem.id} index={index} isDragDisabled={isDragDisabled}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps}>
                                {renderRow(parentItem, provided, false)}
                                
                                <Droppable droppableId={parentItem.id} type="CHILD" isDropDisabled={isDragDisabled}>
                                  {(providedChild) => (
                                    <div ref={providedChild.innerRef} {...providedChild.droppableProps}>
                                      {getChildrenFiltered(parentItem.id).map((child, childIdx) => (
                                        <Draggable key={child.id} draggableId={child.id} index={childIdx} isDragDisabled={isDragDisabled}>
                                          {(providedChildDrag) => renderRow(child, providedChildDrag, true)}
                                        </Draggable>
                                      ))}
                                      {providedChild.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 flex flex-col relative overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="text-xl font-bold text-slate-900">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-1.5 rounded-full shadow-sm border border-gray-200 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-8">
              
              {/* Section 1: Basic Info */}
              <div className="bg-slate-50/50 p-5 rounded-xl border border-gray-100 space-y-5">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><Globe size={16}/> Core Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                    <input type="text" required value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                    <select value={formData.item_type} onChange={e => setFormData({...formData, item_type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none">
                      <option value="link">Standard Link</option>
                      <option value="dropdown">Dropdown Parent</option>
                      <option value="button">Button (Highlight)</option>
                    </select>
                  </div>
                  {formData.item_type !== 'dropdown' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Internal Route</label>
                        <input type="text" value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g. /about-us" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">External URL</label>
                        <input type="url" value={formData.external_url} onChange={e => setFormData({...formData, external_url: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" placeholder="https://..." />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none">
                      <option value="both">Navbar & Footer</option>
                      <option value="navbar">Navbar Only</option>
                      <option value="mobile_menu">Mobile Menu Only</option>
                      <option value="footer">Footer Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Dropdown</label>
                    <select value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" disabled={formData.item_type === 'dropdown'}>
                      <option value="">-- No Parent (Top Level) --</option>
                      {parentOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Visuals (Icon, Badge, Mega Menu) */}
              <div className="bg-slate-50/50 p-5 rounded-xl border border-gray-100 space-y-5">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><Monitor size={16}/> Visual Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Material Icon Name</label>
                      <input type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g. flight" />
                    </div>
                    {formData.icon && (
                      <div className="h-10 w-10 shrink-0 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-primary shadow-sm">
                        <span className="material-symbols-outlined">{formData.icon}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                </div>
                
                {formData.item_type === 'dropdown' && (
                  <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-lg mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.mega_menu_enabled} onChange={e => setFormData({...formData, mega_menu_enabled: e.target.checked})} className="w-4 h-4 text-primary rounded border-gray-300" />
                      <span className="text-sm font-bold text-purple-900">Enable Mega Menu (Desktop)</span>
                    </label>
                    {formData.mega_menu_enabled && (
                      <div>
                        <label className="block text-xs font-medium text-purple-800 mb-1">Mega Menu Columns</label>
                        <select value={formData.mega_menu_column} onChange={e => setFormData({...formData, mega_menu_column: parseInt(e.target.value)})} className="w-full border border-purple-200 rounded-md px-2 py-1 text-sm outline-none">
                          <option value={1}>1 Column</option>
                          <option value={2}>2 Columns</option>
                          <option value={3}>3 Columns</option>
                          <option value={4}>4 Columns</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.badge_is_active} onChange={e => setFormData({...formData, badge_is_active: e.target.checked})} className="w-4 h-4 text-primary rounded border-gray-300" />
                      <span className="text-sm font-bold text-blue-900">Enable Badge</span>
                    </label>
                  </div>
                  {formData.badge_is_active && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-blue-800 mb-1">Badge Text</label>
                        <input type="text" value={formData.badge_text} onChange={e => setFormData({...formData, badge_text: e.target.value})} maxLength={15} className="w-full border border-blue-200 rounded-md px-2 py-1 text-sm outline-none" placeholder="e.g. 50% OFF" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-800 mb-1">Badge Style</label>
                        <select value={formData.badge_type} onChange={e => setFormData({...formData, badge_type: e.target.value})} className="w-full border border-blue-200 rounded-md px-2 py-1 text-sm outline-none">
                          <option value="new">New (Green)</option>
                          <option value="hot">Hot (Red)</option>
                          <option value="sale">Sale (Orange)</option>
                          <option value="featured">Featured (Purple)</option>
                          <option value="custom">Custom (Theme Primary)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 3: Visibility Rules */}
              <div className="bg-slate-50/50 p-5 rounded-xl border border-gray-100 space-y-5">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><Lock size={16}/> Visibility & Rules</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-b border-gray-200 pb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Visibility</label>
                    <select value={formData.visibility_role} onChange={e => setFormData({...formData, visibility_role: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none font-medium">
                      <option value="everyone">🌐 Everyone (Public)</option>
                      <option value="guest">👤 Guest (Not Logged In)</option>
                      <option value="user">👥 User (Logged In)</option>
                      <option value="admin">🔒 Admin Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visible From</label>
                    <input type="datetime-local" value={formData.visible_from} onChange={e => setFormData({...formData, visible_from: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visible Until</label>
                    <input type="datetime-local" value={formData.visible_until} onChange={e => setFormData({...formData, visible_until: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors bg-gray-50/50">
                    <input type="checkbox" checked={formData.show_on_desktop} onChange={e => setFormData({...formData, show_on_desktop: e.target.checked})} className="w-4 h-4 text-primary rounded border-gray-300" />
                    <span className="text-sm text-gray-700 font-medium">Desktop</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors bg-gray-50/50">
                    <input type="checkbox" checked={formData.show_on_mobile} onChange={e => setFormData({...formData, show_on_mobile: e.target.checked})} className="w-4 h-4 text-primary rounded border-gray-300" />
                    <span className="text-sm text-gray-700 font-medium">Mobile</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors bg-gray-50/50">
                    <input type="checkbox" checked={formData.open_in_new_tab} onChange={e => setFormData({...formData, open_in_new_tab: e.target.checked})} className="w-4 h-4 text-primary rounded border-gray-300" />
                    <span className="text-sm text-gray-700 font-medium">New Tab</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-green-200 bg-green-50/50 rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-green-600 rounded border-green-300" />
                    <span className="text-sm text-green-800 font-bold">Active</span>
                  </label>
                </div>
              </div>

            </form>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white sticky bottom-0">
              <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              <button type="submit" onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm disabled:opacity-70 shadow-sm">
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {editingItem ? 'Update Menu Item' : 'Add Menu Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenuManager;
