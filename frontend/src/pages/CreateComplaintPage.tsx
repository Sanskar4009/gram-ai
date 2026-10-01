import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Tag,
  Clock,
  UserCheck,
} from 'lucide-react';
import { createComplaint } from '@/services/complaintService';
import { getCitizens } from '@/services/citizenService';
import { getUsers } from '@/services/userService';
import { Citizen } from '@/types/citizen';
import { ManagedUser } from '@/types/user';
import {
  ComplaintCategory,
  ComplaintPriority,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
} from '@/types/complaint';
import { useAuth } from '@/context/AuthContext';

export const CreateComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCitizenId = searchParams.get('citizenId')
    ? parseInt(searchParams.get('citizenId')!, 10)
    : undefined;

  const { user } = useAuth();

  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [citizenId, setCitizenId] = useState<number | ''>(
    initialCitizenId || ''
  );
  const [category, setCategory] = useState<ComplaintCategory>('WATER');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdComplaintNumber, setCreatedComplaintNumber] = useState<string | null>(null);

  useEffect(() => {
    async function loadLookups() {
      setLoadingLookups(true);
      try {
        const effectivePanchayatId =
          user?.role === 'ADMIN' || !user?.panchayatId ? undefined : user.panchayatId;
        const [citizensRes, usersRes] = await Promise.all([
          getCitizens({
            panchayatId: effectivePanchayatId,
            status: 'ACTIVE',
            size: 100,
          }),
          getUsers({
            panchayatId: effectivePanchayatId,
            size: 50,
          }),
        ]);
        setCitizens(citizensRes.content);
        setUsers(usersRes.content.filter((u) => u.active));
      } catch (err) {
        console.error('Failed to load lookup data', err);
      } finally {
        setLoadingLookups(false);
      }
    }

    loadLookups();
  }, [user]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!citizenId) {
      errs.citizenId = 'कृपया शिकायतकर्ता नागरिक का चयन करें (Please select a citizen)';
    }
    if (!category) {
      errs.category = 'कृपया शिकायत की श्रेणी चुनें (Please select a category)';
    }
    if (!title.trim()) {
      errs.title = 'शिकायत का शीर्षक अनिवार्य है (Title is required)';
    } else if (title.trim().length > 255) {
      errs.title = 'शीर्षक 255 अक्षरों से अधिक नहीं हो सकता';
    }
    if (!description.trim()) {
      errs.description = 'शिकायत का विवरण अनिवार्य है (Description is required)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const created = await createComplaint({
        citizenId: Number(citizenId),
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedTo: assignedTo ? Number(assignedTo) : undefined,
        panchayatId: user?.role === 'ADMIN' ? user.panchayatId || 1 : undefined,
      });

      setCreatedComplaintNumber(created.complaintNumber);

      // Redirect after showing the success state
      setTimeout(() => {
        navigate(`/complaints/${created.id}`);
      }, 1500);
    } catch (err: any) {
      setErrors({ form: err?.message || 'शिकायत दर्ज करने में त्रुटि हुई' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-2 border-b border-slate-200">
        <Link
          to="/complaints"
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              नई शिकायत दर्ज करें
            </h1>
            <span className="text-xs bg-panchayat-100 text-panchayat-800 font-bold px-2 py-0.5 rounded-full border border-panchayat-200">
              New Complaint
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            ग्राम पंचायत नागरिक शिकायत पंजिका में नवीन प्रविष्टि जोड़ें
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {createdComplaintNumber && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 animate-fadeIn shadow-sm">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>शिकायत सफलतापूर्वक दर्ज की गई! (Complaint Registered)</span>
          </div>
          <p className="text-xs text-emerald-800 pl-7">
            शिकायत क्रमांक:{' '}
            <strong className="font-mono text-sm underline">
              {createdComplaintNumber}
            </strong>
            । विवरण पृष्ठ पर भेजा जा रहा है...
          </p>
        </div>
      )}

      {/* Form Error Banner */}
      {errors.form && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
      >
        {/* Citizen Selection */}
        <div className="space-y-1.5">
          <label
            htmlFor="citizen-select"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
          >
            नागरिक (Complainant Citizen) <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              id="citizen-select"
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value ? Number(e.target.value) : '')}
              disabled={loadingLookups}
              className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-panchayat-500/20 focus:border-panchayat-600 transition ${
                errors.citizenId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            >
              <option value="">
                {loadingLookups
                  ? 'नागरिक लोड हो रहे हैं...'
                  : '-- नागरिक चुनें (Select Registered Citizen) --'}
              </option>
              {citizens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} — {c.village} (वार्ड {c.wardNumber}){c.mobile ? ` | 📱 ${c.mobile}` : ''}
                </option>
              ))}
            </select>
          </div>
          {errors.citizenId ? (
            <p className="text-[11px] text-rose-600 font-semibold">{errors.citizenId}</p>
          ) : (
            <p className="text-[11px] text-slate-500">
              केवल ग्राम पंचायत के पंजीकृत नागरिक सूची से चयन करें। नया नागरिक जोड़ने के लिए{' '}
              <Link to="/citizens/new" className="text-panchayat-700 font-semibold underline">
                यहाँ क्लिक करें
              </Link>
              ।
            </p>
          )}
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label
              htmlFor="category-select"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
            >
              श्रेणी (Category) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-panchayat-500/20 focus:border-panchayat-600 transition"
              >
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.hindi} ({cat.english})
                  </option>
                ))}
              </select>
            </div>
            {errors.category && (
              <p className="text-[11px] text-rose-600 font-semibold">{errors.category}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label
              htmlFor="priority-select"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
            >
              प्राथमिकता (Priority)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                id="priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-panchayat-500/20 focus:border-panchayat-600 transition"
              >
                {COMPLAINT_PRIORITIES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.hindi} ({p.english})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label
            htmlFor="complaint-title-input"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
          >
            शीर्षक (Complaint Title) <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            id="complaint-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="उदा. पुराने कुएं के पास पेयजल पाइपलाइन रिसाव"
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-panchayat-500/20 focus:border-panchayat-600 transition ${
              errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
            }`}
          />
          {errors.title && (
            <p className="text-[11px] text-rose-600 font-semibold">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label
            htmlFor="complaint-desc-input"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
          >
            विवरण (Detailed Description) <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <textarea
              id="complaint-desc-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="समस्या का स्थान, प्रभाव एवं विवरण विस्तार से दर्ज करें..."
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-panchayat-500/20 focus:border-panchayat-600 transition ${
                errors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
          </div>
          {errors.description && (
            <p className="text-[11px] text-rose-600 font-semibold">{errors.description}</p>
          )}
        </div>

        {/* Optional Staff Assignment (If Secretary or Admin) */}
        {(user?.role === 'ADMIN' || user?.role === 'SECRETARY') && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label
              htmlFor="assignee-select"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
            >
              प्रारंभिक असाइनमेंट (Assign To Staff - Optional)
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                id="assignee-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : '')}
                className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-panchayat-500/20 focus:border-panchayat-600 transition"
              >
                <option value="">-- बाद में असाइन करें (Unassigned) --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              शिकायत जांच अथवा निवारण हेतु पंचायत स्टाफ (जैसे GRS) को तुरंत सौंपा जा सकता है।
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Link
            to="/complaints"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            रद्द करें (Cancel)
          </Link>
          <button
            type="submit"
            id="btn-submit-complaint"
            disabled={isSubmitting || !!createdComplaintNumber}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-panchayat-700 hover:bg-panchayat-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSubmitting ? 'पंजीकृत हो रही है...' : 'शिकायत दर्ज करें (Register Complaint)'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
