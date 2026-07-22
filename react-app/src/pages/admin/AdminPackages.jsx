import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { formatSlugToTitle } from '../../utils/formatters';
import PackageForm from '../../components/admin/PackageForm';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  PackageIcon,
} from 'lucide-react';

const PAGE_SIZE = 10;

const AdminPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Search & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch all packages ──────────────────────────────────
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('Pakage')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setPackages(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load packages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Auto-clear success message
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ── Create / Update ─────────────────────────────────────
  const handleFormSubmit = async (pkgData) => {
    setSaving(true);
    setError(null);
    try {
      const { package_placements, ...pkg } = pkgData;
      let packageId = null;

      if (editingPkg) {
        // UPDATE
        packageId = editingPkg.id;
        const { error: updateErr } = await supabase
          .from('Pakage')
          .update(pkg)
          .eq('id', packageId);
        if (updateErr) throw updateErr;
      } else {
        // INSERT
        const { data, error: insertErr } = await supabase
          .from('Pakage')
          .insert([pkg])
          .select();
        if (insertErr) throw insertErr;
        if (!data || data.length === 0) throw new Error("Insert succeeded but database returned no rows (possible RLS read policy issue).");
        packageId = data[0].id;
      }

      // Handle package placements
      if (packageId) {
        // Delete old placements
        const { error: delErr } = await supabase
          .from('package_placements')
          .delete()
          .eq('package_id', packageId);
        if (delErr) throw delErr;

        // Insert new placements
        if (package_placements && package_placements.length > 0) {
          const placementsToInsert = package_placements.map(p => ({
            package_id: packageId,
            placement_type: p.type,
            placement_id: p.id,
            placement_slug: p.slug
          }));
          const { error: placeErr } = await supabase
            .from('package_placements')
            .insert(placementsToInsert);
          if (placeErr) throw placeErr;
        }
      }

      setSuccessMsg(`"${pkg.title}" saved successfully.`);
      setShowForm(false);
      setEditingPkg(null);
      await fetchPackages();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save package.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const { error: delErr } = await supabase
        .from('Pakage')
        .delete()
        .eq('id', deleteTarget.id);
      if (delErr) throw delErr;
      setSuccessMsg(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      await fetchPackages();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete package.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Toggle status ───────────────────────────────────────
  const toggleField = async (pkg, field) => {
    setError(null);
    const newValue = field === 'status'
      ? (pkg.status === 'active' ? 'inactive' : 'active')
      : !pkg[field];

    try {
      const { error: toggleErr } = await supabase
        .from('Pakage')
        .update({ [field]: newValue })
        .eq('id', pkg.id);
      if (toggleErr) throw toggleErr;
      
      await fetchPackages();
    } catch (err) {
      console.error('Toggle error:', err);
      setError(err.message || `Failed to toggle ${field}.`);
    }
  };

  // ── Filtering & Pagination ──────────────────────────────
  const filtered = packages.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.destination && formatSlugToTitle(p.destination).toLowerCase().includes(q)) ||
      (p.state && formatSlugToTitle(p.state).toLowerCase().includes(q)) ||
      (p.category && formatSlugToTitle(p.category).toLowerCase().includes(q)) ||
      (p.slug && p.slug.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  // ── Render helpers ──────────────────────────────────────
  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
      status === 'active'
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-gray-100 text-gray-500 border border-gray-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );

  const ToggleButton = ({ active, onClick, activeIcon: ActiveIcon, inactiveIcon: InactiveIcon, activeColor, title }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all ${
        active
          ? `${activeColor} shadow-sm`
          : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
      }`}
    >
      {active ? <ActiveIcon size={16} /> : <InactiveIcon size={16} />}
    </button>
  );

  // ══════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-500 mt-1">
            Manage your travel packages.
            {!loading && <span className="ml-1 text-gray-400">({packages.length} total)</span>}
          </p>
        </div>
        <button
          onClick={() => { setEditingPkg(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
        >
          <Plus size={18} />
          Create Package
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="bg-green-50 text-green-800 text-sm px-4 py-3 rounded-lg border border-green-200 flex items-center gap-2 animate-in">
          <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs font-medium">Dismiss</button>
        </div>
      )}

      {/* Search & Refresh */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, destination, state, category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>
        <button
          onClick={fetchPackages}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw size={32} className="animate-spin mb-3" />
            <span className="text-sm">Loading packages...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <PackageIcon size={40} className="mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              {searchQuery ? 'No packages match your search.' : 'No packages yet.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => { setEditingPkg(null); setShowForm(true); }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first package →
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Title</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Destination</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">State</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Duration</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Price (₹)</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map(pkg => (
                    <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {pkg.image_url && (
                            <img
                              src={pkg.image_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{pkg.title || '—'}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{pkg.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{formatSlugToTitle(pkg.destination) || '—'}</td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{formatSlugToTitle(pkg.state) || '—'}</td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{pkg.duration || '—'}</td>
                      <td className="px-4 py-3.5 text-gray-900 font-medium whitespace-nowrap">
                        {pkg.price != null ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button onClick={() => toggleField(pkg, 'status')} title="Toggle status">
                          <StatusBadge status={pkg.status} />
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingPkg(pkg); setShowForm(true); }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(pkg)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        page === safePage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Package Form Modal ──────────────────────────── */}
      {showForm && (
        <PackageForm
          initialData={editingPkg}
          saving={saving}
          onCancel={() => { setShowForm(false); setEditingPkg(null); }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* ── Delete Confirmation Modal ───────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Package</h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to delete this package?
            </p>
            <p className="text-sm font-semibold text-gray-800 mb-6">
              "{deleteTarget.title}"
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackages;
