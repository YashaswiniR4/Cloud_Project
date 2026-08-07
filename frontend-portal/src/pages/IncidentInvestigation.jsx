import React, { useEffect, useState } from 'react';
import { 
  GitCommit, ShieldAlert, CheckCircle2, Clock, MapPin, Cpu, Lock, 
  ArrowRight, ShieldCheck, FileText, AlertTriangle, Eye, Loader2 
} from 'lucide-react';
import { getIncidents } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const IncidentInvestigation = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const fetchIncidentsData = async () => {
    try {
      setLoading(true);
      const res = await getIncidents();
      setIncidents(res.incidents || []);
      if (res.incidents && res.incidents.length > 0) {
        setSelectedIncident(res.incidents[0]);
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentsData();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading Incident Investigation Timelines..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
            <GitCommit className="w-3.5 h-3.5" />
            <span>SOC Incident Response & Investigation</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Incident Progression Timeline</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Inspect end-to-end incident timelines tracking malicious activity from initial employee portal breach to ML detection, SHAP explainability, and Lambda serverless containment.
          </p>
        </div>
        <div className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-right">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Incidents</p>
          <p className="text-xs font-bold text-blue-400">{incidents.length} Recorded</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Incidents List */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Investigated Incidents</span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {incidents.map((inc) => (
              <div
                key={inc.incident_id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedIncident?.incident_id === inc.incident_id
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 font-mono">{inc.incident_id}</span>
                  <SeverityBadge severity={inc.severity} />
                </div>
                <h4 className="text-xs font-semibold text-slate-200 mt-2 line-clamp-1">{inc.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">Source IP: {inc.source_ip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Visual Step-by-Step Timeline */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          {selectedIncident ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-blue-400 font-bold">{selectedIncident.incident_id}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedIncident.title}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">Source IP: {selectedIncident.source_ip} | Target: {selectedIncident.user_arn || 'Corporate Portal'}</p>
                </div>
                <div className="text-right">
                  <SeverityBadge severity={selectedIncident.severity} />
                  <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">Status: {selectedIncident.status}</p>
                </div>
              </div>

              {/* Vertical Step Progression */}
              <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
                {(selectedIncident.steps || []).map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Circle Node Marker */}
                    <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-slate-950 border-2 border-blue-500 flex items-center justify-center text-[10px] font-bold text-blue-400">
                      {step.step || idx + 1}
                    </div>

                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{step.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{step.timestamp || 'Real-time'}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Select an incident from the left panel to inspect its visual progression timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
