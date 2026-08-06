import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, UploadCloud, UserCheck, ArrowRight, FileText } from 'lucide-react';

export const PortalLanding = () => {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-semibold text-blue-400">
            <Building2 className="w-3.5 h-3.5" />
            <span>Globex Enterprise Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Corporate Employee Operations & Resource Portal
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Welcome to the official Globex Enterprise Employee Gateway. Perform document uploads, manage employee profiles, change account credentials, and review corporate activity history.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/portal/dashboard"
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-all shadow-lg shadow-blue-600/25 flex items-center space-x-2"
            >
              <span>Access Employee Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link
              to="/login"
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium rounded-xl text-xs transition-all"
            >
              Employee Login
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit border border-blue-500/20">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Document Management</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload corporate reports, employee records, and business documentation with high-speed automated processing.
          </p>
        </div>

        <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit border border-emerald-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Employee Profile Workspace</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage personal employee information, department credentials, and workstation preferences.
          </p>
        </div>

        <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl w-fit border border-purple-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Activity History</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review login history, recent document uploads, and account changes in a clean enterprise timeline.
          </p>
        </div>
      </div>
    </div>
  );
};
