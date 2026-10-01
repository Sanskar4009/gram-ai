import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  Phone,
  Home,
  MapPin,
  FileText,
  User,
} from 'lucide-react';
import { createCitizen } from '@/services/citizenService';
import { useAuth } from '@/context/AuthContext';

export const AddCitizenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('');
  const [wardNumber, setWardNumber] = useState<string>('1');
  const [address, setAddress] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = 'नागरिक का पूरा नाम आवश्यक है (Full name is required)';
    } else if (fullName.trim().length < 2) {
      errs.fullName = 'नाम कम से कम 2 अक्षरों का होना चाहिए (Name must be at least 2 characters)';
    }

    if (mobile.trim()) {
      const cleaned = mobile.trim();
      if (!/^[0-9]{10,15}$/.test(cleaned)) {
        errs.mobile = 'मोबाइल नंबर 10 से 15 अंकों का होना चाहिए (Mobile must be 10-15 digits)';
      }
    }

    if (!village.trim()) {
      errs.village = 'गांव का नाम आवश्यक है (Village name is required)';
    }

    const wardNum = parseInt(wardNumber, 10);
    if (isNaN(wardNum) || wardNum < 1 || wardNum > 999) {
      errs.wardNumber = 'मान्य वार्ड संख्या दर्ज करें (1 से 999) (Enter valid ward number 1-999)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const created = await createCitizen({
        fullName: fullName.trim(),
        mobile: mobile.trim() || null,
        village: village.trim(),
        wardNumber: parseInt(wardNumber, 10),
        address: address.trim() || null,
        // If user is ADMIN, default to their selected or demo GP, for Secretary server auto-resolves
        panchayatId: user?.panchayatId || undefined,
      });

      // Navigate to details page of the newly created citizen
      navigate(`/citizens/${created.id}`, {
        state: { message: `नागरिक "${created.fullName}" सफलतापूर्वक पंजीकृत किया गया।` },
      });
    } catch (err: any) {
      if (err?.data?.errors) {
        setErrors(err.data.errors);
      }
      setServerError(
        err?.message || 'नागरिक पंजीयन विफल रहा। कृपया विवरण पुनः जांचें।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header and Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/citizens"
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-panchayat-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>नागरिक सूची पर वापस जाएं (Back to Citizens)</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Card Title Banner */}
        <div className="p-6 bg-gradient-to-r from-panchayat-50 to-emerald-50/30 border-b border-slate-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-panchayat-700 text-white flex items-center justify-center shadow-sm">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              नागरिक जोड़ें (Register New Citizen)
            </h1>
            <p className="text-xs text-slate-500">
              ग्राम पंचायत निवासी पंजीयन प्रपत्र (Village resident registration form)
            </p>
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="m-6 mb-0 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">पंजीयन त्रुटि (Registration Error)</p>
              <p>{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="fullName"
              className="block text-xs sm:text-sm font-bold text-slate-700"
            >
              नागरिक का पूरा नाम (Full Name) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="उदा. रमेश कुमार / Ramesh Kumar"
                className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-panchayat-500 transition ${
                  errors.fullName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-rose-600 font-semibold">{errors.fullName}</p>
            )}
            <p className="text-[11px] text-slate-400">
              हिंदी अथवा अंग्रेजी दोनों भाषाओं में नाम दर्ज किया जा सकता है।
            </p>
          </div>

          {/* Mobile & Village row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label
                htmlFor="mobile"
                className="block text-xs sm:text-sm font-bold text-slate-700"
              >
                मोबाइल नंबर (Mobile Number)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="उदा. 9876543210 (वैकल्पिक)"
                  className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-panchayat-500 transition ${
                    errors.mobile ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.mobile && (
                <p className="text-xs text-rose-600 font-semibold">{errors.mobile}</p>
              )}
            </div>

            {/* Village */}
            <div className="space-y-1.5">
              <label
                htmlFor="village"
                className="block text-xs sm:text-sm font-bold text-slate-700"
              >
                गांव का नाम (Village) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Home className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  id="village"
                  name="village"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="उदा. रामपुर / हर्राभाट"
                  className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-panchayat-500 transition ${
                    errors.village ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.village && (
                <p className="text-xs text-rose-600 font-semibold">{errors.village}</p>
              )}
            </div>
          </div>

          {/* Duplicate / Shared Family Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2 text-[11px] sm:text-xs text-slate-600">
            <Info className="w-4 h-4 text-panchayat-700 flex-shrink-0 mt-0.5" />
            <span>
              <strong>सूचना:</strong> ग्रामीण परिवारों में एक ही मोबाइल नंबर कई सदस्यों द्वारा साझा किया जा सकता है। समान मोबाइल नंबर दर्ज करने पर भी रिकॉर्ड सुरक्षित रूप से बनाया जा सकता है।
            </span>
          </div>

          {/* Ward Number */}
          <div className="space-y-1.5">
            <label
              htmlFor="wardNumber"
              className="block text-xs sm:text-sm font-bold text-slate-700"
            >
              वार्ड संख्या (Ward Number) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="number"
                min="1"
                max="999"
                id="wardNumber"
                name="wardNumber"
                value={wardNumber}
                onChange={(e) => setWardNumber(e.target.value)}
                placeholder="वार्ड संख्या (उदा. 1, 2, 3)"
                className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-panchayat-500 transition ${
                  errors.wardNumber ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.wardNumber && (
              <p className="text-xs text-rose-600 font-semibold">{errors.wardNumber}</p>
            )}
          </div>

          {/* Residential Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="address"
              className="block text-xs sm:text-sm font-bold text-slate-700"
            >
              स्थानीय पता / मोहल्ला (Residential Address)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <textarea
                id="address"
                name="address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="मकान नंबर, गली, मोहल्ला अथवा स्थल विवरण..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-panchayat-500 focus:border-panchayat-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              संवेदनशील पहचान पत्र (जैसे आधार संख्या) यहाँ दर्ज न करें।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <Link
              to="/citizens"
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              रद्द करें (Cancel)
            </Link>

            <button
              type="submit"
              id="submit-citizen-btn"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 bg-panchayat-700 hover:bg-panchayat-800 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>सहेज रहे हैं (Saving)...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>नागरिक पंजीकृत करें (Save Citizen)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
