import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

const CustomerSupport = () => {
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('settings')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching site settings:', error);
        } else if (data) {
          setSiteSettings(data.settings?.customer_support);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-4 max-w-4xl mx-auto p-4 md:p-8">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded-2xl w-full"></div>
        <div className="h-20 bg-gray-100 rounded-2xl w-full"></div>
        <div className="h-20 bg-gray-100 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-1">We're here to help make your journey smooth and memorable.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-0 divide-y divide-gray-100">
          {siteSettings?.whatsapp?.enabled && (
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#01AFD1] text-xl">chat</span>
                  {siteSettings.whatsapp.title || 'WhatsApp'}
                </h4>
                {siteSettings.whatsapp.value && <p className="text-sm text-gray-800 font-medium mt-1">{siteSettings.whatsapp.value}</p>}
                {siteSettings.whatsapp.description && <p className="text-xs text-gray-500 mt-1">{siteSettings.whatsapp.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {siteSettings.whatsapp.value && (
                  <button onClick={() => navigator.clipboard.writeText(siteSettings.whatsapp.value)} className="text-sm text-[#01AFD1] font-bold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">Copy</button>
                )}
                {siteSettings.whatsapp.value && (
                  <a href={`https://wa.me/${siteSettings.whatsapp.value.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noreferrer" className="text-sm text-white font-bold bg-[#25D366] px-4 py-2 rounded-lg hover:bg-[#1ebd5b] transition-colors">Message</a>
                )}
              </div>
            </div>
          )}

          {siteSettings?.call?.enabled && (
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#01AFD1] text-xl">call</span>
                  {siteSettings.call.title || 'Call Us'}
                </h4>
                {siteSettings.call.value && <p className="text-sm text-gray-800 font-medium mt-1">{siteSettings.call.value}</p>}
                {siteSettings.call.description && <p className="text-xs text-gray-500 mt-1">{siteSettings.call.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {siteSettings.call.value && (
                  <>
                    <button onClick={() => navigator.clipboard.writeText(siteSettings.call.value)} className="text-sm text-gray-600 font-bold bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">Copy</button>
                    <a href={`tel:${siteSettings.call.value}`} className="text-sm text-white font-bold bg-[#01AFD1] px-4 py-2 rounded-lg hover:bg-[#0092b3] transition-colors">Call</a>
                  </>
                )}
              </div>
            </div>
          )}

          {siteSettings?.email?.enabled && (
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#01AFD1] text-xl">mail</span>
                  {siteSettings.email.title || 'Email'}
                </h4>
                {siteSettings.email.value && <p className="text-sm text-gray-800 font-medium mt-1">{siteSettings.email.value}</p>}
                {siteSettings.email.description && <p className="text-xs text-gray-500 mt-1">{siteSettings.email.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {siteSettings.email.value && (
                  <>
                    <button onClick={() => navigator.clipboard.writeText(siteSettings.email.value)} className="text-sm text-gray-600 font-bold bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">Copy</button>
                    <a href={`mailto:${siteSettings.email.value}`} className="text-sm text-[#01AFD1] font-bold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">Email Us</a>
                  </>
                )}
              </div>
            </div>
          )}

          {siteSettings?.live_chat?.enabled && (
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#01AFD1] text-xl">support_agent</span>
                  {siteSettings.live_chat.title || 'Live Chat'}
                </h4>
                {siteSettings.live_chat.description && <p className="text-xs text-gray-500 mt-1">{siteSettings.live_chat.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('tripomist:open-chatbot'))}
                  className="text-sm text-white font-bold bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Start Chat
                </button>
              </div>
            </div>
          )}

          {(!siteSettings || (!siteSettings.whatsapp?.enabled && !siteSettings.call?.enabled && !siteSettings.email?.enabled && !siteSettings.live_chat?.enabled)) && (
             <div className="py-8 text-center text-gray-500">
               Support contact methods are currently not configured. Please check back later.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;
