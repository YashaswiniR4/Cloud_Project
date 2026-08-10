import React, { useEffect, useState } from 'react';
import { Shield, RefreshCw, Lock, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { getRemediations } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Remediation = () => {
  const [remediations, setRemediations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRemediations = async () => {
    try {
      setLoading(true);
      const res = await getRemediations();
      setRemediations(res.remediations || []);
    } catch (err) {
      console.error('Failed to load remediations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemediations();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Shield className="w-6 h-6 text-red-400" />
            <span>Automated Lambda Serverless Remediations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time incident response execution engine: Revokes Security Group ingress for attacker IPs and disables compromised IAM credentials.
          </p>
        </div>
        <button
          onClick={fetchRemediations}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Actions</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading Serverless Incident Response Actions..." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Total Remediations Executed</span>
              <p className="text-2xl font-bold text-red-400">{remediations.length}</p>
              <p className="text-[10px] text-slate-500">Lambda Handlers Triggered</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Security Group IP Blocks</span>
              <p className="text-2xl font-bold text-amber-400">AUTOMATIC</p>
              <p className="text-[10px] text-slate-500">Revoked Ingress Rules</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">IAM Credential Containment</span>
              <p className="text-2xl font-bold text-emerald-400">ENFORCED</p>
              <p className="text-[10px] text-slate-500">Access Key Deactivation</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-red-400" />
              <span>Executed Serverless Remediation Logs ({remediations.length})</span>
            </h3>

            <div className="space-y-3">
              {remediations.length > 0 ? (
                remediations.map((rem, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400 flex items-center space-x-1.5">
                        <Zap className="w-4 h-4" />
                        <span>CONTAINMENT ACTION #{idx + 1}</span>
                      </span>
                      <span className="text-xs font-mono text-blue-400">Target: {rem.target_identifier || 'Attacker IP'}</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {rem.actions_taken?.map((action, aIdx) => (
                        <p key={aIdx} className="text-xs font-mono text-slate-200 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{action}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">No remediation actions executed yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
