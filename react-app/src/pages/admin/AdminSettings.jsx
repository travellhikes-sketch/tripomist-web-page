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

  const [email, setEmail] = useState({
    sendAlerts: true,
    weeklyDigest: false
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure global application variables and configurations.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm h-fit space-y-1">
          {[
            { key: 'company', label: 'Company Info', icon: Building },
            { key: 'payment', label: 'Payment Gateway', icon: CreditCard },
            { key: 'email', label: 'Email Systems', icon: Mail },
            { key: 'social', label: 'Social & Chat', icon: Share2 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-[#136b8a] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-slate-50 hover:text-gray-950'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <form onSubmit={handleSave} className="space-y-6">
            
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck size={18} />
                Settings saved successfully!
              </div>
            )}

            {/* Company Info */}
            {activeTab === 'company' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Company details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Company Name</label>
                    <input 
                      type="text" 
                      value={company.name}
                      onChange={e => setCompany({...company, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Contact Email</label>
                    <input 
                      type="email" 
                      value={company.email}
                      onChange={e => setCompany({...company, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Contact Phone</label>
                    <input 
                      type="text" 
                      value={company.phone}
                      onChange={e => setCompany({...company, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">GSTIN</label>
                    <input 
                      type="text" 
                      value={company.gstin}
                      onChange={e => setCompany({...company, gstin: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Address</label>
                  <textarea 
                    value={company.address}
                    onChange={e => setCompany({...company, address: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]"
                  />
                </div>
              </div>
            )}

            {/* Payment Gateway */}
            {activeTab === 'payment' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Razorpay settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Key ID</label>
                    <input 
                      type="text" 
                      value={payment.razorpayKey}
                      onChange={e => setPayment({...payment, razorpayKey: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Currency</label>
                    <input 
                      type="text" 
                      value={payment.currency}
                      onChange={e => setPayment({...payment, currency: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a] font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Enable Sandbox / Test Mode</h4>
                    <p className="text-xs text-gray-400 mt-1">Routes transactions to Razorpay Sandbox sandbox environments.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={payment.testMode}
                    onChange={e => setPayment({...payment, testMode: e.target.checked})}
                    className="w-5 h-5 accent-[#136b8a]"
                  />
                </div>
              </div>
            )}

            {/* Email Alerts */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Email notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Automated Booking Alert Emails</h4>
                      <p className="text-xs text-gray-400 mt-1">Send immediate SMTP mail notifications to admin on new reservations.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={email.sendAlerts}
                      onChange={e => setEmail({...email, sendAlerts: e.target.checked})}
                      className="w-5 h-5 accent-[#136b8a]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Weekly Performance Digest</h4>
                      <p className="text-xs text-gray-400 mt-1">Receive compiled analytical booking reports every week.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={email.weeklyDigest}
                      onChange={e => setEmail({...email, weeklyDigest: e.target.checked})}
                      className="w-5 h-5 accent-[#136b8a]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Social & Chat */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Social links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Instagram URL</label>
                    <input 
                      type="url" 
                      value={social.instagram}
                      onChange={e => setSocial({...social, instagram: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">WhatsApp Contact Number</label>
                    <input 
                      type="text" 
                      value={social.whatsapp}
                      onChange={e => setSocial({...social, whatsapp: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Facebook URL</label>
                    <input 
                      type="url" 
                      value={social.facebook}
                      onChange={e => setSocial({...social, facebook: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Twitter URL</label>
                    <input 
                      type="url" 
                      value={social.twitter}
                      onChange={e => setSocial({...social, twitter: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136b8a]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="bg-[#136b8a] hover:bg-[#0f556e] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow active:scale-98 cursor-pointer disabled:bg-slate-300"
              >
                <Save size={18} />
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
