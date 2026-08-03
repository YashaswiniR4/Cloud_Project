import React, { useEffect, useState } from 'react';
import { Bell, ShieldAlert, CheckCircle, RefreshCw, Zap, Shield, Lock } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>Dispatched Alerts & Serverless Containment Remediation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time alert notifications dispatched to AWS SNS topics and automated Lambda remediation actions.
          </p>
        </div>
        <button
          onClick={fetchAlertsData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading Dispatched Alerts & Remediation Feeds..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dispatched Alerts Column */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Dispatched SNS Alerts ({alerts.length})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{alert.event_name || 'SECURITY_ALERT'}</span>
                      <SeverityBadge severity={alert.severity || 'HIGH'} />
                    </div>
                    <p className="text-xs text-slate-400">
                      Attacker IP: <span className="font-mono text-blue-400">{alert.source_ip}</span>
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                      <span>Score: {alert.threat_score}</span>
                      <span className="text-emerald-400 font-semibold">SNS DISPATCHED</span>
                    </div>
                  </div>
                ))
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
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{rem.status}</span>
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
