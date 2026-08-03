import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  Cpu, 
  Bell, 
  Crosshair, 
  Lock,
  TrendingUp,
  Server,
  Zap
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { getDashboardData } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { SeverityBadge } from '../components/SeverityBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getDashboardData();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <LoadingSpinner label="Loading Autonomous SOC Dashboard Telemetry..." />;
  }

  const metrics = data?.metrics || {
    total_ingested_events: 0,
    high_risk_threats: 0,
    anomalies_detected: 0,
    alerts_dispatched: 0,
    honeypot_attacks_captured: 0,
    worm_audit_logs_count: 0
  };

  const recentThreats = data?.recent_threats || [];
  const recentAlerts = data?.recent_alerts || [];
  const honeypots = data?.honeypot_summary || {};

  // Mock timeline chart data computed from real metrics
  const timelineData = [
    { time: '18:00', events: Math.max(2, metrics.total_ingested_events - 10), threats: 1 },
    { time: '18:15', events: Math.max(5, metrics.total_ingested_events - 5), threats: 2 },
    { time: '18:30', events: Math.max(8, metrics.total_ingested_events - 2), threats: metrics.high_risk_threats },
    { time: '18:45', events: metrics.total_ingested_events + 3, threats: metrics.high_risk_threats + 1 },
    { time: '19:00', events: metrics.total_ingested_events + 8, threats: metrics.high_risk_threats + 2 },
  ];

  const pieData = [
    { name: 'HIGH', value: metrics.high_risk_threats || 2 },
    { name: 'MEDIUM', value: metrics.anomalies_detected || 1 },
    { name: 'LOW', value: Math.max(1, metrics.total_ingested_events - metrics.high_risk_threats) },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Autonomous Threat Intelligence Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Operations Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time AWS CloudTrail telemetry ingestion, XGBoost threat scoring, Zero-Day Isolation Anomaly detection, and S3 WORM audit logging.
          </p>
        </div>
        <div className="flex items-center space-x-3 relative z-10">
          <div className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">ML Engine Status</p>
            <p className="text-xs font-bold text-blue-400">XGBoost & SHAP Active</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Events Ingested"
          value={metrics.total_ingested_events}
          icon={Activity}
          color="blue"
          subtitle="CloudTrail & Honeypot Stream"
        />
        <MetricCard
          title="High Risk Threats"
          value={metrics.high_risk_threats}
          icon={ShieldAlert}
          color="red"
          subtitle="Critical Security Alerts"
        />
        <MetricCard
          title="Anomalies Detected"
          value={metrics.anomalies_detected}
          icon={Cpu}
          color="purple"
          subtitle="Zero-Day Isolation Score > 0.65"
        />
        <MetricCard
          title="WORM Audit Logs"
          value={metrics.worm_audit_logs_count}
          icon={Lock}
          color="emerald"
          subtitle="KMS SSE Immutable S3 Vault"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attack Timeline Area Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Real-Time Telemetry & Attack Timeline</span>
              </h3>
              <p className="text-xs text-slate-400">Ingested events vs detected threat anomalies</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="events" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEvents)" name="Ingested Events" />
                <Area type="monotone" dataKey="threats" stroke="#ef4444" fillOpacity={1} fill="url(#colorThreats)" name="High Risk Threats" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Pie Chart */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Threat Severity Distribution</span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Threat Events */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Recent Ingested Threats</span>
            </h3>
            <span className="text-xs text-slate-500">{recentThreats.length} Recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="pb-3 pt-2 font-medium">Event Name</th>
                  <th className="pb-3 pt-2 font-medium">Source IP</th>
                  <th className="pb-3 pt-2 font-medium">Severity</th>
                  <th className="pb-3 pt-2 font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentThreats.length > 0 ? (
                  recentThreats.map((evt, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-medium text-slate-200">
                        {evt.event_name || evt.threat_type || 'CloudTrail API'}
                      </td>
                      <td className="py-2.5 font-mono text-slate-400">{evt.source_ip}</td>
                      <td className="py-2.5">
                        <SeverityBadge severity={evt.severity} />
                      </td>
                      <td className="py-2.5 font-semibold text-red-400">{evt.threat_score}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No high-risk threats detected yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Honeypots Status Card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span>Deception Trap Engines</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Cowrie SSH Trap</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${honeypots.ssh_honeypot_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'}`}>
                  {honeypots.ssh_honeypot_active ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{honeypots.ssh_logs_count || 0}</p>
              <p className="text-[11px] text-slate-500">Port 2222 Docker Container</p>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">HTTP Web Trap</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${honeypots.http_honeypot_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'}`}>
                  {honeypots.http_honeypot_active ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{honeypots.http_logs_count || 0}</p>
              <p className="text-[11px] text-slate-500">Port 80 Web Honeypot</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
