import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Shield,
  Building,
  Key,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
} from '@/services/userService';
import { getPanchayats } from '@/services/panchayatService';
import { ManagedUser, CreateUserInput, UpdateUserInput, UserRole } from '@/types/user';
import { Panchayat } from '@/types/panchayat';
import { PageResponse } from '@/types/pagination';

const ROLE_LABELS: Record<UserRole, { label: string; color: string }> = {
  ADMIN: { label: 'Administrator', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  SECRETARY: { label: 'Sachiv (Secretary)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  SARPANCH: { label: 'Sarpanch (President)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  GRS: { label: 'Gram Rojgar Sahayak', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  PANCH: { label: 'Ward Panch', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  CITIZEN: { label: 'Village Citizen', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export const UsersPage: React.FC = () => {
  const { user: currentAuthUser } = useAuth();
  const isAdmin = currentAuthUser?.role === 'ADMIN';
  const isSecretary = currentAuthUser?.role === 'SECRETARY';
  const canCreate = isAdmin || isSecretary;

  const [data, setData] = useState<PageResponse<ManagedUser> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const pageSize = 10;

  // List of Panchayats for Admin filter/assign
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [selectedPanchayatFilter, setSelectedPanchayatFilter] = useState<number | undefined>(undefined);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    mobile: string;
    password?: string;
    role: UserRole;
    panchayatId?: number | null;
  }>({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    role: 'CITIZEN',
    panchayatId: currentAuthUser?.panchayatId || null,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Panchayats if Admin
  useEffect(() => {
    if (isAdmin) {
      getPanchayats({ page: 0, size: 100 })
        .then((res) => setPanchayats(res.content))
        .catch(() => {});
    }
  }, [isAdmin]);

  const fetchUsersList = async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        panchayatId: isAdmin ? selectedPanchayatFilter : undefined,
        search: searchTerm.trim() || undefined,
        page,
        size: pageSize,
      });
      setData(res);
    } catch (err: any) {
      setGlobalMessage({
        type: 'error',
        text: err.message || 'Failed to load users',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsersList();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, page, selectedPanchayatFilter]);

  const handleOpenCreate = () => {
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      password: '',
      role: isSecretary ? 'CITIZEN' : 'ADMIN',
      panchayatId: currentAuthUser?.panchayatId || (panchayats[0]?.id ?? null),
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (target: ManagedUser) => {
    setSelectedUser(target);
    setFormData({
      fullName: target.fullName,
      email: target.email,
      mobile: target.mobile,
      role: target.role,
      panchayatId: target.panchayatId,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const validateUserForm = (isCreating: boolean) => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Valid email is required';
    }
    if (!formData.mobile.trim()) errs.mobile = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(formData.mobile.trim())) {
      errs.mobile = 'Mobile number must be exactly 10 digits';
    }
    if (isCreating) {
      if (!formData.password || formData.password.length < 6) {
        errs.password = 'Temporary password must be at least 6 characters';
      }
    }
    if (isAdmin && formData.role !== 'ADMIN' && !formData.panchayatId) {
      errs.panchayatId = 'Panchayat selection is required for village roles';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUserForm(true)) return;

    setSubmitting(true);
    setGlobalMessage(null);
    try {
      const payload: CreateUserInput = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password!,
        role: formData.role,
        panchayatId: formData.role === 'ADMIN' ? null : (formData.panchayatId ?? currentAuthUser?.panchayatId),
      };

      await createUser(payload);
      setIsCreateOpen(false);
      setGlobalMessage({
        type: 'success',
        text: `User account "${formData.fullName}" created successfully.`,
      });
      fetchUsersList();
    } catch (err: any) {
      if (err.data?.errors) {
        setFormErrors(err.data.errors);
      } else {
        setGlobalMessage({
          type: 'error',
          text: err.message || 'Failed to create user',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !validateUserForm(false)) return;

    setSubmitting(true);
    setGlobalMessage(null);
    try {
      const payload: UpdateUserInput = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        role: isAdmin ? formData.role : undefined,
        panchayatId: isAdmin ? formData.panchayatId : undefined,
      };

      await updateUser(selectedUser.id, payload);
      setIsEditOpen(false);
      setGlobalMessage({
        type: 'success',
        text: `User "${formData.fullName}" updated successfully.`,
      });
      fetchUsersList();
    } catch (err: any) {
      if (err.data?.errors) {
        setFormErrors(err.data.errors);
      } else {
        setGlobalMessage({
          type: 'error',
          text: err.message || 'Failed to update user',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (target: ManagedUser) => {
    if (target.id === currentAuthUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    const nextStatus = !target.active;
    const actionWord = nextStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${actionWord} account for "${target.fullName}"?`)) {
      return;
    }

    try {
      await updateUserStatus(target.id, nextStatus);
      setGlobalMessage({
        type: 'success',
        text: `User account "${target.fullName}" ${actionWord}d successfully.`,
      });
      fetchUsersList();
    } catch (err: any) {
      setGlobalMessage({
        type: 'error',
        text: err.message || `Failed to ${actionWord} user`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-panchayat-100 text-panchayat-800 flex items-center justify-center font-bold text-2xl shadow-inner">
            <Users className="w-6 h-6 text-panchayat-700" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              User Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {isAdmin
                ? 'System-wide staff, administrators, village leaders, and citizen accounts'
                : 'Panchayat officials, field staff, ward panchs, and registered citizens'}
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            id="create-user-btn"
            className="inline-flex items-center space-x-2 bg-panchayat-700 hover:bg-panchayat-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Global Notifications */}
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, mobile..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              id="search-users-input"
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-panchayat-500 shadow-sm"
            />
          </div>

          {isAdmin && panchayats.length > 0 && (
            <select
              value={selectedPanchayatFilter ?? ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setSelectedPanchayatFilter(val);
                setPage(0);
              }}
              id="filter-panchayat-select"
              className="w-full sm:w-56 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-panchayat-500 shadow-sm"
            >
              <option value="">All Panchayats</option>
              {panchayats.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {data && (
          <span className="text-xs text-slate-500 self-end sm:self-center">
            Total Users: <strong className="text-slate-800">{data.totalElements}</strong>
          </span>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-panchayat-600" />
            <p className="text-sm">Loading users...</p>
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-700">No users found</p>
            <p className="text-xs text-slate-400">Try refining search parameters or add a new user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Panchayat</th>
                  <th className="px-6 py-3.5">Mobile</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((u) => {
                  const roleBadge = ROLE_LABELS[u.role] || {
                    label: u.role,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{u.fullName}</span>
                          <span className="text-xs text-slate-500">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadge.color}`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {u.panchayatName ? (
                          <span className="flex items-center space-x-1">
                            <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{u.panchayatName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">System Scope (Admin)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{u.mobile}</td>
                      <td className="px-6 py-4">
                        {u.active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {(isAdmin || isSecretary) && (
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-panchayat-700 rounded-lg transition"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {(isAdmin || isSecretary) && u.id !== currentAuthUser?.id && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition ${
                              u.active
                                ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                                : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                            }`}
                            title={u.active ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.active ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
                {isCreateOpen ? 'Create New User Account' : `Edit User: ${selectedUser?.fullName}`}
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
                <label htmlFor="user-fullname-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="user-fullname-input"
                  type="text"
                  required
                  placeholder="e.g. Rameshwar Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-panchayat-500 focus:outline-none"
                />
                {formErrors.fullName && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="user-email-input"
                    type="email"
                    required
                    placeholder="name@gramai.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-panchayat-500 focus:outline-none"
                  />
                  {formErrors.email && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="user-mobile-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number (10 digits) *
                  </label>
                  <input
                    id="user-mobile-input"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-panchayat-500 focus:outline-none"
                  />
                  {formErrors.mobile && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.mobile}</p>
                  )}
                </div>
              </div>

              {isCreateOpen && (
                <div>
                  <label htmlFor="user-password-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Temporary Setup Password *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="user-password-input"
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-panchayat-500 focus:outline-none"
                    />
                  </div>
                  {formErrors.password && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.password}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-role-select" className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role *
                  </label>
                  <select
                    id="user-role-select"
                    value={formData.role}
                    disabled={!isAdmin && isEditOpen}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-panchayat-500 focus:outline-none disabled:bg-slate-50"
                  >
                    {isAdmin && <option value="ADMIN">Administrator</option>}
                    {isAdmin && <option value="SECRETARY">Secretary (Sachiv)</option>}
                    <option value="SARPANCH">Sarpanch (President)</option>
                    <option value="GRS">GRS (Rojgar Sahayak)</option>
                    <option value="PANCH">Ward Panch</option>
                    <option value="CITIZEN">Citizen</option>
                  </select>
                  {formErrors.role && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.role}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="user-panchayat-select" className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Panchayat {formData.role !== 'ADMIN' && '*'}
                  </label>
                  {isAdmin ? (
                    <select
                      id="user-panchayat-select"
                      value={formData.panchayatId ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          panchayatId: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      disabled={formData.role === 'ADMIN'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-panchayat-500 focus:outline-none disabled:bg-slate-50"
                    >
                      <option value="">{formData.role === 'ADMIN' ? 'None (System Admin)' : 'Select Panchayat'}</option>
                      {panchayats.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="user-panchayat-select"
                      type="text"
                      disabled
                      value={currentAuthUser?.panchayatId ? `Panchayat #${currentAuthUser.panchayatId}` : 'Assigned Panchayat'}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-500"
                    />
                  )}
                  {formErrors.panchayatId && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.panchayatId}</p>
                  )}
                </div>
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
                  <span>{isCreateOpen ? 'Create User' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
