import React, { useEffect, useState } from 'react';
import { Crosshair, Terminal, Server, RefreshCw, Activity, ShieldCheck } from 'lucide-react';
import { getDashboardData } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Honeypots = () => {
  const [honeypotData, setHoneypotData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHoneypotData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardData();
      setHoneypotData(data.honeypot_summary || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoneypotData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Crosshair className="w-6 h-6 text-cyan-400" />
            <span>Deception Engine & Honeypot Traps</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cowrie Docker SSH Honeypot (Port 2222) and Python HTTP Trap Server (Port 80) capturing attack payloads in real time.
          </p>
        </div>
        <button
          onClick={fetchHoneypotData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Trap Telemetry</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Querying Deception Engine Status..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cowrie SSH Honeypot */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cowrie SSH Trap</h3>
                  <p className="text-xs text-slate-400">Docker Containerized SSH Deception Engine</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${honeypotData.ssh_honeypot_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'}`}>
                {honeypotData.ssh_honeypot_active ? 'ONLINE (Port 2222)' : 'OFFLINE'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Captured Attacks</span>
                <span className="font-bold text-white">{honeypotData.ssh_logs_count || 0}</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Target Container</span>
                <span className="font-mono text-cyan-400">cowrie/cowrie:latest</span>
              </div>
              <div className="flex justify-between text-xs py-2">
                <span className="text-slate-400">AWS EC2 Security Group</span>
                <span className="font-mono text-slate-300">sg-0a1b2c3d4e5f6789a</span>
              </div>
            </div>
          </div>

          {/* HTTP Web Honeypot */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">HTTP Web Trap</h3>
                  <p className="text-xs text-slate-400">Web Exploit & Recon Probe Deception Engine</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${honeypotData.http_honeypot_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'}`}>
                {honeypotData.http_honeypot_active ? 'ONLINE (Port 80)' : 'OFFLINE'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Captured Attacks</span>
                <span className="font-bold text-white">{honeypotData.http_logs_count || 0}</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Detection Modules</span>
                <span className="font-mono text-purple-400">SQLi, RCE, Config Exposure</span>
              </div>
              <div className="flex justify-between text-xs py-2">
                <span className="text-slate-400">CloudWatch Log Stream</span>
                <span className="font-mono text-slate-300">/aws/honeypot/telemetry</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
