import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Phone,
  Home,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { getCitizens, updateCitizenStatus } from '@/services/citizenService';
import { Citizen, CitizenStatus } from '@/types/citizen';
import { useAuth } from '@/context/AuthContext';

export const CitizensPage: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'SECRETARY';

  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [sort] = useState('createdAt,desc');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [wardFilter, setWardFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<CitizenStatus | ''>('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusTogglingId, setStatusTogglingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadCitizens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const wardNum = wardFilter ? parseInt(wardFilter, 10) : undefined;
      const response = await getCitizens({
        search: debouncedSearch || undefined,
        village: villageFilter.trim() || undefined,
        wardNumber: isNaN(wardNum as number) ? undefined : wardNum,
        status: statusFilter || undefined,
        page,
        size,
        sort,
      });
      setCitizens(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err?.message || 'नागरिकों की सूची लोड करने में त्रुटि हुई (Failed to load citizens)');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, villageFilter, wardFilter, statusFilter, page, size, sort]);

  useEffect(() => {
    loadCitizens();
  }, [loadCitizens]);

  const handleStatusToggle = async (citizen: Citizen) => {
    if (!canManage) return;
    const nextStatus: CitizenStatus = citizen.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionHindi = nextStatus === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय';

    const confirmed = window.confirm(
      `क्या आप नागरिक "${citizen.fullName}" को ${actionHindi} करना चाहते हैं?\n(Are you sure you want to mark this citizen as ${nextStatus}?)`
    );
    if (!confirmed) return;

    setStatusTogglingId(citizen.id);
    try {
      await updateCitizenStatus(citizen.id, nextStatus);
      setSuccessMessage(`नागरिक "${citizen.fullName}" की स्थिति सफलतापूर्वक अपडेट की गई।`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadCitizens();
    } catch (err: any) {
      alert(err?.message || 'स्थिति अपडेट करने में त्रुटि हुई');
    } finally {
      setStatusTogglingId(null);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setVillageFilter('');
    setWardFilter('');
    setStatusFilter('');
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-panchayat-100 text-panchayat-800">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              नागरिक पंजी (Citizen Registry)
            </h1>
            <span
              id="citizen-count-badge"
              className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-panchayat-50 text-panchayat-800 border border-panchayat-200"
            >
              {totalElements} कुल
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            ग्राम पंचायत के पंजीकृत निवासियों की अधिकृत सूची, वार्ड विवरण एवं स्थिति प्रबंधन
          </p>
        </div>

        {canManage && (
          <Link
            to="/citizens/new"
            id="add-citizen-button"
            className="inline-flex items-center justify-center space-x-2 bg-panchayat-700 hover:bg-panchayat-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>नया नागरिक जोड़ें (Add Citizen)</span>
          </Link>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 font-bold hover:text-emerald-900 text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="citizen-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="नाम, मोबाइल, या गांव से खोजें (Search)..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-panchayat-500 focus:border-panchayat-500 transition"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                ✕
              </button>
            )}
          </div>

          {/* Village Filter */}
          <div>
            <div className="relative">
              <Home className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                id="village-filter-input"
                value={villageFilter}
                onChange={(e) => {
                  setVillageFilter(e.target.value);
                  setPage(0);
                }}
                placeholder="गांव फ़िल्टर (Village)..."
                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-panchayat-500 focus:border-panchayat-500 transition"
              />
            </div>
          </div>

          {/* Ward Filter */}
          <div>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="number"
                min="1"
                max="999"
                id="ward-filter-input"
                value={wardFilter}
                onChange={(e) => {
                  setWardFilter(e.target.value);
                  setPage(0);
                }}
                placeholder="वार्ड संख्या (Ward)..."
                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-panchayat-500 focus:border-panchayat-500 transition"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CitizenStatus | '');
                setPage(0);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-panchayat-500 focus:border-panchayat-500 bg-white transition"
            >
              <option value="">सभी स्थितियां (All Status)</option>
              <option value="ACTIVE">सक्रिय (ACTIVE)</option>
              <option value="INACTIVE">निष्क्रिय (INACTIVE)</option>
            </select>
          </div>
        </div>

        {/* Filter Badges & Reset */}
        {(debouncedSearch || villageFilter || wardFilter || statusFilter) && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-500">
              <Filter className="w-3.5 h-3.5 text-panchayat-700" />
              <span>सक्रिय फ़िल्टर (Active Filters):</span>
              {debouncedSearch && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  खोज: &quot;{debouncedSearch}&quot;
                </span>
              )}
              {villageFilter && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  गांव: {villageFilter}
                </span>
              )}
              {wardFilter && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  वार्ड: {wardFilter}
                </span>
              )}
              {statusFilter && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  स्थिति: {statusFilter === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'}
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              id="reset-filters-btn"
              className="inline-flex items-center space-x-1 text-panchayat-700 hover:text-panchayat-900 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>फ़िल्टर हटाएं (Reset)</span>
            </button>
          </div>
        )}
      </div>

      {/* Error View */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold">डेटा प्राप्त करने में विफलता (Loading Error)</p>
            <p>{error}</p>
          </div>
          <button
            onClick={loadCitizens}
            className="px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-100 font-semibold text-xs"
          >
            पुनः प्रयास करें (Retry)
          </button>
        </div>
      )}

      {/* Main Table / Card Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-panchayat-700 animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              नागरिक सूची लोड हो रही है (Loading citizens)...
            </p>
          </div>
        ) : citizens.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              कोई नागरिक नहीं मिला (No citizens found)
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              दिए गए खोज या फ़िल्टर मानदंडों से कोई नागरिक रिकॉर्ड मेल नहीं खाता।
            </p>
            {canManage && (
              <div className="pt-2">
                <Link
                  to="/citizens/new"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-panchayat-700 text-white rounded-lg text-xs font-semibold hover:bg-panchayat-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>पहला नागरिक जोड़ें (Add First Citizen)</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm" id="citizens-table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">नागरिक का नाम (Name)</th>
                    <th className="py-3.5 px-4">मोबाइल (Mobile)</th>
                    <th className="py-3.5 px-4">गांव (Village)</th>
                    <th className="py-3.5 px-4">वार्ड (Ward)</th>
                    <th className="py-3.5 px-4">स्थिति (Status)</th>
                    <th className="py-3.5 px-4 text-right">कार्य (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {citizens.map((citizen) => (
                    <tr
                      key={citizen.id}
                      className="hover:bg-slate-50/80 transition group"
                      id={`citizen-row-${citizen.id}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-panchayat-50 text-panchayat-800 font-bold text-xs flex items-center justify-center border border-panchayat-200">
                            {citizen.fullName.charAt(0)}
                          </div>
                          <div>
                            <Link
                              to={`/citizens/${citizen.id}`}
                              className="font-bold text-slate-900 hover:text-panchayat-700 transition"
                            >
                              {citizen.fullName}
                            </Link>
                            {citizen.address && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                {citizen.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {citizen.mobile ? (
                          <div className="flex items-center space-x-1 text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{citizen.mobile}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {citizen.village}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          वार्ड #{citizen.wardNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {citizen.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>सक्रिय (Active)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>निष्क्रिय (Inactive)</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1">
                        <Link
                          to={`/citizens/${citizen.id}`}
                          title="विवरण देखें (View Details)"
                          className="inline-flex items-center p-1.5 text-slate-600 hover:text-panchayat-700 hover:bg-panchayat-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {canManage && (
                          <>
                            <Link
                              to={`/citizens/${citizen.id}?edit=true`}
                              title="संशोधित करें (Edit)"
                              className="inline-flex items-center p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleStatusToggle(citizen)}
                              disabled={statusTogglingId === citizen.id}
                              title={
                                citizen.status === 'ACTIVE'
                                  ? 'निष्क्रिय करें (Deactivate)'
                                  : 'सक्रिय करें (Activate)'
                              }
                              className={`inline-flex items-center p-1.5 rounded-lg transition ${
                                citizen.status === 'ACTIVE'
                                  ? 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                                  : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {citizen.status === 'ACTIVE' ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {citizens.map((citizen) => (
                <div key={citizen.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-full bg-panchayat-50 text-panchayat-800 font-bold text-xs flex items-center justify-center border border-panchayat-200">
                        {citizen.fullName.charAt(0)}
                      </div>
                      <div>
                        <Link
                          to={`/citizens/${citizen.id}`}
                          className="font-bold text-slate-900 text-sm hover:text-panchayat-700 transition"
                        >
                          {citizen.fullName}
                        </Link>
                        <p className="text-[11px] text-slate-500">
                          {citizen.village} • वार्ड #{citizen.wardNumber}
                        </p>
                      </div>
                    </div>

                    {citizen.status === 'ACTIVE' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        सक्रिय
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        निष्क्रिय
                      </span>
                    )}
                  </div>

                  {citizen.mobile && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{citizen.mobile}</span>
                    </div>
                  )}

                  {citizen.address && (
                    <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-lg">
                      {citizen.address}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      to={`/citizens/${citizen.id}`}
                      className="font-bold text-panchayat-700 hover:text-panchayat-800"
                    >
                      विवरण देखें (View Details) →
                    </Link>

                    {canManage && (
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/citizens/${citizen.id}?edit=true`}
                          className="p-1 text-sky-700 hover:bg-sky-50 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleStatusToggle(citizen)}
                          disabled={statusTogglingId === citizen.id}
                          className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                        >
                          {citizen.status === 'ACTIVE' ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <span>
                  पृष्ठ {page + 1} का {totalPages || 1} (कुल {totalElements} नागरिक)
                </span>
                <span className="text-slate-300">•</span>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs"
                >
                  <option value={10}>10 प्रति पृष्ठ</option>
                  <option value={15}>15 प्रति पृष्ठ</option>
                  <option value={25}>25 प्रति पृष्ठ</option>
                  <option value={50}>50 प्रति पृष्ठ</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                  id="pagination-prev-btn"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  ← पिछला (Previous)
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || isLoading}
                  id="pagination-next-btn"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  अगला (Next) →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
