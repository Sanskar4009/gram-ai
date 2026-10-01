import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LifeBuoy,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  UserCheck,
  Calendar,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { getComplaints, getComplaintSummary } from '@/services/complaintService';
import {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintSummary,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from '@/types/complaint';
import { useAuth } from '@/context/AuthContext';

export const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const canCreate =
    user?.role === 'ADMIN' ||
    user?.role === 'SECRETARY' ||
    user?.role === 'GRS' ||
    user?.role === 'CITIZEN';

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [size] = useState(15);
  const [sort] = useState('createdAt,desc');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const effectivePanchayatId =
    user?.role === 'ADMIN' || !user?.panchayatId ? undefined : user.panchayatId;

  const loadSummary = useCallback(async () => {
    try {
      const sum = await getComplaintSummary(effectivePanchayatId);
      setSummary(sum);
    } catch {
      // Non-critical, ignore summary errors on dashboard cards
    }
  }, [effectivePanchayatId]);

  const loadComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getComplaints({
        panchayatId: effectivePanchayatId,
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        size,
        sort,
      });
      setComplaints(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(
        err?.message ||
          'शिकायतों की सूची लोड करने में त्रुटि हुई (Failed to load complaints)'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    debouncedSearch,
    categoryFilter,
    statusFilter,
    priorityFilter,
    fromDate,
    toDate,
    page,
    size,
    sort,
  ]);

  useEffect(() => {
    loadComplaints();
    loadSummary();
  }, [loadComplaints, loadSummary]);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const getPriorityBadge = (priority: ComplaintPriority) => {
    const meta = COMPLAINT_PRIORITIES.find((p) => p.key === priority);
    if (!meta) return null;
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${meta.badgeBg}`}
      >
        {meta.hindi} ({meta.english})
      </span>
    );
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    const meta = COMPLAINT_STATUSES[status];
    if (!meta) return null;
    return (
      <span
        className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${meta.badgeBg}`}
      >
        <span className={`w-2 h-2 rounded-full ${meta.dotColor}`}></span>
        <span>{meta.hindi}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-panchayat-100 text-panchayat-800 border border-panchayat-200">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  शिकायतें
                </h1>
                <span className="text-sm font-semibold text-slate-500">
                  (Complaints & Grievances)
                </span>
                <span className="text-xs bg-panchayat-50 text-panchayat-800 font-bold px-2 py-0.5 rounded-full border border-panchayat-200">
                  {totalElements} कुल
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ग्राम पंचायत नागरिक शिकायत पंजीकरण एवं समाधान निगरानी प्रणाली
              </p>
            </div>
          </div>
        </div>

        {canCreate && (
          <Link
            to="/complaints/new"
            id="btn-new-complaint"
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-panchayat-700 hover:bg-panchayat-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>नई शिकायत दर्ज करें (New Complaint)</span>
          </Link>
        )}
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => {
              setStatusFilter('');
              setPage(0);
            }}
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              statusFilter === ''
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">कुल शिकायतें</span>
              <Layers className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-black mt-1">{summary.total}</div>
            <span className="text-[10px] opacity-80">All Records</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('OPEN');
              setPage(0);
            }}
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'OPEN'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white hover:bg-blue-50/50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">खुली (Open)</span>
              <AlertCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-900 mt-1">{summary.open}</div>
            <span className="text-[10px] text-blue-700">कार्रवाई हेतु शेष</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('IN_PROGRESS');
              setPage(0);
            }}
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white hover:bg-amber-50/50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">प्रगति पर</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">{summary.inProgress}</div>
            <span className="text-[10px] text-amber-700">In Progress</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('WAITING');
              setPage(0);
            }}
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'WAITING'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white hover:bg-purple-50/50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-800">प्रतीक्षारत</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-900 mt-1">{summary.waiting}</div>
            <span className="text-[10px] text-purple-700">Waiting / Escalated</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('RESOLVED');
              setPage(0);
            }}
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'RESOLVED'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">समाधान</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{summary.resolved}</div>
            <span className="text-[10px] text-emerald-700">Resolved Issues</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('CLOSED');
              setPage(0);
            }}
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'CLOSED'
                ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">बंद (Closed)</span>
              <XCircle className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-slate-700 mt-1">{summary.closed}</div>
            <span className="text-[10px] text-slate-500">Verified Closed</span>
          </div>
        </div>
      )}

      {/* Search and Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="search-complaint-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="खोजें: शिकायत क्रमांक, शीर्षक, विवरण या नागरिक नाम..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panchayat-500/20 focus:border-panchayat-600 transition"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              id="category-filter-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as ComplaintCategory | '');
                setPage(0);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panchayat-500/20 focus:border-panchayat-600 transition bg-white"
            >
              <option value="">सभी श्रेणियां (All Categories)</option>
              {COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.hindi} ({cat.english})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ComplaintStatus | '');
                setPage(0);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panchayat-500/20 focus:border-panchayat-600 transition bg-white"
            >
              <option value="">सभी स्थितियां (All Statuses)</option>
              {Object.values(COMPLAINT_STATUSES).map((st) => (
                <option key={st.key} value={st.key}>
                  {st.hindi} ({st.english})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              id="priority-filter-select"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as ComplaintPriority | '');
                setPage(0);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panchayat-500/20 focus:border-panchayat-600 transition bg-white"
            >
              <option value="">सभी प्राथमिकताएं (All Priorities)</option>
              {COMPLAINT_PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.hindi} ({p.english})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>दिनांक सीमा (Date Range):</span>
            </span>
            <input
              type="date"
              id="from-date-input"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-panchayat-500"
            />
            <span className="text-slate-400">से (to)</span>
            <input
              type="date"
              id="to-date-input"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-panchayat-500"
            />
          </div>

          {(searchInput || categoryFilter || statusFilter || priorityFilter || fromDate || toDate) && (
            <button
              onClick={handleResetFilters}
              id="btn-reset-filters"
              className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-900 transition font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>फ़िल्टर रीसेट करें (Clear Filters)</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadComplaints}
            className="text-xs underline font-bold hover:text-rose-900"
          >
            पुनः प्रयास करें (Retry)
          </button>
        </div>
      )}

      {/* Complaints Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 mx-auto text-panchayat-700 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">
              शिकायतें लोड हो रही हैं... (Loading complaints...)
            </p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                कोई शिकायत नहीं मिली (No Complaints Found)
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                वर्तमान फ़िल्टर या खोज मानदंड के अनुसार कोई शिकायत रिकॉर्ड उपलब्ध नहीं है।
              </p>
            </div>
            {canCreate && (
              <Link
                to="/complaints/new"
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-panchayat-50 text-panchayat-800 hover:bg-panchayat-100 text-xs font-bold transition border border-panchayat-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>नई शिकायत दर्ज करें</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm" id="complaints-table">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">शिकायत क्रमांक (No.)</th>
                  <th className="py-3 px-4">नागरिक (Citizen)</th>
                  <th className="py-3 px-4">श्रेणी (Category)</th>
                  <th className="py-3 px-4">शीर्षक एवं विवरण (Title)</th>
                  <th className="py-3 px-4">प्राथमिकता (Priority)</th>
                  <th className="py-3 px-4">स्थिति (Status)</th>
                  <th className="py-3 px-4">असाइन (Assigned)</th>
                  <th className="py-3 px-4">दर्ज दिनांक (Created)</th>
                  <th className="py-3 px-4 text-right">कार्रवाई (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4 font-mono font-bold text-panchayat-800 whitespace-nowrap">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="hover:underline flex items-center space-x-1.5"
                      >
                        <span>{c.complaintNumber}</span>
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {c.citizenName || `नागरिक #${c.citizenId}`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.citizenVillage ? `${c.citizenVillage}` : ''}
                        {c.citizenWardNumber ? ` (वार्ड ${c.citizenWardNumber})` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {c.categoryHindi || c.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">
                        {c.title}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {c.description}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPriorityBadge(c.priority)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(c.status)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      {c.assignedToName ? (
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <UserCheck className="w-3.5 h-3.5 text-panchayat-700" />
                          <span className="font-medium">{c.assignedToName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">अनिर्दिष्ट (Unassigned)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('hi-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-panchayat-800 bg-panchayat-50 hover:bg-panchayat-100 transition border border-panchayat-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>विवरण</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && totalElements > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              पृष्ठ <strong>{page + 1}</strong> of <strong>{totalPages || 1}</strong> • कुल{' '}
              <strong>{totalElements}</strong> शिकायतें
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                id="btn-prev-page"
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                पिछला (Previous)
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                id="btn-next-page"
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                अगला (Next)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
