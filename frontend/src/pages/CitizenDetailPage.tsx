import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Home,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  LifeBuoy,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getCitizenById, updateCitizen, updateCitizenStatus } from '@/services/citizenService';
import { Citizen, CitizenStatus } from '@/types/citizen';
import { useAuth } from '@/context/AuthContext';

export const CitizenDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'SECRETARY';

  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Success message passed from AddCitizenPage or status update
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as any)?.message || null
  );

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editWardNumber, setEditWardNumber] = useState<string>('');
  const [editAddress, setEditAddress] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Check URL query param ?edit=true to open modal automatically
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === 'true' && canManage) {
      setIsEditing(true);
    }
  }, [location.search, canManage]);

  const loadCitizen = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCitizenById(parseInt(id, 10));
      setCitizen(data);
      // Initialize edit fields
      setEditFullName(data.fullName);
      setEditMobile(data.mobile || '');
      setEditVillage(data.village);
      setEditWardNumber(data.wardNumber.toString());
      setEditAddress(data.address || '');
    } catch (err: any) {
      setError(
        err?.message || 'नागरिक विवरण लोड करने में विफलता (Failed to load citizen details)'
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCitizen();
  }, [loadCitizen]);

  const handleStatusToggle = async () => {
    if (!citizen || !canManage) return;
    const nextStatus: CitizenStatus = citizen.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionHindi = nextStatus === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय';

    const confirmed = window.confirm(
      `क्या आप नागरिक "${citizen.fullName}" को ${actionHindi} करना चाहते हैं?\n(Are you sure you want to change status to ${nextStatus}?)`
    );
    if (!confirmed) return;

    try {
      const updated = await updateCitizenStatus(citizen.id, nextStatus);
      setCitizen(updated);
      setSuccessMessage(`नागरिक की स्थिति सफलतापूर्वक ${actionHindi} की गई।`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'स्थिति अपडेट करने में त्रुटि हुई');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen || !canManage) return;

    const errs: Record<string, string> = {};
    if (!editFullName.trim()) {
      errs.fullName = 'पूरा नाम आवश्यक है (Full name is required)';
    }
    if (!editVillage.trim()) {
      errs.village = 'गांव का नाम आवश्यक है (Village name is required)';
    }
    const wardNum = parseInt(editWardNumber, 10);
    if (isNaN(wardNum) || wardNum < 1 || wardNum > 999) {
      errs.wardNumber = 'मान्य वार्ड संख्या दर्ज करें (Valid ward number required)';
    }
    if (editMobile.trim() && !/^[0-9]{10,15}$/.test(editMobile.trim())) {
      errs.mobile = 'मोबाइल नंबर 10 से 15 अंकों का होना चाहिए';
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setIsSubmittingEdit(true);
    setEditErrors({});

    try {
      const updated = await updateCitizen(citizen.id, {
        fullName: editFullName.trim(),
        mobile: editMobile.trim() || null,
        village: editVillage.trim(),
        wardNumber: wardNum,
        address: editAddress.trim() || null,
      });

      setCitizen(updated);
      setIsEditing(false);
      setSuccessMessage('नागरिक विवरण सफलतापूर्वक संशोधित किए गए (Citizen updated successfully).');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setEditErrors({ form: err?.message || 'संशोधन विफल रहा (Update failed)' });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-panchayat-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          नागरिक विवरण लोड हो रहा है (Loading citizen details)...
        </p>
      </div>
    );
  }

  if (error || !citizen) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="text-base sm:text-lg font-bold text-rose-900">
          नागरिक नहीं मिला (Citizen Not Found)
        </h2>
        <p className="text-xs sm:text-sm text-rose-700 max-w-md mx-auto">
          {error || 'अनुरोधित नागरिक रिकॉर्ड उपलब्ध नहीं है अथवा आपको इसे देखने की अनुमति नहीं है।'}
        </p>
        <Link
          to="/citizens"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-rose-300 text-rose-800 text-xs sm:text-sm font-semibold rounded-xl hover:bg-rose-100 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>नागरिक सूची पर वापस जाएं (Back to List)</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/citizens"
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-panchayat-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>नागरिक पंजी (Citizen Registry)</span>
        </Link>

        {canManage && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              id="edit-citizen-btn"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5 text-panchayat-700" />
              <span>संशोधित करें (Edit Details)</span>
            </button>

            <button
              onClick={handleStatusToggle}
              id="status-toggle-btn"
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm ${
                citizen.status === 'ACTIVE'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {citizen.status === 'ACTIVE' ? (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>निष्क्रिय करें (Deactivate)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>सक्रिय करें (Activate)</span>
                </>
              )}
            </button>
          </div>
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

      {/* Citizen Profile Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-panchayat-100 text-panchayat-800 font-black text-xl flex items-center justify-center border border-panchayat-200 shadow-sm">
              {citizen.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight" id="citizen-name-title">
                  {citizen.fullName}
                </h1>
                {citizen.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                    सक्रिय (Active)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
                    निष्क्रिय (Inactive)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                पंजीकरण कोड: <strong>CIT-GP{citizen.panchayatId}-{citizen.id}</strong> • ग्राम पंचायत {citizen.panchayatName || `#${citizen.panchayatId}`}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <Phone className="w-3.5 h-3.5 text-panchayat-700" />
              <span>मोबाइल नंबर (Mobile)</span>
            </div>
            <p className="text-sm font-bold text-slate-900" id="detail-mobile">
              {citizen.mobile || 'दर्ज नहीं (Not Provided)'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <Home className="w-3.5 h-3.5 text-panchayat-700" />
              <span>गांव का नाम (Village)</span>
            </div>
            <p className="text-sm font-bold text-slate-900" id="detail-village">
              {citizen.village}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-panchayat-700" />
              <span>वार्ड संख्या (Ward)</span>
            </div>
            <p className="text-sm font-bold text-slate-900" id="detail-ward">
              वार्ड क्रमांक {citizen.wardNumber}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5 text-panchayat-700" />
              <span>स्थानीय आवासीय पता (Address)</span>
            </div>
            <p className="text-sm font-medium text-slate-800 leading-relaxed" id="detail-address">
              {citizen.address || 'विशिष्ट पता उपलब्ध नहीं है।'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <Building2 className="w-3.5 h-3.5 text-panchayat-700" />
              <span>संबद्ध पंचायत (Panchayat)</span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {citizen.panchayatName || `GP #${citizen.panchayatId}`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>पंजीकरण तिथि (Created At)</span>
            </div>
            <p className="text-xs font-medium text-slate-700">
              {new Date(citizen.createdAt).toLocaleString('hi-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>अंतिम अद्यतन (Last Updated)</span>
            </div>
            <p className="text-xs font-medium text-slate-700">
              {new Date(citizen.updatedAt).toLocaleString('hi-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Placeholders for Future Modules (Complaints, Documents, Scheme Applications) */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-panchayat-700" />
          <h2 className="text-base font-bold text-slate-900">
            नागरिक संबद्ध मॉड्यूल (Linked Modules)
          </h2>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold border border-slate-200">
            आगामी सुविधाएं
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Complaints Module Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center space-x-2">
                <LifeBuoy className="w-4 h-4 text-panchayat-700" />
                <span>शिकायतें (Complaints)</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                Active (M5)
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              इस नागरिक द्वारा दर्ज शिकायतें, समाधान स्थिति, एवं शिकायत क्रमांक इतिहास।
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <Link
                to={`/complaints/new?citizenId=${citizen.id}`}
                id="btn-citizen-new-complaint"
                className="inline-flex items-center space-x-1 text-xs font-bold text-panchayat-800 bg-panchayat-50 hover:bg-panchayat-100 px-2.5 py-1.5 rounded-lg border border-panchayat-200 transition"
              >
                <span>नई शिकायत दर्ज करें</span>
              </Link>
              <Link
                to={`/complaints?citizenId=${citizen.id}`}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1.5 transition"
              >
                <span>सूची देखें →</span>
              </Link>
            </div>
          </div>

          {/* Documents Placeholder */}
          <div className="p-5 rounded-2xl bg-white border border-dashed border-slate-300 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>दस्तावेज़ (Documents)</span>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-200">
                Milestone 6
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              राशन कार्ड, समग्र आईडी, जॉब कार्ड एवं प्रमाण पत्र प्रतिलिपियों का सुरक्षित संग्रह।
            </p>
            <p className="text-[11px] font-semibold text-panchayat-700">
              आने वाले मॉड्यूल में उपलब्ध (Coming in Milestone 6)
            </p>
          </div>

          {/* Schemes Placeholder */}
          <div className="p-5 rounded-2xl bg-white border border-dashed border-slate-300 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>योजना आवेदन (Schemes)</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold border border-slate-200">
                भविष्य
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              पीएम आवास, लाड़ली बहना, पेंशन आदि सरकारी योजनाओं के लिए पात्रता एवं आवेदन विवरण।
            </p>
            <p className="text-[11px] font-semibold text-panchayat-700">
              आने वाले मॉड्यूल में उपलब्ध (Coming in future module)
            </p>
          </div>
        </div>
      </div>

      {/* Edit Citizen Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-panchayat-700" />
                <h3 className="text-base font-bold text-slate-900">
                  नागरिक विवरण संपादित करें (Edit Citizen)
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {editErrors.form && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {editErrors.form}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="editFullName" className="block text-xs font-bold text-slate-700 mb-1">
                  पूरा नाम (Full Name) *
                </label>
                <input
                  type="text"
                  id="editFullName"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-panchayat-500"
                />
                {editErrors.fullName && (
                  <p className="text-xs text-rose-600 mt-1">{editErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="editMobile" className="block text-xs font-bold text-slate-700 mb-1">
                    मोबाइल (Mobile)
                  </label>
                  <input
                    type="tel"
                    id="editMobile"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-panchayat-500"
                  />
                  {editErrors.mobile && (
                    <p className="text-xs text-rose-600 mt-1">{editErrors.mobile}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="editVillage" className="block text-xs font-bold text-slate-700 mb-1">
                    गांव (Village) *
                  </label>
                  <input
                    type="text"
                    id="editVillage"
                    value={editVillage}
                    onChange={(e) => setEditVillage(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-panchayat-500"
                  />
                  {editErrors.village && (
                    <p className="text-xs text-rose-600 mt-1">{editErrors.village}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="editWardNumber" className="block text-xs font-bold text-slate-700 mb-1">
                  वार्ड संख्या (Ward Number) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  id="editWardNumber"
                  value={editWardNumber}
                  onChange={(e) => setEditWardNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-panchayat-500"
                />
                {editErrors.wardNumber && (
                  <p className="text-xs text-rose-600 mt-1">{editErrors.wardNumber}</p>
                )}
              </div>

              <div>
                <label htmlFor="editAddress" className="block text-xs font-bold text-slate-700 mb-1">
                  स्थानीय आवासीय पता (Address)
                </label>
                <textarea
                  rows={2}
                  id="editAddress"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-panchayat-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-panchayat-700 hover:bg-panchayat-800 disabled:opacity-50 rounded-xl shadow-sm transition"
                >
                  {isSubmittingEdit ? 'सहेज रहे हैं...' : 'संशोधन सहेजें (Save Changes)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
