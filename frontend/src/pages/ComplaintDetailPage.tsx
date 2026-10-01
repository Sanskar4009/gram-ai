import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  User,
  UserCheck,
  Tag,
  FileText,
  MapPin,
  Phone,
  Edit2,
  RotateCcw,
  CheckSquare,
  History,
} from 'lucide-react';
import {
  getComplaintById,
  getComplaintHistory,
  updateComplaint,
  updateComplaintStatus,
  assignComplaint,
  resolveComplaint,
  closeComplaint,
} from '@/services/complaintService';
import { getUsers } from '@/services/userService';
import {
  Complaint,
  ComplaintHistory,
  ComplaintCategory,
  ComplaintPriority,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from '@/types/complaint';
import { ManagedUser } from '@/types/user';
import { useAuth } from '@/context/AuthContext';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const complaintId = id ? parseInt(id, 10) : 0;
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintHistory[]>([]);
  const [staffUsers, setStaffUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<number | ''>('');
  const [assignNote, setAssignNote] = useState('');

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingRemarks, setClosingRemarks] = useState('');

  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [waitingNote, setWaitingNote] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<ComplaintCategory>('WATER');
  const [editPriority, setEditPriority] = useState<ComplaintPriority>('MEDIUM');

  const [actionLoading, setActionLoading] = useState(false);

  const isSecretary = user?.role === 'SECRETARY';
  const isAdmin = user?.role === 'ADMIN';
  const isGrs = user?.role === 'GRS';
  const canAssignOrClose = isAdmin || isSecretary;
  const canUpdateStatus = isAdmin || isSecretary || isGrs;
  const canEdit = isAdmin || isSecretary;

  const loadData = useCallback(async () => {
    if (!complaintId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [compRes, histRes] = await Promise.all([
        getComplaintById(complaintId),
        getComplaintHistory(complaintId),
      ]);
      setComplaint(compRes);
      setHistory(histRes);
      setEditTitle(compRes.title);
      setEditDescription(compRes.description);
      setEditCategory(compRes.category);
      setEditPriority(compRes.priority);
      setSelectedAssignee(compRes.assignedTo || '');
    } catch (err: any) {
      setError(
        err?.message ||
          'शिकायत विवरण लोड करने में त्रुटि हुई (Failed to load complaint details)'
      );
    } finally {
      setIsLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load staff users for assignment
  useEffect(() => {
    async function loadStaff() {
      if (!user) return;
      try {
        const res = await getUsers({
          panchayatId: (user.role === 'ADMIN' || !user.panchayatId) ? undefined : user.panchayatId,
          size: 50,
        });
        setStaffUsers(res.content.filter((u) => u.active));
      } catch (e) {
        console.error('Failed to load staff list', e);
      }
    }
    if (canAssignOrClose) {
      loadStaff();
    }
  }, [user, canAssignOrClose]);

  // Actions
  const handleStartWork = async () => {
    if (!complaint) return;
    setActionLoading(true);
    try {
      const updated = await updateComplaintStatus(complaint.id, {
        status: 'IN_PROGRESS',
        note: 'कार्य प्रारंभ किया गया (Work started)',
      });
      setComplaint(updated);
      setSuccessMessage('शिकायत की स्थिति "कार्य प्रगति पर" में परिवर्तित की गई।');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'स्थिति अपडेट करने में त्रुटि हुई');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setActionLoading(true);
    try {
      const updated = await assignComplaint(complaint.id, {
        assignedTo: selectedAssignee ? Number(selectedAssignee) : null,
        note: assignNote.trim() || undefined,
      });
      setComplaint(updated);
      setShowAssignModal(false);
      setSuccessMessage('शिकायत सफलतापूर्वक असाइन की गई।');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'असाइन करने में त्रुटि हुई');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWaitingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setActionLoading(true);
    try {
      const updated = await updateComplaintStatus(complaint.id, {
        status: 'WAITING',
        note: waitingNote.trim() || 'उच्च स्तर पर मार्गदर्शन/संसाधन प्रतीक्षारत',
      });
      setComplaint(updated);
      setShowWaitingModal(false);
      setSuccessMessage('शिकायत "प्रतीक्षारत" स्थिति में चिह्नित की गई।');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'स्थिति अपडेट करने में त्रुटि हुई');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeWork = async () => {
    if (!complaint) return;
    setActionLoading(true);
    try {
      const updated = await updateComplaintStatus(complaint.id, {
        status: 'IN_PROGRESS',
        note: 'कार्य पुनः प्रगति पर किया गया (Resumed work)',
      });
      setComplaint(updated);
      setSuccessMessage('शिकायत पर कार्य पुनः प्रारंभ किया गया।');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'स्थिति अपडेट करने में त्रुटि हुई');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    if (!resolutionText.trim()) {
      alert('कृपया समाधान विवरण दर्ज करें (Resolution note is required)');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await resolveComplaint(complaint.id, {
        resolution: resolutionText.trim(),
        additionalNotes: resolveNotes.trim() || undefined,
      });
      setComplaint(updated);
      setShowResolveModal(false);
      setSuccessMessage('शिकायत का समाधान दर्ज किया गया।');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'समाधान दर्ज करने में त्रुटि हुई');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    setActionLoading(true);
    try {
      const updated = await closeComplaint(complaint.id, {
        closingRemarks: closingRemarks.trim() || undefined,
      });
      setComplaint(updated);
      setShowCloseModal(false);
      setSuccessMessage('शिकायत सफलतापूर्वक बंद की गई (Complaint Closed)।');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'शिकायत बंद करने में त्रुटि हुई');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    setActionLoading(true);
    try {
      const updated = await updateComplaintStatus(complaint.id, {
        status: 'REJECTED',
        note: rejectReason.trim() || 'अमान्य अथवा अधिकार क्षेत्र से बाहर',
      });
      setComplaint(updated);
      setShowRejectModal(false);
      setSuccessMessage('शिकायत अस्वीकृत की गई (Complaint Rejected)।');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'अस्वीकृत करने में त्रुटि हुई');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      alert('शीर्षक एवं विवरण अनिवार्य हैं');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await updateComplaint(complaint.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        priority: editPriority,
      });
      setComplaint(updated);
      setShowEditModal(false);
      setSuccessMessage('शिकायत विवरण सफलतापूर्वक संशोधित किया गया।');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'संशोधन में त्रुटि हुई');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-3">
        <RotateCcw className="w-8 h-8 mx-auto text-panchayat-700 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          शिकायत विवरण लोड हो रहा है... (Loading details...)
        </p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto text-rose-600" />
        <h2 className="text-lg font-bold text-slate-800">
          {error || 'शिकायत नहीं मिली (Complaint Not Found)'}
        </h2>
        <Link
          to="/complaints"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-panchayat-50 text-panchayat-800 hover:bg-panchayat-100 font-bold text-xs transition border border-panchayat-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>शिकायत सूची पर लौटें</span>
        </Link>
      </div>
    );
  }

  const statusMeta = COMPLAINT_STATUSES[complaint.status];
  const priorityMeta = COMPLAINT_PRIORITIES.find((p) => p.key === complaint.priority);
  const categoryMeta = COMPLAINT_CATEGORIES.find((c) => c.key === complaint.category);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Link
            to="/complaints"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                {complaint.complaintNumber}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                • {complaint.panchayatName || `पंचायत #${complaint.panchayatId}`}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {complaint.title}
            </h1>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowEditModal(true)}
            id="btn-edit-complaint"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>संशोधित करें (Edit)</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 font-bold hover:text-emerald-900 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status & Priority Badge Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Indicator */}
          <div
            id="status-display-badge"
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold border ${statusMeta.badgeBg}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusMeta.dotColor}`}></span>
            <span>{statusMeta.hindi}</span>
            <span className="opacity-75 font-normal">({statusMeta.english})</span>
          </div>

          {/* Priority Indicator */}
          {priorityMeta && (
            <div
              id="priority-display-badge"
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${priorityMeta.badgeBg}`}
            >
              <span>प्राथमिकता: {priorityMeta.hindi} ({priorityMeta.english})</span>
            </div>
          )}

          {/* Category Indicator */}
          {categoryMeta && (
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Tag className="w-3 h-3 text-slate-500" />
              <span>{categoryMeta.hindi} ({categoryMeta.english})</span>
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* OPEN actions */}
          {complaint.status === 'OPEN' && canUpdateStatus && (
            <>
              <button
                onClick={handleStartWork}
                disabled={actionLoading}
                id="btn-start-work"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>कार्य प्रारंभ करें (Start Work)</span>
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                id="btn-reject-complaint"
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>अस्वीकृत करें (Reject)</span>
              </button>
            </>
          )}

          {/* IN_PROGRESS actions */}
          {complaint.status === 'IN_PROGRESS' && canUpdateStatus && (
            <>
              <button
                onClick={() => setShowResolveModal(true)}
                disabled={actionLoading}
                id="btn-resolve-complaint"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>समाधान दर्ज करें (Resolve)</span>
              </button>

              <button
                onClick={() => setShowWaitingModal(true)}
                disabled={actionLoading}
                id="btn-mark-waiting"
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>प्रतीक्षारत करें (Mark Waiting)</span>
              </button>
            </>
          )}

          {/* WAITING actions */}
          {complaint.status === 'WAITING' && canUpdateStatus && (
            <>
              <button
                onClick={handleResumeWork}
                disabled={actionLoading}
                id="btn-resume-work"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>पुनः प्रारंभ करें (Resume)</span>
              </button>

              <button
                onClick={() => setShowResolveModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>समाधान दर्ज करें</span>
              </button>
            </>
          )}

          {/* RESOLVED actions */}
          {complaint.status === 'RESOLVED' && (
            <>
              {canAssignOrClose && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  disabled={actionLoading}
                  id="btn-close-complaint"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>शिकायत बंद करें (Close Complaint)</span>
                </button>
              )}

              {canUpdateStatus && (
                <button
                  onClick={handleResumeWork}
                  disabled={actionLoading}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>पुनः खोलें (Reopen to In Progress)</span>
                </button>
              )}
            </>
          )}

          {/* Assign button available for Secretary/Admin */}
          {canAssignOrClose && complaint.status !== 'CLOSED' && complaint.status !== 'REJECTED' && (
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={actionLoading}
              id="btn-assign-modal"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-panchayat-50 text-panchayat-800 hover:bg-panchayat-100 text-xs font-bold border border-panchayat-200 transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{complaint.assignedTo ? 'पुनः असाइन करें' : 'स्टाफ असाइन करें'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details + Complainant Citizen Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Complaint Narrative & Resolution */}
        <div className="md:col-span-2 space-y-6">
          {/* Narrative Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <FileText className="w-4 h-4 text-panchayat-700" />
              <span>शिकायत का विवरण (Complaint Description)</span>
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">दर्ज दिनांक (Created)</span>
                <span className="font-semibold text-slate-700">
                  {new Date(complaint.createdAt).toLocaleString('hi-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">अंतिम अद्यतन (Updated)</span>
                <span className="font-semibold text-slate-700">
                  {new Date(complaint.updatedAt).toLocaleString('hi-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              {complaint.resolvedAt && (
                <div>
                  <span className="text-slate-400 block text-[11px]">समाधान दिनांक (Resolved)</span>
                  <span className="font-semibold text-emerald-700">
                    {new Date(complaint.resolvedAt).toLocaleString('hi-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Card (if present) */}
          {complaint.resolution && (
            <div
              id="resolution-display-card"
              className="bg-emerald-50/60 rounded-2xl border border-emerald-200 p-6 space-y-3 shadow-sm"
            >
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>समाधान विवरण (Resolution Report)</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-emerald-200/60 text-emerald-950 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {complaint.resolution}
              </div>
              {complaint.resolvedAt && (
                <p className="text-[11px] text-emerald-700">
                  समाधान दर्ज: {new Date(complaint.resolvedAt).toLocaleString('hi-IN')}
                </p>
              )}
            </div>
          )}

          {/* Activity History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <History className="w-4 h-4 text-panchayat-700" />
              <span>गतिविधि एवं इतिहास (Activity Timeline)</span>
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic">कोई इतिहास उपलब्ध नहीं है।</p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {history.map((h) => (
                  <div key={h.id} className="relative group">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-panchayat-600 ring-4 ring-white"></span>
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-bold text-slate-800">{h.action}</span>
                        {h.performedByName && (
                          <span className="text-slate-500 font-medium">
                            द्वारा: {h.performedByName} ({h.performedByRole || 'Staff'})
                          </span>
                        )}
                      </div>
                      {h.details && (
                        <p className="text-xs text-slate-600 leading-normal">{h.details}</p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        {new Date(h.createdAt).toLocaleString('hi-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Citizen Info & Assignment Info */}
        <div className="space-y-6">
          {/* Citizen Complainant Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
                <User className="w-4 h-4 text-panchayat-700" />
                <span>शिकायतकर्ता नागरिक</span>
              </h3>
              <Link
                to={`/citizens/${complaint.citizenId}`}
                className="text-[11px] text-panchayat-700 font-bold hover:underline"
              >
                प्रोफ़ाइल देखें →
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">नाम (Name)</span>
                <span className="font-bold text-slate-900 text-sm">
                  {complaint.citizenName || `नागरिक ID #${complaint.citizenId}`}
                </span>
              </div>

              {complaint.citizenMobile && (
                <div className="flex items-center space-x-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{complaint.citizenMobile}</span>
                </div>
              )}

              {complaint.citizenVillage && (
                <div className="flex items-center space-x-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    ग्राम: {complaint.citizenVillage}
                    {complaint.citizenWardNumber ? ` (वार्ड ${complaint.citizenWardNumber})` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Staff Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <UserCheck className="w-4 h-4 text-panchayat-700" />
              <span>प्रभारी कर्मचारी (Assigned Official)</span>
            </h3>

            {complaint.assignedToName ? (
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 block text-[11px]">असाइन किया गया अधिकारी</span>
                <div className="font-bold text-slate-900 text-sm">
                  {complaint.assignedToName}
                </div>
                {complaint.assignedToRole && (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-panchayat-100 text-panchayat-800 border border-panchayat-200">
                    {complaint.assignedToRole}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic space-y-2">
                <p>वर्तमान में कोई कर्मचारी असाइन नहीं है।</p>
                {canAssignOrClose && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="text-panchayat-700 font-bold underline text-xs"
                  >
                    स्टाफ असाइन करें
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                शिकायत असाइन करें (Assign Complaint)
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  अधिकारी चुनें (Select Staff)
                </label>
                <select
                  value={selectedAssignee}
                  onChange={(e) =>
                    setSelectedAssignee(e.target.value ? Number(e.target.value) : '')
                  }
                  id="modal-assignee-select"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panchayat-500"
                >
                  <option value="">-- अनिर्दिष्ट रखें (Unassign) --</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  निर्देश / टिप्पणी (Optional Note)
                </label>
                <input
                  type="text"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="उदा. कृपया 2 दिन में मौके पर जाकर जांचें"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panchayat-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  id="btn-confirm-assign"
                  className="px-4 py-2 rounded-xl bg-panchayat-700 hover:bg-panchayat-800 text-white text-xs font-bold shadow-md"
                >
                  {actionLoading ? 'सहेज रहे हैं...' : 'असाइन करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>समाधान दर्ज करें (Record Resolution)</span>
              </h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  निवारण / समाधान विवरण (Resolution Note) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  id="resolution-note-textarea"
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="समस्या के समाधान हेतु की गई कार्रवाई विस्तार से दर्ज करें (उदा. नई मोटर फिट की गई, पाइपलाइन वेल्डिंग पूर्ण)..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  अतिरिक्त टिप्पणी (Additional Remarks - Optional)
                </label>
                <input
                  type="text"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="उदा. ग्रामीण पंचों की उपस्थिति में परीक्षण किया गया"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !resolutionText.trim()}
                  id="btn-confirm-resolve"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md"
                >
                  {actionLoading ? 'सहेज रहे हैं...' : 'समाधान पूर्ण करें (Mark Resolved)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-slate-700" />
                <span>शिकायत बंद करें (Close Complaint)</span>
              </h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              इस शिकायत का समाधान सत्यापित हो चुका है। क्या आप इसे अंतिम रूप से बंद करना चाहते हैं?
            </p>

            <form onSubmit={handleCloseSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  समापन टिप्पणी (Closing Remarks - Optional)
                </label>
                <input
                  type="text"
                  id="closing-remarks-input"
                  value={closingRemarks}
                  onChange={(e) => setClosingRemarks(e.target.value)}
                  placeholder="उदा. सचिव द्वारा मौका मुआयना उपरांत बंद"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  id="btn-confirm-close"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md"
                >
                  {actionLoading ? 'प्रक्रियाधीन...' : 'शिकायत बंद करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Mark Waiting Modal */}
      {showWaitingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>प्रतीक्षारत चिह्नित करें (Mark Waiting)</span>
              </h3>
              <button
                onClick={() => setShowWaitingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWaitingSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  प्रतीक्षा का कारण (Waiting Reason)
                </label>
                <textarea
                  rows={3}
                  id="waiting-reason-textarea"
                  value={waitingNote}
                  onChange={(e) => setWaitingNote(e.target.value)}
                  placeholder="उदा. जनपद पंचायत से अतिरिक्त सामग्री अथवा बजट आवंटन की प्रतीक्षा है..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWaitingModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  id="btn-confirm-waiting"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
                >
                  {actionLoading ? 'अपडेट हो रहा है...' : 'प्रतीक्षारत करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>शिकायत अस्वीकृत करें (Reject Complaint)</span>
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  अस्वीकृति का कारण (Rejection Reason)
                </label>
                <textarea
                  rows={3}
                  id="reject-reason-textarea"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="उदा. यह मामला पंचायत अधिकार क्षेत्र का नहीं है अथवा तथ्य असत्य पाए गए..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  id="btn-confirm-reject"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
                >
                  {actionLoading ? 'प्रक्रियाधीन...' : 'अस्वीकृत करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-panchayat-700" />
                <span>शिकायत विवरण संशोधित करें (Edit Complaint)</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  शीर्षक (Title)
                </label>
                <input
                  type="text"
                  required
                  id="edit-title-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panchayat-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    श्रेणी (Category)
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ComplaintCategory)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                  >
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.hindi}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    प्राथमिकता (Priority)
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as ComplaintPriority)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                  >
                    {COMPLAINT_PRIORITIES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.hindi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  विवरण (Description)
                </label>
                <textarea
                  rows={4}
                  required
                  id="edit-desc-textarea"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panchayat-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  id="btn-confirm-edit"
                  className="px-4 py-2 rounded-xl bg-panchayat-700 hover:bg-panchayat-800 text-white text-xs font-bold shadow-md"
                >
                  {actionLoading ? 'सहेज रहे हैं...' : 'संशोधन सुरक्षित करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
