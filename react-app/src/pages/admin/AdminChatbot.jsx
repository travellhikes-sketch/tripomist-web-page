import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Save,
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  BookOpen
} from 'lucide-react';

const AdminChatbot = () => {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'knowledge'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Settings State
  const [settings, setSettings] = useState({
    bot_name: 'TripoMist Assistant',
    system_prompt: '',
    welcome_message: '',
    is_active: true
  });
  const [settingsId, setSettingsId] = useState(null);

  // Knowledge State
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [isEditingKnowledge, setIsEditingKnowledge] = useState(false);
  const [currentKnowledge, setCurrentKnowledge] = useState(null);

  const initialKnowledgeState = {
    title: '',
    category: '',
    content: '',
    priority: 0,
    is_active: true
  };
  const [knowledgeForm, setKnowledgeForm] = useState(initialKnowledgeState);

  useEffect(() => {
    fetchSettings();
    if (activeTab === 'knowledge') {
      fetchKnowledge();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('chatbot_settings')
        .select('*')
        .eq('singleton_key', true)
        .single();

      if (err && err.code !== 'PGRST116') {
        throw err;
      }

      if (data) {
        setSettings({
          bot_name: data.bot_name,
          system_prompt: data.system_prompt,
          welcome_message: data.welcome_message,
          is_active: data.is_active
        });
        setSettingsId(data.id);
      }
    } catch (err) {
      setError('Failed to load settings. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('chatbot_knowledge')
        .select('*')
        .order('priority', { ascending: false })
        .order('updated_at', { ascending: false });

      if (err) throw err;
      setKnowledgeList(data || []);
    } catch (err) {
      setError('Failed to load knowledge base.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (settingsId) {
        const { error: err } = await supabase
          .from('chatbot_settings')
          .update({
            ...settings,
            updated_by: user.id
          })
          .eq('id', settingsId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('chatbot_settings')
          .insert([{
            ...settings,
            singleton_key: true,
            updated_by: user.id
          }]);
        if (err) throw err;
        await fetchSettings();
      }
      showSuccess('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleKnowledgeInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setKnowledgeForm({
      ...knowledgeForm,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    });
  };

  const handleEditKnowledge = (item) => {
    setCurrentKnowledge(item);
    setKnowledgeForm({
      title: item.title,
      category: item.category || '',
      content: item.content,
      priority: item.priority,
      is_active: item.is_active
    });
    setIsEditingKnowledge(true);
    setError(null);
  };

  const handleCancelKnowledge = () => {
    setIsEditingKnowledge(false);
    setCurrentKnowledge(null);
    setKnowledgeForm(initialKnowledgeState);
    setError(null);
  };

  const handleSaveKnowledge = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
        throw new Error('Title and Content are required.');
      }

      if (currentKnowledge) {
        const { error: err } = await supabase
          .from('chatbot_knowledge')
          .update({
            ...knowledgeForm,
            updated_by: user.id
          })
          .eq('id', currentKnowledge.id);
        if (err) throw err;
        showSuccess('Knowledge entry updated!');
      } else {
        const { error: err } = await supabase
          .from('chatbot_knowledge')
          .insert([{
            ...knowledgeForm,
            created_by: user.id,
            updated_by: user.id
          }]);
        if (err) throw err;
        showSuccess('Knowledge entry created!');
      }
      fetchKnowledge();
      handleCancelKnowledge();
    } catch (err) {
      setError(err.message || 'Failed to save knowledge entry.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKnowledge = async (id) => {
    if (!window.confirm('Delete this knowledge entry?')) return;

    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('chatbot_knowledge')
        .delete()
        .eq('id', id);
      if (err) throw err;

      showSuccess('Entry deleted successfully.');
      fetchKnowledge();
    } catch (err) {
      setError('Failed to delete entry.');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">AI Chatbot</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 text-rose-600 p-4 rounded-lg flex items-center gap-2 border border-rose-100">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-50 text-emerald-600 p-4 rounded-lg flex items-center gap-2 border border-emerald-100">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-max mb-6">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'settings'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare size={16} />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'knowledge'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen size={16} />
            Knowledge Base
          </button>
        </div>

        {activeTab === 'settings' ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b border-gray-200 pb-2">Chatbot Configuration</h2>

              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bot Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-sm outline-none transition-shadow bg-gray-50"
                      value={settings.bot_name}
                      onChange={(e) => setSettings({...settings, bot_name: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Main Prompt</label>
                    <p className="text-xs text-gray-500 mb-2">Instructions determining how the AI behaves and responds to users.</p>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-sm outline-none transition-shadow "
                      rows={8}
                      value={settings.system_prompt}
                      onChange={(e) => setSettings({...settings, system_prompt: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Welcome Message</label>
                    <p className="text-xs text-gray-500 mb-2">The first message shown to users when they open the chat.</p>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-sm outline-none transition-shadow"
                      rows={3}
                      value={settings.welcome_message}
                      onChange={(e) => setSettings({...settings, welcome_message: e.target.value})}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-gray-100">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Chatbot Active</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Enable or disable the chatbot globally on the website.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.is_active}
                        onChange={(e) => setSettings({...settings, is_active: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex justify-start">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-[#01AFD1] text-white px-5 py-2 rounded-md hover:bg-[#0092b3] transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-2 flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Knowledge Base</h2>
              <button
                onClick={() => {
                  setKnowledgeForm(initialKnowledgeState);
                  setCurrentKnowledge(null);
                  setIsEditingKnowledge(true);
                  setError(null);
                }}
                className="flex items-center gap-2 bg-[#01AFD1] text-white px-4 py-2 rounded-md hover:bg-[#0092b3] transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add Knowledge
              </button>
            </div>

            <div>
              {loading && !isEditingKnowledge ? (
                 <div className="flex justify-center p-8">
                   <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                 </div>
              ) : isEditingKnowledge ? (
                <div className="bg-slate-50 border border-gray-200 rounded-lg p-6 max-w-3xl">
                  <h3 className="text-md font-semibold text-slate-800 mb-4">{currentKnowledge ? 'Edit Knowledge' : 'Add New Knowledge'}</h3>
                  <form onSubmit={handleSaveKnowledge} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                        <input
                          type="text"
                          name="title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-sm"
                          value={knowledgeForm.title}
                          onChange={handleKnowledgeInputChange}
                          required
                          placeholder="e.g. Booking Process"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                        <input
                          type="text"
                          name="category"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-sm"
                          value={knowledgeForm.category}
                          onChange={handleKnowledgeInputChange}
                          placeholder="e.g. General"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content *</label>
                      <textarea
                        name="content"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-sm h-32"
                        value={knowledgeForm.content}
                        onChange={handleKnowledgeInputChange}
                        required
                        placeholder="Detailed information for the AI to use..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                        <input
                          type="number"
                          name="priority"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-sm"
                          value={knowledgeForm.priority}
                          onChange={handleKnowledgeInputChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">Higher numbers take precedence.</p>
                      </div>
                      <div className="flex items-center h-full pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_active"
                            className="w-4 h-4 text-slate-900 rounded border-gray-300 focus:ring-slate-900"
                            checked={knowledgeForm.is_active}
                            onChange={handleKnowledgeInputChange}
                          />
                          <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-start pt-4 border-t border-gray-200 mt-6">
                      <button
                        type="button"
                        onClick={handleCancelKnowledge}
                        className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#01AFD1] rounded-md hover:bg-[#0092b3] disabled:opacity-50"
                      >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Knowledge'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : knowledgeList.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-sm font-medium text-gray-900">No knowledge entries</h3>
                  <p className="mt-1 text-sm text-gray-500">Add content to help the AI answer user questions.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {knowledgeList.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow bg-white flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-800">{item.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 text-xs text-gray-500 mb-3 font-medium">
                        {item.category && <span>Cat: {item.category}</span>}
                        <span>Priority: {item.priority}</span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1 whitespace-pre-wrap">
                        {item.content}
                      </p>

                      <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEditKnowledge(item)}
                          className="p-1.5 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteKnowledge(item.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatbot;


