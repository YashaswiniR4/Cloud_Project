import React, { useEffect, useState } from 'react';
import { Bell, ShieldAlert, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { getAlerts } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      const data = await getAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
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
            <span>Dispatched SOC Alerts & Incident Stream</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time alert notifications dispatched to AWS SNS topics and automated Lambda remediation triggers.
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
        <LoadingSpinner label="Loading Incident Alerts Stream..." />
      ) : (
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-bold text-white">{alert.event_name || 'SECURITY_INCIDENT_ALERT'}</h3>
                      <SeverityBadge severity={alert.severity || 'HIGH'} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Attacker IP: <span className="font-mono text-blue-400">{alert.source_ip || '198.51.100.45'}</span> • SNS Topic: <span className="font-mono text-slate-500">{alert.sns_topic || 'arn:aws:sns:us-east-1:123456789012:SOCAlertsTopic'}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>DISPATCHED</span>
                  </span>
                  <p className="text-[10px] text-slate-500">{alert.timestamp || 'Just now'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel p-12 text-center text-slate-500 rounded-xl border border-slate-800">
              No security alerts currently dispatched.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
