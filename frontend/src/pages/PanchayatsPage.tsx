import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  PowerOff,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getPanchayats,
  createPanchayat,
  updatePanchayat,
  deactivatePanchayat,
} from '@/services/panchayatService';
import { Panchayat, CreatePanchayatInput, UpdatePanchayatInput } from '@/types/panchayat';
import { PageResponse } from '@/types/pagination';

export const PanchayatsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [data, setData] = useState<PageResponse<Panchayat> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const pageSize = 10;

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [selectedPanchayat, setSelectedPanchayat] = useState<Panchayat | null>(null);

  // Form States
  const [formData, setFormData] = useState<CreatePanchayatInput>({
    name: '',
    code: '',
    district: '',
    block: '',
    state: 'Madhya Pradesh',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getPanchayats({
        search: searchTerm.trim() || undefined,
        page,
        size: pageSize,
      });
      setData(res);
    } catch (err: any) {
      setGlobalMessage({
        type: 'error',
        text: err.message || 'Failed to load Panchayats',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchList();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, page]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      code: '',
      district: '',
      block: '',
      state: 'Madhya Pradesh',
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (p: Panchayat) => {
    setSelectedPanchayat(p);
    setFormData({
      name: p.name,
      code: p.code,
      district: p.district,
      block: p.block,
      state: p.state,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Panchayat name is required';
    if (!formData.code.trim()) errs.code = 'Panchayat code is required';
    if (!formData.district.trim()) errs.district = 'District is required';
    if (!formData.block.trim()) errs.block = 'Block is required';
    if (!formData.state.trim()) errs.state = 'State is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setGlobalMessage(null);
    try {
      await createPanchayat(formData);
      setIsCreateOpen(false);
      setGlobalMessage({
        type: 'success',
        text: `Gram Panchayat "${formData.name}" created successfully.`,
      });
      fetchList();
    } catch (err: any) {
      if (err.data?.errors) {
        setFormErrors(err.data.errors);
      } else {
        setGlobalMessage({
          type: 'error',
          text: err.message || 'Failed to create Panchayat',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPanchayat || !validateForm()) return;

    setSubmitting(true);
    setGlobalMessage(null);
    try {
      const updatePayload: UpdatePanchayatInput = {
        ...formData,
        active: selectedPanchayat.active,
      };
      await updatePanchayat(selectedPanchayat.id, updatePayload);
      setIsEditOpen(false);
      setGlobalMessage({
        type: 'success',
        text: `Gram Panchayat "${formData.name}" updated successfully.`,
      });
      fetchList();
    } catch (err: any) {
      if (err.data?.errors) {
        setFormErrors(err.data.errors);
      } else {
        setGlobalMessage({
          type: 'error',
          text: err.message || 'Failed to update Panchayat',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (p: Panchayat) => {
    if (!confirm(`Are you sure you want to deactivate "${p.name}"? This soft-deactivates the Panchayat safely without deleting historical records.`)) {
      return;
    }

    try {
      await deactivatePanchayat(p.id);
      setGlobalMessage({
        type: 'success',
        text: `Panchayat "${p.name}" deactivated successfully.`,
      });
      fetchList();
    } catch (err: any) {
      setGlobalMessage({
        type: 'error',
        text: err.message || 'Failed to deactivate Panchayat',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-panchayat-100 text-panchayat-800 flex items-center justify-center font-bold text-2xl shadow-inner">
            <Building2 className="w-6 h-6 text-panchayat-700" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Panchayat Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {isAdmin
                ? 'Manage Gram Panchayat administrative units, codes, and state jurisdictions'
                : 'Assigned Gram Panchayat administrative profile and jurisdictional boundary'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            id="create-panchayat-btn"
            className="inline-flex items-center space-x-2 bg-panchayat-700 hover:bg-panchayat-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Panchayat</span>
          </button>
        )}
      </div>

      {/* Global Alerts */}
      {globalMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center space-x-3 border ${
            globalMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {globalMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{globalMessage.text}</span>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, code, district..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            id="search-panchayats-input"
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-panchayat-500 shadow-sm"
          />
        </div>

        {data && (
          <span className="text-xs text-slate-500 self-end sm:self-center">
            Total Panchayats: <strong className="text-slate-800">{data.totalElements}</strong>
          </span>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-panchayat-600" />
            <p className="text-sm">Loading Gram Panchayats...</p>
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-700">No Panchayats found</p>
            <p className="text-xs text-slate-400">Try refining your search keyword or add a new Panchayat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Panchayat Name</th>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">District</th>
                  <th className="px-6 py-3.5">Block</th>
                  <th className="px-6 py-3.5">State</th>
                  <th className="px-6 py-3.5">Status</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 border border-slate-200 font-semibold text-slate-700">
                        {p.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">{p.district}</td>
                    <td className="px-6 py-4">{p.block}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{p.state}</td>
                    <td className="px-6 py-4">
                      {p.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          Deactivated
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-panchayat-700 rounded-lg transition"
                          title="Edit Panchayat"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {p.active && (
                          <button
                            onClick={() => handleDeactivate(p)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title="Deactivate Panchayat (Safe Soft-Delete)"
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
            <span>
              Page <strong className="text-slate-800">{data.page + 1}</strong> of{' '}
              <strong className="text-slate-800">{data.totalPages}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={data.page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={data.last}
                onClick={() => setPage((prev) => prev + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {isCreateOpen ? 'Create New Gram Panchayat' : `Edit ${selectedPanchayat?.name}`}
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Panchayat Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rampur Gram Panchayat"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-panchayat-500 focus:outline-none"
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LGD / Official Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RAMPUR01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm uppercase font-mono focus:ring-2 focus:ring-panchayat-500 focus:outline-none"
                />
                {formErrors.code && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.code}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sehore"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-panchayat-500 focus:outline-none"
                  />
                  {formErrors.district && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.district}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Block / Janpad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ichhawar"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-panchayat-500 focus:outline-none"
                  />
                  {formErrors.block && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.block}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madhya Pradesh"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-panchayat-500 focus:outline-none"
                />
                {formErrors.state && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.state}</p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center space-x-2 px-5 py-2 bg-panchayat-700 hover:bg-panchayat-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isCreateOpen ? 'Create Panchayat' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
