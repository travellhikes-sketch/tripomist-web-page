import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, ShieldAlert, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const AdminServiceRecovery = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedCase, setSelectedCase] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_recovery_cases')
        .select(`
          *,
          bookings!service_recovery_cases_booking_id_fkey (
            booking_id,
            package_title,
            customer_name,
            phone,
            email,
            travel_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus, currentNotes) => {
    try {
      const { error } = await supabase
        .from('service_recovery_cases')
        .update({ 
          status: newStatus,
          resolution_notes: newStatus === 'resolved' ? (resolutionNotes || currentNotes) : currentNotes,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      
      setCases(prev => prev.map(c => 
        c.id === id ? { ...c, status: newStatus, resolution_notes: (newStatus === 'resolved' ? (resolutionNotes || currentNotes) : currentNotes), resolved_at: (newStatus === 'resolved' ? new Date().toISOString() : null) } : c
      ));
      
      if (selectedCase?.id === id) {
        setSelectedCase(prev => ({ 
          ...prev, 
          status: newStatus, 
          resolution_notes: (newStatus === 'resolved' ? (resolutionNotes || currentNotes) : currentNotes),
          resolved_at: (newStatus === 'resolved' ? new Date().toISOString() : null)
        }));
      }
      
      if (newStatus === 'resolved') {
        setResolutionNotes('');
        setSelectedCase(null);
      }
    } catch (err) {
      alert('Failed to update case status.');
    }
  };

  const filteredCases = cases.filter(c => {
    const term = searchTerm.toLowerCase();
    const bk = c.bookings;
    return (
      (c.issue_description?.toLowerCase() || '').includes(term) ||
      (bk?.customer_name?.toLowerCase() || '').includes(term) ||
      (bk?.phone || '').includes(term) ||
      (bk?.booking_id?.toLowerCase() || '').includes(term)
    );
  });

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="sticky top-0 z-10 bg-slate-50 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="text-rose-600" /> Service Recovery
            </h1>
            <p className="text-sm text-gray-500">Track and manage client issues and compensation.</p>
          </div>
          <button onClick={fetchCases} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 text-sm font-semibold flex items-center gap-2">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md flex items-center gap-2 mb-4 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by customer, booking ID, or issue..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-rose-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600 mb-3"></div>
            <p className="text-sm font-medium text-gray-500">Loading cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-base font-bold text-gray-900">No service recovery cases found</h3>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10 outline outline-1 outline-gray-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold text-gray-600">Date Logged</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600">Customer & Booking</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600">Issue Preview</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600">Status</th>
                <th className="py-2.5 px-4 font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-4">
                    <div className="text-gray-900">{new Date(c.created_at).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="font-semibold text-gray-900">{c.bookings?.customer_name || 'Unknown'}</div>
                    <div className="text-xs text-[#136b8a] font-mono">{c.bookings?.booking_id || 'N/A'}</div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="text-gray-800 truncate max-w-[250px]">{c.issue_description}</div>
                    {c.compensation_offered && <div className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded inline-block mt-1 uppercase font-bold">Compensation Offered</div>}
                  </td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right">
                     <button 
                       onClick={() => setSelectedCase(c)}
                       className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border border-indigo-200"
                     >
                       Review Case
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Case Details Drawer/Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="text-rose-600" /> Case Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">Logged on {new Date(selectedCase.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedCase(null)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full">
                X
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Customer</span>
                <span className="font-semibold text-gray-900">{selectedCase.bookings?.customer_name}</span>
                <div className="text-gray-600 mt-1">{selectedCase.bookings?.phone}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Booking Info</span>
                <span className="font-mono text-[#136b8a] font-bold">{selectedCase.bookings?.booking_id}</span>
                <div className="text-gray-600 truncate mt-1">{selectedCase.bookings?.package_title}</div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Issue Description</h3>
              <div className="bg-rose-50 border border-rose-100 text-rose-900 p-4 rounded-lg whitespace-pre-wrap text-sm">
                {selectedCase.issue_description}
              </div>
            </div>
            
            {selectedCase.compensation_offered && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-800 mb-2">Compensation Details</h3>
                <div className="bg-amber-50 border border-amber-100 text-amber-900 p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {selectedCase.compensation_offered}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Resolution Notes {selectedCase.status === 'open' && '*'}</h3>
              <textarea 
                value={selectedCase.status === 'resolved' ? selectedCase.resolution_notes || '' : resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                readOnly={selectedCase.status === 'resolved'}
                className={`w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none ${selectedCase.status === 'resolved' ? 'bg-gray-50' : 'focus:border-indigo-500'}`}
                rows="4"
                placeholder="Enter details on how this issue was resolved..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              {selectedCase.status === 'open' ? (
                <>
                  <button onClick={() => setSelectedCase(null)} className="px-5 py-2 font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={() => handleUpdateStatus(selectedCase.id, 'resolved', selectedCase.resolution_notes)} className="px-5 py-2 font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors">
                    <CheckCircle size={16} /> Mark as Resolved
                  </button>
                </>
              ) : (
                <button onClick={() => handleUpdateStatus(selectedCase.id, 'open', selectedCase.resolution_notes)} className="px-5 py-2 font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Re-open Case
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceRecovery;
