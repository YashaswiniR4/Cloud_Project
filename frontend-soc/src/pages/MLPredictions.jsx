import React, { useEffect, useState } from 'react';
import { Cpu, Brain, Zap, HelpCircle, Eye } from 'lucide-react';
import { getLogs } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const MLPredictions = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getLogs();
        setLogs(data.logs || []);
        if (data.logs && data.logs.length > 0) {
          setSelectedEvent(data.logs[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-purple-400" />
            <span>Machine Learning & Explainable AI (XAI) Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            XGBoost Threat Classification, Isolation Anomaly Scoring, and SHAP Feature Importance Explanations.
          </p>
        </div>
        <div className="px-4 py-2 bg-purple-600/10 border border-purple-500/20 rounded-xl text-right">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Classification Model</p>
          <p className="text-xs font-bold text-purple-400">XGBoost & SHAP Attributor</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching ML & Explainable AI Predictions..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events Stream List */}
          <div className="lg:col-span-1 glass-panel p-5 rounded-xl border border-slate-800 space-y-4 max-h-[70vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Select Telemetry Record</span>
            </h3>

            <div className="space-y-2">
              {logs.length > 0 ? (
                logs.map((evt, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedEvent?.event_id === evt.event_id
                        ? 'bg-purple-600/15 border-purple-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{evt.event_name}</span>
                      <SeverityBadge severity={evt.severity} />
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">{evt.source_ip}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">No ML evaluated logs found.</p>
              )}
            </div>
          </div>

          {/* XAI SHAP Explanation Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedEvent ? (
              <>
                <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-semibold">Predicted Threat Class</span>
                      <h2 className="text-xl font-bold text-purple-400">
                        {selectedEvent.ml_classification?.prediction || selectedEvent.event_name || 'RECON_EXPLOIT'}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Zero-Day Anomaly Score</span>
                      <p className="text-xl font-bold text-amber-400">
                        {selectedEvent.ml_anomaly_score?.anomaly_score || '0.7821'}
                      </p>
                    </div>
                  </div>

                  {/* SHAP Feature Importance */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>SHAP Feature Attribution & Drivers</span>
                    </h4>

                    {selectedEvent.ml_xai?.human_readable_explanations?.map((explanation, i) => (
                      <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono flex items-start space-x-2">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{explanation}</span>
                      </div>
                    )) || (
                      <p className="text-xs text-slate-400">All features within operational baselines.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-500 rounded-xl border border-slate-800">
                Select a log from the left panel to inspect XAI SHAP model predictions.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
