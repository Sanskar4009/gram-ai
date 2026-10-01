import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to destination or dashboard
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      // Safe error display preventing user enumeration
      setErrorMessage(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFieldErrors({});
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-panchayat-700 text-white items-center justify-center font-bold text-2xl shadow-lg">
            गाँ
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            GramAI Staff Portal
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Smart Panchayat Operating System — Sign in to access your administrative dashboard
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md space-y-5">
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start space-x-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span id="login-error-text">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. secretary@gramai.in"
                  className={`block w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border ${
                    fieldErrors.email
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-panchayat-600 focus:ring-panchayat-600/20'
                  } focus:outline-none focus:ring-2 transition bg-slate-50/50`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-rose-600 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border ${
                    fieldErrors.password
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-panchayat-600 focus:ring-panchayat-600/20'
                  } focus:outline-none focus:ring-2 transition bg-slate-50/50`}
                />
              </div>
              {fieldErrors.password && (
                <p className="text-rose-600 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-panchayat-700 hover:bg-panchayat-800 text-white font-semibold text-sm rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Development Quick-Fill Badges */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-panchayat-600" />
              <span>Dev Credentials (RBAC Quick-Fill):</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('secretary@gramai.in', 'Secretary@123')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-panchayat-100 text-slate-700 hover:text-panchayat-900 border border-slate-200 transition text-[11px]"
              >
                Secretary
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@gramai.in', 'Admin@123')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-panchayat-100 text-slate-700 hover:text-panchayat-900 border border-slate-200 transition text-[11px]"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sarpanch@gramai.in', 'Sarpanch@123')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-panchayat-100 text-slate-700 hover:text-panchayat-900 border border-slate-200 transition text-[11px]"
              >
                Sarpanch
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('grs@gramai.in', 'Grs@12345')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-panchayat-100 text-slate-700 hover:text-panchayat-900 border border-slate-200 transition text-[11px]"
              >
                GRS
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('citizen@gramai.in', 'Citizen@123')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-panchayat-100 text-slate-700 hover:text-panchayat-900 border border-slate-200 transition text-[11px]"
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('inactive@gramai.in', 'Inactive@123')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition text-[11px]"
                title="Test inactive account rejection"
              >
                Inactive (Test)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
