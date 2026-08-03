import React from 'react';
import { Bell, RefreshCw, Server, ShieldCheck, Activity } from 'lucide-react';

export const Navbar = ({ onRefresh, healthStatus }) => {
  const isHealthy = healthStatus?.status === 'HEALTHY';

  return (
    <header className="glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <h2 className="text-base font-bold text-white tracking-wide">Threat Operations Center</h2>
        <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Zero Trust Active</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* System Health Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <Activity className={`w-4 h-4 ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`} />
          <span className="text-slate-400">Backend:</span>
          <span className={`font-semibold ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
            {isHealthy ? 'HEALTHY (FastAPI)' : 'OFFLINE'}
          </span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Feeds</span>
        </button>
      </div>
    </header>
  );
};
