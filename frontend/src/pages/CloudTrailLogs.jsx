import React, { useEffect, useState } from 'react';
import { FileText, Search, RefreshCw, Filter } from 'lucide-react';
import { getLogs } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const CloudTrailLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogsData = async () => {
    try {
      setLoading(true);
      const data = await getLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsData();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const search = searchTerm.toLowerCase();
    return (
      (log.event_name && log.event_name.toLowerCase().includes(search)) ||
      (log.source_ip && log.source_ip.toLowerCase().includes(search)) ||
      (log.user_arn && log.user_arn.toLowerCase().includes(search)) ||
      (log.event_id && log.event_id.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-400" />
            <span>AWS CloudTrail Ingested Telemetry Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Normalized security logs parsed from CloudTrail JSON batches delivered to S3 audit bucket.
          </p>
        </div>
        <button
          onClick={fetchLogsData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by event name, source IP, user ARN, or event ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Filter className="w-4 h-4" />
          <span>Total Records: {filteredLogs.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner label="Fetching CloudTrail Log Telemetry..." />
      ) : (
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/60 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 font-semibold">Event ID</th>
                  <th className="p-4 font-semibold">Event Name</th>
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">Source IP</th>
                  <th className="p-4 font-semibold">User Principal / ARN</th>
                  <th className="p-4 font-semibold">Severity</th>
                  <th className="p-4 font-semibold">Threat Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono text-slate-400">{log.event_id || `evt-${idx}`}</td>
                      <td className="p-4 font-bold text-white">{log.event_name || 'UnknownEvent'}</td>
                      <td className="p-4 text-slate-400">{log.event_time || 'N/A'}</td>
                      <td className="p-4 font-mono text-blue-400">{log.source_ip || '0.0.0.0'}</td>
                      <td className="p-4 font-mono text-slate-400 max-w-xs truncate">{log.user_arn || log.user_type || 'anonymous'}</td>
                      <td className="p-4">
                        <SeverityBadge severity={log.severity} />
                      </td>
                      <td className="p-4 font-semibold text-red-400">{log.threat_score || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No matching CloudTrail logs found.
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
