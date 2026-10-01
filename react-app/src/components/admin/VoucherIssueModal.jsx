import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { X, Ticket, Copy, AlertCircle, User, ChevronRight, Check } from 'lucide-react';

/**
 * VoucherIssueModal — Clean, simple Admin Modal (No AI look)
 */
const VoucherIssueModal = ({ isOpen, onClose, booking, travellers, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedTraveller, setSelectedTraveller] = useState(null);
  const [reason, setReason] = useState('');
  const [validityMonths, setValidityMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [issuedVoucher, setIssuedVoucher] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedTraveller(null);
      setReason('');
      setValidityMonths(6);
      setError('');
      setIssuedVoucher(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'VCH-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleIssueVoucher = async () => {
    if (!selectedTraveller) {
      setError('Please select a traveller.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a cancellation reason.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const voucherCode = generateVoucherCode();
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + validityMonths);

      // 1. Insert voucher record
      const { data: voucherData, error: voucherErr } = await supabase
        .from('service_vouchers')
        .insert({
          voucher_code: voucherCode,
          booking_id: booking.id,
          traveller_id: selectedTraveller.id,
          traveller_name: selectedTraveller.full_name,
          traveller_phone: selectedTraveller.phone || '',
          traveller_email: selectedTraveller.email || '',
          package_title: booking.package_title || '',
          booking_reference: booking.booking_reference || booking.booking_id || '',
          reason: reason.trim(),
          valid_until: validUntil.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (voucherErr) throw voucherErr;

      // 2. Delete traveller from booking_travellers
      if (selectedTraveller.id) {
        const { error: delErr } = await supabase
          .from('booking_travellers')
          .delete()
          .eq('id', selectedTraveller.id);
        if (delErr) console.error('Failed to remove traveller:', delErr);
      }

      // 3. Update booking traveller count
      const currentCount = Number(booking.travellers || booking.travellers_count || 0);
      if (currentCount > 1) {
        await supabase
          .from('bookings')
          .update({ travellers_count: currentCount - 1, travellers: currentCount - 1 })
          .eq('id', booking.id);
      }

      setIssuedVoucher({
        ...voucherData,
        valid_until: validUntil
      });
      setStep(3);

      if (onSuccess) onSuccess(voucherData);
    } catch (err) {
      console.error('Voucher issue error:', err);
      setError(err.message || 'Failed to issue voucher.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (issuedVoucher?.voucher_code) {
      navigator.clipboard.writeText(issuedVoucher.voucher_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden text-gray-900">

        {/* Standard Clean Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Ticket size={18} className="text-[#01AFD1]" />
              {step === 1 ? 'Step 1: Select Traveller' : step === 2 ? 'Step 2: Voucher Details' : 'Step 3: Voucher Issued'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Clean Step Indicator */}
        <div className="flex border-b border-gray-200 bg-white">
          <div className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 ${step === 1 ? 'border-[#01AFD1] text-[#01AFD1]' : step > 1 ? 'border-gray-300 text-gray-700' : 'border-transparent text-gray-400'}`}>
            1. Select Person
          </div>
          <div className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 ${step === 2 ? 'border-[#01AFD1] text-[#01AFD1]' : step > 2 ? 'border-gray-300 text-gray-700' : 'border-transparent text-gray-400'}`}>
            2. Cancellation Details
          </div>
          <div className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 ${step === 3 ? 'border-[#01AFD1] text-[#01AFD1]' : 'border-transparent text-gray-400'}`}>
            3. Issued Code
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center gap-2">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Body Content */}
        <div className="p-5">

          {/* STEP 1: Select Traveller */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs">
                <div className="text-gray-500 font-semibold">Booking Reference:</div>
                <div className="font-bold text-gray-900">{booking.booking_reference || booking.booking_id}</div>
                <div className="text-gray-600 truncate">{booking.package_title}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Select traveller to cancel:
                </label>

                {(!travellers || travellers.length === 0) ? (
                  <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-gray-200 rounded">
                    No individual travellers listed.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {travellers.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        onClick={() => setSelectedTraveller(t)}
                        className={`p-3 rounded border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                          selectedTraveller?.id === t.id
                            ? 'border-[#01AFD1] bg-cyan-50/50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {t.full_name}
                            {t.is_primary && (
                              <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-medium">PRIMARY</span>
                            )}
                          </div>
                          <div className="text-gray-500">{t.phone || t.email || 'No contact'}</div>
                        </div>
                        <input
                          type="radio"
                          name="selected_traveller"
                          checked={selectedTraveller?.id === t.id}
                          onChange={() => setSelectedTraveller(t)}
                          className="accent-[#01AFD1]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedTraveller) {
                      setError('Please select a traveller to proceed.');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  disabled={!selectedTraveller}
                  className="px-4 py-2 bg-[#01AFD1] text-white text-xs font-bold rounded hover:bg-[#0092b3] disabled:opacity-40"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Fill Reason */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs">
                <div className="text-gray-500 font-semibold">Cancelling Traveller:</div>
                <div className="font-bold text-gray-900">{selectedTraveller?.full_name}</div>
                <div className="text-gray-500">{selectedTraveller?.phone || selectedTraveller?.email}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Cancellation *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#01AFD1] min-h-[80px]"
                  placeholder="Enter cancellation reason..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Voucher Validity</label>
                <select
                  value={validityMonths}
                  onChange={(e) => setValidityMonths(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#01AFD1]"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months (Default)</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>

              <div className="pt-2 flex justify-between gap-2 border-t border-gray-100">
                <button
                  onClick={() => { setStep(1); setError(''); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleIssueVoucher}
                  disabled={loading || !reason.trim()}
                  className="px-4 py-2 bg-[#01AFD1] text-white text-xs font-bold rounded hover:bg-[#0092b3] disabled:opacity-40"
                >
                  {loading ? 'Processing...' : 'Confirm & Issue Voucher'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Simple Confirmation (No AI gradients, No big success icons) */}
          {step === 3 && issuedVoucher && (
            <div className="space-y-4 text-xs">
              <div className="text-center pb-2">
                <h3 className="text-sm font-bold text-gray-900">Voucher Generated Successfully</h3>
                <p className="text-gray-500 mt-0.5">Voucher code has been created for {selectedTraveller?.full_name}</p>
              </div>

              {/* Simple Standard Admin Table/Box */}
              <div className="border border-gray-200 rounded bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-semibold">Voucher Code:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-gray-900 tracking-wider">
                      {issuedVoucher.voucher_code}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100 flex items-center gap-1 font-semibold"
                    >
                      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Issued To:</span>
                    <span className="font-semibold text-gray-800">{selectedTraveller?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Package:</span>
                    <span className="font-semibold text-gray-800 truncate block">{booking.package_title}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Issue Date:</span>
                    <span className="font-semibold text-gray-800">{new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Valid Until:</span>
                    <span className="font-semibold text-emerald-700">{new Date(issuedVoucher.valid_until).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-amber-800 text-[11px]">
                Note: {selectedTraveller?.full_name} has been removed from this booking. You can manage this voucher under <strong>Service Vouchers</strong> in the sidebar.
              </div>

              <button
                onClick={onClose}
                className="w-full py-2 bg-gray-900 text-white font-bold rounded text-xs hover:bg-gray-800"
              >
                Close Window
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VoucherIssueModal;
