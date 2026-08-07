import React, { useEffect, useState } from 'react';
import { ShieldAlert, Globe, Server, RefreshCw, AlertTriangle } from 'lucide-react';
import { getThreats } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ThreatIntel = () => {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchThreatsData = async () => {
    try {
      setLoading(true);
      const data = await getThreats();
      setThreats(data.threats || []);
    } catch (err) {
      console.error('Failed to fetch threats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatsData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            <span>Threat Intelligence Feed & Malicious Actors</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated threat indicators, malicious IP reputational scores, and zero-trust policy violations.
          </p>
        </div>
        <button
          onClick={fetchThreatsData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Feeds</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Querying Threat Intelligence Feed..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {threats.length > 0 ? (
            threats.map((threat, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-white">{threat.source_ip || '198.51.100.45'}</span>
                  </div>
                  <SeverityBadge severity={threat.severity || 'HIGH'} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Event Category</span>
                    <span className="font-semibold text-slate-200">{threat.event_name || threat.threat_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Threat Score</span>
                    <span className="font-bold text-red-400">{threat.threat_score} / 100</span>
                  </div>
                </div>

                {threat.threat_intel && (
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-1 text-xs">
                    <p className="font-semibold text-amber-400 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Reputation: {threat.threat_intel.category}</span>
                    </p>
                    <p className="text-slate-400 text-[11px]">ISP / ASN: {threat.threat_intel.isp || 'Known Malicious Botnet'}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-2 glass-panel p-12 text-center text-slate-500 rounded-xl border border-slate-800">
              No active malicious threat actors currently flagged.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
