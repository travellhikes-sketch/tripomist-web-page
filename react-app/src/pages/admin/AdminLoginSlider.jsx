import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import MediaUploader from '../../components/admin/MediaUploader';
import { Plus, View, Edit2, Trash2, X } from 'lucide-react';

export default function AdminLoginSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('login_slider_items')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setSlides(data || []);
    } catch (e) {
      console.error(e);
      alert('Failed to fetch slides');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (slide = null) => {
    if (slide) {
      setEditingSlide(slide);
      setTitle(slide.title || '');
      setSubtitle(slide.subtitle || '');
      setImageUrl(slide.image_url || '');
      setIsActive(slide.is_active);
      setDisplayOrder(slide.display_order);
    } else {
      setEditingSlide(null);
      setTitle('');
      setSubtitle('');
      setImageUrl('');
      setIsActive(true);
      setDisplayOrder(slides.length);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlide(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      alert("Image URL is required.");
      return;
    }
    setSaving(true);
    const payload = { title, subtitle, image_url: imageUrl, is_active: isActive, display_order: displayOrder };

    try {
      if (editingSlide) {
        const { error } = await supabase
          .from('login_slider_items')
          .update(payload)
          .eq('id', editingSlide.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('login_slider_items')
          .insert([payload]);
        if (error) throw error;
      }
      closeModal();
      fetchSlides();
    } catch (e) {
      console.error(e);
      alert('Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    try {
      const { error } = await supabase.from('login_slider_items').delete().eq('id', id);
      if (error) throw error;
      fetchSlides();
    } catch (e) {
      console.error(e);
      alert('Failed to delete slide');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase.from('login_slider_items').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      fetchSlides();
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Login Slider</h1>
          <p className="text-sm text-gray-500 mt-1">Manage images for the login modal carousel.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-[#01AFD1] text-white px-4 py-2 rounded-lg hover:bg-[#0092b3] transition-colors shadow-sm font-semibold text-sm">
          <Plus size={16} /> Add Slide
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20"><div className="w-8 h-8 border-4 border-[#01AFD1] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : slides.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl shadow-sm text-center border border-gray-100">
          <View size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No slides found</h3>
          <p className="text-gray-500">Add some images to show in the login slider.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Title / Subtitle</th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slides.map(slide => (
                <tr key={slide.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <img src={slide.image_url} alt="Slide" className="w-24 h-16 object-cover rounded bg-gray-100" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{slide.title || '—'}</div>
                    <div className="text-gray-500 text-xs">{slide.subtitle || '—'}</div>
                  </td>
                  <td className="px-6 py-4 ">{slide.display_order}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(slide.id, slide.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${slide.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {slide.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openModal(slide)} className="p-1.5 text-[#01AFD1] hover:bg-[#01AFD1]/10 rounded-md border border-transparent hover:border-[#01AFD1]/30 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(slide.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900 text-lg">{editingSlide ? 'Edit Slide' : 'Add Slide'}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <MediaUploader
                    url={imageUrl}
                    onUrlChange={setImageUrl}
                    folder="login_slider"
                    label="Image URL *"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#01AFD1]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subtitle</label>
                  <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#01AFD1]" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Display Order</label>
                    <input type="number" value={displayOrder} onChange={e => setDisplayOrder(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#01AFD1]" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <label className="flex items-center gap-2 cursor-pointer mt-5">
                      <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-[#01AFD1]" />
                      <span className="text-sm font-semibold text-gray-700">Is Active</span>
                    </label>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-4">
                  <button type="button" onClick={closeModal} className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-[#01AFD1] rounded-lg hover:bg-[#0092b3] transition-colors disabled:opacity-70">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
