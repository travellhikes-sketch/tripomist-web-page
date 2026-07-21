import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Activity, Search, Filter } from 'lucide-react';

const AdminBookingActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRef, setSearchRef] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Extract unique actions for the filter dropdown
  const uniqueActions = [...new Set(logs.map(log => log.action))].sort();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // We need to join with bookings to get the booking_reference
      const { data, error: fetchError } = await supabase
        .from('booking_activity_logs')
        .select(`
          *,
          bookings ( booking_reference, package_title )
        `)
        .order('changed_at', { ascending: false });

      if (fetchError) throw fetchError;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchRef = (log.bookings?.booking_reference?.toLowerCase() || '').includes(searchRef.toLowerCase());
    const matchAction = actionFilter ? log.action === actionFilter : true;
    return matchRef && matchAction;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-[#136b8a]" /> Booking Activity Logs
          </h1>
          <p className="text-gray-500 mt-1">Audit trail of all modifications made to bookings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Booking Ref..."
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              className="w-full sm:w-48 pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#136b8a]/20 focus:border-[#136b8a] outline-none text-sm"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full sm:w-40 pl-9 pr-8 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#136b8a]/20 focus:border-[#136b8a] outline-none appearance-none text-sm bg-white"
            >
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            <Filter size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-600 whitespace-nowrap">Date & Time</th>
                  <th className="p-4 font-semibold text-gray-600 whitespace-nowrap">Booking Ref</th>
                  <th className="p-4 font-semibold text-gray-600 whitespace-nowrap">Action</th>
                  <th className="p-4 font-semibold text-gray-600">Details</th>
                  <th className="p-4 font-semibold text-gray-600 whitespace-nowrap">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No activity logs found.</td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-500 whitespace-nowrap">
                        {new Date(log.changed_at).toLocaleString(undefined, { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-[#136b8a]">{log.bookings?.booking_reference || 'Unknown'}</div>
                        <div className="text-xs text-gray-400 line-clamp-1 max-w-[150px]">{log.bookings?.package_title}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg font-medium text-xs whitespace-nowrap">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        {log.field_name ? (
                          <div>
                            Changed <span className="font-mono text-xs bg-gray-100 px-1 rounded">{log.field_name}</span>
                            {log.old_value && (
                              <span className="text-gray-500"> from <span className="line-through text-red-400">{log.old_value}</span></span>
                            )}
                            {log.new_value && (
                              <span className="text-gray-500"> to <span className="text-emerald-600 font-medium">{log.new_value}</span></span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">No specific field details</span>
                        )}
                        {log.note && <div className="text-xs text-gray-400 mt-1">{log.note}</div>}
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-xs max-w-[120px] truncate" title={log.changed_by}>
                        {log.changed_by || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingActivityLogs;
