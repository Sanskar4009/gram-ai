import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  Server,
  LogOut,
  User as UserIcon,
  Building2,
  Users,
  UserCheck,
  LifeBuoy,
} from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';
import { useAuth } from '@/context/AuthContext';

export const RootLayout: React.FC = () => {
  const { statusState } = useHealth();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-panchayat-700 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:bg-panchayat-800 transition">
                गाँ
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">GramAI</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-panchayat-100 text-panchayat-800 border border-panchayat-200">
                    v0.5.0-M5
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  Smart Panchayat Operating System
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-3">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-panchayat-50 text-panchayat-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink
                  to="/panchayats"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-panchayat-50 text-panchayat-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Building2 className="w-4 h-4" />
                  <span>Panchayats</span>
                </NavLink>

                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-panchayat-50 text-panchayat-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </NavLink>

                {user?.role !== 'CITIZEN' && (
                  <NavLink
                    to="/citizens"
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-panchayat-50 text-panchayat-800 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Citizens</span>
                  </NavLink>
                )}

                <NavLink
                  to="/complaints"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-panchayat-50 text-panchayat-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Complaints</span>
                </NavLink>
              </>
            )}

            <NavLink
              to="/status"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-panchayat-50 text-panchayat-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Server className="w-4 h-4" />
              <span>Backend Status</span>
            </NavLink>

            {/* Quick Status Pill */}
            <div
              id="header-status-indicator"
              className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-200"
            >
              {statusState === 'checking' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                  Checking...
                </span>
              )}
              {statusState === 'online' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping"></span>
                  Online
                </span>
              )}
              {statusState === 'offline' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                  Offline
                </span>
              )}
            </div>

            {/* Authenticated User Pill / Logout */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 leading-tight">{user.fullName}</span>
                  <div className="flex items-center space-x-1.5 justify-end">
                    {user.panchayatId && (
                      <span className="text-[10px] font-semibold text-slate-500">
                        GP #{user.panchayatId} •
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-panchayat-700 uppercase tracking-wide">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  id="logout-button"
                  title="Sign Out"
                  className="inline-flex items-center space-x-1 p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition border border-slate-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-panchayat-700 text-white rounded-lg hover:bg-panchayat-800 transition shadow-sm ml-2"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-panchayat-700" />
            <span>GramAI Foundation — Milestone 4 (Citizen Registry Active)</span>
          </div>
          <div>
            <span>Non-official digital workspace for Gram Panchayat administration</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
