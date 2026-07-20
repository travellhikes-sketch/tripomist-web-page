import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  MessageSquare, 
  User, 
  AlertCircle 
} from 'lucide-react';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | pending | approved | rejected

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to load reviews. Please verify reviews table exists in Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setError(null);
    try {
      const { error: updateErr } = await supabase
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateErr) throw updateErr;
      setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Error updating review status:', err);
      setError(err.message || 'Failed to update review status.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    setError(null);
    try {
      const { error: delErr } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      setReviews(reviews.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting review:', err);
      setError(err.message || 'Failed to delete review.');
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 mt-1">Approve, reject, or delete customer reviews submitted for packages.</p>
        </div>
        <button 
          onClick={fetchReviews}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium"
        >
          <User size={18} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Reviews' },
          { key: 'pending', label: 'Pending Approval' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-[#136b8a] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label} ({
              tab.key === 'all' 
                ? reviews.length 
                : reviews.filter(r => r.status === tab.key).length
            })
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136b8a]"></div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm text-gray-500">
          <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
          No reviews found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((rev) => (
            <div key={rev.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-950 text-sm leading-tight">{rev.user_name || 'Anonymous'}</h4>
                      <p className="text-[10px] text-[#136b8a] font-bold mt-0.5">{rev.package_title}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                    rev.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : rev.status === 'rejected'
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {rev.status}
                  </span>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, idx) => (
                    <Star 
                      key={idx} 
                      size={14} 
                      className={idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} 
                    />
                  ))}
                </div>

                {/* Comment Text */}
                <p className="text-sm text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-semibold font-mono">
                  {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  }) : '—'}
                </span>
                
                <div className="flex items-center gap-2">
                  {rev.status !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(rev.id, 'approved')}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-100 transition-colors"
                      title="Approve Review"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  {rev.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-100 transition-colors"
                      title="Reject Review"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
