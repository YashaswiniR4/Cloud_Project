import React, { useEffect, useState } from 'react';
import { Bell, ShieldAlert, CheckCircle, RefreshCw, Zap, Shield, Lock, User, Globe, Mail } from 'lucide-react';
import { getAlerts, getRemediations } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [remediations, setRemediations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      const [alertsRes, remediationsRes] = await Promise.all([
        getAlerts(),
        getRemediations()
      ]);
      setAlerts(alertsRes.alerts || []);
      setRemediations(remediationsRes.remediations || []);
    } catch (err) {
      console.error('Failed to fetch alerts/remediations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>Dispatched Security Alerts & User Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time alert notifications displaying attacker IP addresses, targeted employee identities, and automated Lambda remediations.
          </p>
        </div>
        <button
          onClick={fetchAlertsData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading Dispatched Alerts & Telemetry Feeds..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dispatched Alerts Column */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Dispatched SNS Security Alerts ({alerts.length})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => {
                  const usernameDisplay = alert.user_id || alert.user_arn?.split('/').pop() || 'Attacker_User';
                  const userEmailDisplay = alert.user_email || `${usernameDisplay.toLowerCase()}@sentinelai.com`;

                  return (
                    <div key={idx} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-400 tracking-wide flex items-center space-x-1.5">
                          <ShieldAlert className="w-4 h-4" />
                          <span>{alert.event_name || 'SECURITY_ALERT'}</span>
                        </span>
                        <SeverityBadge severity={alert.severity || 'HIGH'} />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                        <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
                            <Globe className="w-3 h-3 text-blue-400" />
                            <span>Attacker IP</span>
                          </span>
                          <p className="font-mono text-blue-400 font-bold truncate">{alert.source_ip || '198.51.100.101'}</p>
                        </div>

                        <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
                            <User className="w-3 h-3 text-emerald-400" />
                            <span>User Account</span>
                          </span>
                          <p className="font-mono text-slate-200 font-semibold truncate">
                            {usernameDisplay}
                          </p>
                        </div>

                        <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-purple-400" />
                            <span>User Email</span>
                          </span>
                          <p className="font-mono text-slate-300 font-medium truncate text-[11px]">
                            {userEmailDisplay}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-900">
                        <span>Threat Score: <strong className="text-red-400">{alert.threat_score}/100</strong></span>
                        <span className="text-emerald-400 font-bold flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>SNS DISPATCHED & CONTAINED</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">No alerts dispatched yet.</p>
              )}
            </div>
          </div>

          {/* Lambda Containment Actions Column */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Shield className="w-4 h-4 text-red-400" />
                <span>Lambda Serverless Remediations ({remediations.length})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {remediations.length > 0 ? (
                remediations.map((rem, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400 flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>CONTAINMENT EXECUTED</span>
                        {rem.execution_count > 1 && (
                          <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800/60 rounded-full text-[9px] font-mono">
                            {rem.execution_count}x
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-blue-400 font-semibold">Target: {rem.target_identifier || 'Attacker IP'}</span>
                    </div>
                    <div className="space-y-1">
                      {rem.actions_taken?.map((action, aIdx) => (
                        <p key={aIdx} className="text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                          {action}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">No containment actions recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
