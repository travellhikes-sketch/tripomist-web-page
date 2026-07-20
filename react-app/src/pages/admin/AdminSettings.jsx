import React, { useState } from 'react';
import { 
  Building, 
  CreditCard, 
  Mail, 
  Share2, 
  Save, 
  ShieldCheck 
} from 'lucide-react';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Settings state (safe public configuration only)
  const [company, setCompany] = useState({
    name: 'TripoMist',
    email: 'info@tripomist.com',
    phone: '+91 85265 49512',
    address: 'Mumbai, Maharashtra, India',
    gstin: '27AAAAA0000A1Z5'
  });

  const [payment, setPayment] = useState({
    razorpayKey: 'rzp_live_vP1g9LNFvvp',
    currency: 'INR',
    testMode: false
  });

  const [website, setWebsite] = useState({
    maintenanceMode: false,
    showPopups: true
  });

  const [social, setSocial] = useState({
    facebook: 'https://facebook.com/tripomist',
    instagram: 'https://instagram.com/tripomist',
    whatsapp: '918526549512',
    twitter: 'https://twitter.com/tripomist'
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12 flex flex-col h-full text-sm">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1 text-xs">Configure global application variables and configurations.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-4 h-full">
        <div className="w-full md:w-56 bg-white p-2 rounded-xl border border-gray-200 shadow-sm h-fit space-y-0.5">
          {[
            { key: 'company', label: 'Company Info', icon: Building },
            { key: 'payment', label: 'Payment Gateway', icon: CreditCard },
            { key: 'social', label: 'Social & Chat', icon: Share2 },
            { key: 'website', label: 'Website Config', icon: Mail }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-[#136b8a] text-white'
                    : 'text-gray-600 hover:bg-slate-50 hover:text-gray-950'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border border-gray-200 min-h-[400px]">
          <form onSubmit={handleSave} className="space-y-4 flex flex-col h-full">
            
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold mb-2">
                <ShieldCheck size={16} />
                Settings saved successfully!
              </div>
            )}

            <div className="flex-1">
              {/* Company Info */}
              {activeTab === 'company' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Company details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Company Name</label>
                      <input 
                        type="text" 
                        value={company.name}
                        onChange={e => setCompany({...company, name: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Contact Email</label>
                      <input 
                        type="email" 
                        value={company.email}
                        onChange={e => setCompany({...company, email: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Contact Phone</label>
                      <input 
                        type="text" 
                        value={company.phone}
                        onChange={e => setCompany({...company, phone: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">GSTIN</label>
                      <input 
                        type="text" 
                        value={company.gstin}
                        onChange={e => setCompany({...company, gstin: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Address</label>
                    <textarea 
                      value={company.address}
                      onChange={e => setCompany({...company, address: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Payment Gateway */}
              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Razorpay settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Public Key ID</label>
                      <input 
                        type="text" 
                        value={payment.razorpayKey}
                        onChange={e => setPayment({...payment, razorpayKey: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Currency</label>
                      <input 
                        type="text" 
                        value={payment.currency}
                        onChange={e => setPayment({...payment, currency: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Enable Test Mode</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Use Razorpay Sandbox environment for testing.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={payment.testMode}
                      onChange={e => setPayment({...payment, testMode: e.target.checked})}
                      className="w-4 h-4 accent-[#136b8a]"
                    />
                  </div>
                </div>
              )}

              {/* Social & Chat */}
              {activeTab === 'social' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Social links</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Instagram URL</label>
                      <input 
                        type="url" 
                        value={social.instagram}
                        onChange={e => setSocial({...social, instagram: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">WhatsApp Number</label>
                      <input 
                        type="text" 
                        value={social.whatsapp}
                        onChange={e => setSocial({...social, whatsapp: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Facebook URL</label>
                      <input 
                        type="url" 
                        value={social.facebook}
                        onChange={e => setSocial({...social, facebook: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Twitter URL</label>
                      <input 
                        type="url" 
                        value={social.twitter}
                        onChange={e => setSocial({...social, twitter: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#136b8a] text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Website Config */}
              {activeTab === 'website' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Website configuration</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Maintenance Mode</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Show a maintenance page to visitors (admins can still access dashboard).</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={website.maintenanceMode}
                        onChange={e => setWebsite({...website, maintenanceMode: e.target.checked})}
                        className="w-4 h-4 accent-[#136b8a]"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Enable Promo Popups</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Show special offer popups to new visitors.</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={website.showPopups}
                        onChange={e => setWebsite({...website, showPopups: e.target.checked})}
                        className="w-4 h-4 accent-[#136b8a]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100 flex justify-end mt-4">
              <button 
                type="submit"
                disabled={saving}
                className="bg-[#136b8a] hover:bg-[#0f556e] text-white px-5 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
