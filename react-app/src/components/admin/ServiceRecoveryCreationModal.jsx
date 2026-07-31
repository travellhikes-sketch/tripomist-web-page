import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { X, ShieldAlert, AlertCircle } from 'lucide-react';

const ServiceRecoveryCreationModal = ({ isOpen, onClose, onSuccess, booking }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    issue_title: '',
    issue_description: '',
    priority: 'medium',
    incident_date: new Date().toISOString().split('T')[0],
    internal_notes: '',
  });

  const [issueVoucher, setIssueVoucher] = useState(false);
  const [voucherAmount, setVoucherAmount] = useState('');
  const [voucherExpiry, setVoucherExpiry] = useState('');
  const [voucherNotes, setVoucherNotes] = useState('');

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (issueVoucher) {
      if (!voucherAmount || isNaN(voucherAmount) || parseFloat(voucherAmount) <= 0) {
        setError("Please enter a valid positive voucher amount.");
        return;
      }
      if (!voucherExpiry) {
        setError("Please select a voucher expiry date.");
        return;
      }
      if (new Date(voucherExpiry) <= new Date()) {
        setError("Voucher expiry date must be in the future.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        p_booking_id: booking.id,
        p_issue_title: formData.issue_title,
        p_issue_description: formData.issue_description,
        p_priority: formData.priority,
        p_incident_date: formData.incident_date,
        p_internal_notes: formData.internal_notes,
        p_issue_voucher: issueVoucher,
        p_voucher_amount: issueVoucher ? parseFloat(voucherAmount) : 0,
        p_voucher_expiry: issueVoucher ? new Date(voucherExpiry).toISOString() : null,
        p_voucher_notes: issueVoucher ? voucherNotes : null
      };

      const { data, error } = await supabase.rpc('create_service_recovery_case_with_voucher', payload);
      if (error) throw error;

      onSuccess(data);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create service recovery case.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="text-rose-600" /> Log Problem Faced
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
              <AlertCircle size={18} /> <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
            <div className="text-xs uppercase font-bold text-gray-500 mb-1">Booking Reference</div>
            <div className="font-mono text-[#136b8a] font-bold">{booking.booking_id || booking.id}</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">{booking.customer_name} - {booking.package_title}</div>
          </div>

          <form id="srForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Issue Title *</label>
              <input type="text" required value={formData.issue_title} onChange={e => setFormData({...formData, issue_title: e.target.value})} className="w-full p-2.5 border rounded-lg focus:border-[#136b8a] outline-none text-sm" placeholder="Brief title of the issue" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Detailed Description *</label>
              <textarea required value={formData.issue_description} onChange={e => setFormData({...formData, issue_description: e.target.value})} className="w-full p-2.5 border rounded-lg focus:border-[#136b8a] outline-none text-sm min-h-[100px]" placeholder="What happened?" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full p-2.5 border rounded-lg focus:border-[#136b8a] outline-none text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Incident Date *</label>
                <input type="date" required value={formData.incident_date} onChange={e => setFormData({...formData, incident_date: e.target.value})} className="w-full p-2.5 border rounded-lg focus:border-[#136b8a] outline-none text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Internal Notes</label>
              <input type="text" value={formData.internal_notes} onChange={e => setFormData({...formData, internal_notes: e.target.value})} className="w-full p-2.5 border rounded-lg focus:border-[#136b8a] outline-none text-sm" placeholder="For admin view only" />
            </div>

            <div className="mt-6 bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" id="issueVoucherSR" checked={issueVoucher} onChange={e => setIssueVoucher(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                <label htmlFor="issueVoucherSR" className="text-sm font-bold text-emerald-800 cursor-pointer">Issue Compensation Coupon Now</label>
              </div>
              
              {issueVoucher && (
                <div className="mt-4 space-y-4 border-l-2 border-emerald-200 pl-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Coupon Amount (₹) *</label>
                      <input type="number" min="0" value={voucherAmount} onChange={e => setVoucherAmount(e.target.value)} className="w-full border border-emerald-300 rounded-md p-2 text-sm focus:border-emerald-500 outline-none" placeholder="e.g. 500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Validity / Expiry Date *</label>
                      <input type="date" value={voucherExpiry} onChange={e => setVoucherExpiry(e.target.value)} className="w-full border border-emerald-300 rounded-md p-2 text-sm focus:border-emerald-500 outline-none" min={new Date().toISOString().split('T')[0]} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Coupon Notes / Reason</label>
                    <input type="text" value={voucherNotes} onChange={e => setVoucherNotes(e.target.value)} className="w-full border border-emerald-300 rounded-md p-2 text-sm focus:border-emerald-500 outline-none" placeholder="e.g. For incident inconvenience" />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg">Cancel</button>
          <button type="submit" form="srForm" disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 flex items-center gap-2">
            {loading ? 'Creating...' : 'Log Case'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRecoveryCreationModal;
