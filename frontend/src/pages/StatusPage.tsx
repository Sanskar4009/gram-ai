import React from 'react';
import { RefreshCw, CheckCircle, XCircle, Loader2, Server, Database } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';
import { API_BASE_URL } from '@/lib/apiClient';

export const StatusPage: React.FC = () => {
  const { statusState, data, error, isFetching, refetch } = useHealth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Connectivity &amp; Status</h1>
        <p className="text-sm text-slate-500">
          Verify real-time communication between the React frontend and Spring Boot backend.
        </p>
      </div>

      {/* Main Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Backend Status</h2>
                <p className="text-xs text-slate-500 font-mono">
                  Endpoint: {API_BASE_URL}/health
                </p>
              </div>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Check Again</span>
            </button>
          </div>

          {/* Status Display Badge */}
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            {statusState === 'checking' && (
              <div className="space-y-3">
                <div className="inline-flex p-4 rounded-full bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <div>
                  <h3 id="backend-status-text" className="text-xl font-bold text-amber-700">
                    Checking...
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Contacting Spring Boot backend at {API_BASE_URL}/health
                  </p>
                </div>
              </div>
            )}

            {statusState === 'online' && (
              <div className="space-y-3">
                <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 id="backend-status-text" className="text-xl font-bold text-emerald-700">
                    Backend Online
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Spring Boot backend is active and responding with status 200 OK.
                  </p>
                </div>
              </div>
            )}

            {statusState === 'offline' && (
              <div className="space-y-3">
                <div className="inline-flex p-4 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  <XCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 id="backend-status-text" className="text-xl font-bold text-rose-700">
                    Backend Offline
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Unable to connect to backend service. Ensure Spring Boot is running on port 8080.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Response Payload */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Diagnostic Payload</span>
              <span className="font-mono text-[11px] text-slate-500">
                HTTP {statusState === 'online' ? '200 OK' : statusState === 'offline' ? 'CONNECTION_REFUSED' : 'PENDING'}
              </span>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto font-mono text-[11px] leading-relaxed">
              {statusState === 'online' && JSON.stringify(data, null, 2)}
              {statusState === 'offline' &&
                JSON.stringify(
                  {
                    status: 'DOWN',
                    error: error instanceof Error ? error.message : 'Network error or backend unreachable',
                    service: 'gramai-backend',
                    targetUrl: `${API_BASE_URL}/health`,
                  },
                  null,
                  2
                )}
              {statusState === 'checking' &&
                JSON.stringify({ status: 'PENDING', message: 'Awaiting response...' }, null, 2)}
            </pre>
          </div>
        </div>

        {/* Database Connectivity Note */}
        <div className="bg-slate-50/70 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-panchayat-700" />
            <span>Database: PostgreSQL 16 connection configured via environment variables</span>
          </div>
          <span className="font-semibold text-slate-700">GramAI M1</span>
        </div>
      </div>
    </div>
  );
};
