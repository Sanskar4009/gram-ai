import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  FileText,
  IndianRupee,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  LifeBuoy,
} from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';
import { useAuth } from '@/context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { statusState, data } = useHealth();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role !== 'CITIZEN';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-panchayat-800 to-panchayat-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-panchayat-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-panchayat-700/60 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Milestone 5 — Complaint Management Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            GramAI Smart Panchayat Work Assistant
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Welcome to GramAI. Multi-tenant administrative scoping, role-based access control,
            Panchayat directory, Citizen Registry, and complete citizen complaint grievance management are active.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isStaff && (
              <>
                <Link
                  to="/complaints"
                  id="dashboard-complaints-btn"
                  className="inline-flex items-center space-x-2 bg-white text-panchayat-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition shadow-sm"
                >
                  <LifeBuoy className="w-4 h-4 text-panchayat-700" />
                  <span>शिकायतें (Complaints)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/citizens"
                  id="dashboard-citizens-btn"
                  className="inline-flex items-center space-x-2 bg-panchayat-700/80 hover:bg-panchayat-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-panchayat-600"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>नागरिक पंजी (Citizens)</span>
                </Link>
              </>
            )}
            <Link
              to="/panchayats"
              className="inline-flex items-center space-x-2 bg-panchayat-700/80 hover:bg-panchayat-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-panchayat-600"
            >
              <Building2 className="w-4 h-4" />
              <span>Explore Panchayats</span>
            </Link>
            <Link
              to="/users"
              className="inline-flex items-center space-x-2 bg-panchayat-700/80 hover:bg-panchayat-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-panchayat-600"
            >
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </Link>
            <span className="text-xs text-emerald-200/80 bg-panchayat-950/40 px-3 py-2 rounded-lg border border-emerald-500/20">
              API Status: <strong className="text-white uppercase">{statusState}</strong> {data?.service && `(${data.service})`}
            </span>
          </div>
        </div>
      </section>

      {/* Active Governance Modules Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Active Governance Modules</h2>
          <p className="text-xs text-slate-500">Core operational capabilities through Milestone 5</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Complaints Module Card */}
          <Link
            to="/complaints"
            id="active-module-complaints-card"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-panchayat-400 hover:shadow-md transition space-y-2 block"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <LifeBuoy className="w-5 h-5 text-blue-700" />
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Active (M5)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-panchayat-700 transition">
              शिकायत निवारण (Complaints)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Grievance registration, unique CMP numbers, staff assignment, resolution tracking, and audit history.
            </p>
          </Link>

          {/* Citizen Registry Module Card */}
          {isStaff && (
            <Link
              to="/citizens"
              id="active-module-citizens-card"
              className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-panchayat-400 hover:shadow-md transition space-y-2 block"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-panchayat-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5 text-panchayat-700" />
                </div>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Active (M4)
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-panchayat-700 transition">
                नागरिक पंजी (Citizen Registry)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Village resident directory, Hindi names, ward allocation, mobile directory, and status lifecycle.
              </p>
            </Link>
          )}

          <Link
            to="/panchayats"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-panchayat-400 hover:shadow-md transition space-y-2 block"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-panchayat-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5 text-panchayat-700" />
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-panchayat-700 transition">
              Panchayat Directory
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAdmin
                ? 'Create, edit, search, and safely deactivate Gram Panchayat administrative units.'
                : 'View assigned Gram Panchayat jurisdictional metadata and official codes.'}
            </p>
          </Link>

          <Link
            to="/users"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-panchayat-400 hover:shadow-md transition space-y-2 block"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-sky-700" />
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-panchayat-700 transition">
              User Management
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Role-aware staff provisioning, temporary credential assignment, and account activation controls.
            </p>
          </Link>
        </div>
      </section>

      {/* Upcoming Modules Roadmap Preview */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Upcoming Domain Modules</h2>
          <p className="text-xs text-slate-500">To be implemented sequentially in upcoming milestones</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl space-y-2 opacity-75">
            <div className="flex items-center justify-between">
              <FileText className="w-5 h-5 text-slate-500" />
              <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Milestone 6</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Document Engine</h4>
            <p className="text-xs text-slate-500">Document storage, indexing, and digital certificate archives.</p>
          </div>

          <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl space-y-2 opacity-75">
            <div className="flex items-center justify-between">
              <FileText className="w-5 h-5 text-slate-500" />
              <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Milestone 6</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Document Engine</h4>
            <p className="text-xs text-slate-500">Document storage, indexing, and digital certificate archives.</p>
          </div>

          <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl space-y-2 opacity-75">
            <div className="flex items-center justify-between">
              <IndianRupee className="w-5 h-5 text-slate-500" />
              <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Milestone 9</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Cash Book Ledger</h4>
            <p className="text-xs text-slate-500">Financial receipt and voucher calculations.</p>
          </div>

          <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl space-y-2 opacity-75">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-slate-500" />
              <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Milestone 7</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Gram Sabha</h4>
            <p className="text-xs text-slate-500">Meeting agendas, minutes, and citizen attendance.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
