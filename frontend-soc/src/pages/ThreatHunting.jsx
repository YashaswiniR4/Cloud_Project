import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, Terminal, Play, CheckCircle } from 'lucide-react';
import { getLogs, getThreats } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ThreatHunting = () => {
  const [logs, setLogs] = useState([]);
  const [threats, setThreats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHuntingData = async () => {
    try {
      setLoading(true);
      const [logsRes, threatsRes] = await Promise.all([getLogs(), getThreats()]);
      setLogs(logsRes.logs || []);
      setThreats(threatsRes.threats || []);
    } catch (err) {
      console.error('Failed to load threat hunting telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHuntingData();
  }, []);

  const filteredLogs = logs.filter(l => 
    !searchQuery || 
    (l.event_name && l.event_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.source_ip && l.source_ip.includes(searchQuery)) ||
    (l.user_id && l.user_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Search className="w-6 h-6 text-cyan-400" />
            <span>Threat Hunting & Query Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Proactively search CloudTrail telemetry, Honeypot probes, and IP threat intelligence feeds for indicators of compromise (IOCs).
          </p>
        </div>
      </div>

      {/* Query Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
        <Terminal className="w-5 h-5 text-cyan-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Event (e.g. RCE_WEBSHELL_UPLOAD, AttachUserPolicy), IP (e.g. 198.51.100.45), or Username..."
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={fetchHuntingData}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Execute Query</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Running Threat Hunting Search Index..." />
      ) : (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Matched IOC Telemetry Results ({filteredLogs.length})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="pb-3 pt-2 font-medium">Event Name</th>
                  <th className="pb-3 pt-2 font-medium">Source IP</th>
                  <th className="pb-3 pt-2 font-medium">Target User</th>
                  <th className="pb-3 pt-2 font-medium">Threat Score</th>
                  <th className="pb-3 pt-2 font-medium">Severity</th>
                  <th className="pb-3 pt-2 font-medium text-right">IOC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-mono text-cyan-300 font-semibold">{log.event_name || 'EVENT'}</td>
                      <td className="py-2.5 font-mono text-blue-400">{log.source_ip || '198.51.100.101'}</td>
                      <td className="py-2.5 text-slate-200">{log.user_id || 'Attacker_User'}</td>
                      <td className="py-2.5 font-bold text-red-400">{log.threat_score || 85} / 100</td>
                      <td className="py-2.5 text-slate-300 font-medium">{log.severity || 'HIGH'}</td>
                      <td className="py-2.5 text-right font-mono text-emerald-400 text-[11px]">
                        <span className="inline-flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" />
                          <span>ANALYZED</span>
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No matching telemetry events found for query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
