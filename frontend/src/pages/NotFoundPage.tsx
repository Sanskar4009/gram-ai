import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-saffron-100 text-saffron-700 flex items-center justify-center shadow-inner">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-sm text-slate-500">
          The page or operational view you are looking for does not exist or has not been unlocked in this milestone.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 bg-panchayat-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-panchayat-800 transition shadow-sm"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
