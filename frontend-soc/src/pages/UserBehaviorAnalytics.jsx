import React, { useEffect, useState } from 'react';
import { UserCheck, RefreshCw, ShieldAlert, Globe, Monitor, MapPin, User, AlertTriangle } from 'lucide-react';
import { getUBAProfiles } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const UserBehaviorAnalytics = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUBAData = async () => {
    try {
      setLoading(true);
      const res = await getUBAProfiles();
      setProfiles(res.profiles || []);
    } catch (err) {
      console.error('Failed to fetch UBA profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUBAData();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-purple-400" />
            <span>User Behavior Analytics (UBA) Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitors employee access baselines, flags geographic anomalies, impossible travel, and device shifts.
          </p>
        </div>
        <button
          onClick={fetchUBAData}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl text-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh UBA Baselines</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Analyzing User Behavioral Profiles & Baselines..." />
      ) : (
        <div className="space-y-6">
          {/* UBA Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Total User Profiles</span>
              <p className="text-2xl font-bold text-white">{profiles.length}</p>
              <p className="text-[10px] text-slate-500">Tracked Behavioral Baselines</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Geographic Anomalies</span>
              <p className="text-2xl font-bold text-amber-400">
                {profiles.reduce((acc, p) => acc + (p.anomaly_count || 0), 0)}
              </p>
              <p className="text-[10px] text-slate-500">Cross-border shifts detected</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Behavioral Risk Status</span>
              <p className="text-2xl font-bold text-emerald-400">ACTIVE MONITORING</p>
              <p className="text-[10px] text-slate-500">Zero-Day UBA Scoring Engine</p>
            </div>
          </div>

          {/* User Profiles Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <User className="w-4 h-4 text-purple-400" />
              <span>Behavioral Baseline Profiles ({profiles.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                  <tr>
                    <th className="pb-3 pt-2 font-medium">User Account</th>
                    <th className="pb-3 pt-2 font-medium">Usual Location</th>
                    <th className="pb-3 pt-2 font-medium">Usual Device</th>
                    <th className="pb-3 pt-2 font-medium">Last Login IP</th>
                    <th className="pb-3 pt-2 font-medium">Last Login Country</th>
                    <th className="pb-3 pt-2 font-medium">Logins</th>
                    <th className="pb-3 pt-2 font-medium text-right">Anomalies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {profiles.length > 0 ? (
                    profiles.map((prof, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-mono font-semibold text-purple-400 flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{prof.user_id}</span>
                        </td>
                        <td className="py-3 text-slate-300">
                          {prof.usual_city}, {prof.usual_country}
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-[11px]">{prof.usual_device}</td>
                        <td className="py-3 font-mono text-blue-400">{prof.last_login_ip || '198.51.100.45'}</td>
                        <td className="py-3 text-slate-300">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${prof.last_login_country !== prof.usual_country ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-900 text-slate-300'}`}>
                            {prof.last_login_country || prof.usual_country}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-300">{prof.total_logins}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${prof.anomaly_count > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {prof.anomaly_count || 0} Anomalies
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No UBA profiles recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
