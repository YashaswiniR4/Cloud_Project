import React, { useState } from 'react';
import { Play, X, ShieldAlert, Terminal, Server } from 'lucide-react';
import { simulateCloudTrailLog, simulateSSHAttack, simulateHTTPAttack } from '../services/api';

export const AttackSimulationModal = ({ isOpen, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('cloudtrail');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Form states
  const [cloudtrailEvent, setCloudtrailEvent] = useState('AttachUserPolicy');
  const [cloudtrailIp, setCloudtrailIp] = useState('198.51.100.45');
  const [cloudtrailArn, setCloudtrailArn] = useState('arn:aws:iam::123456789012:user/attacker');

  const [sshIp, setSshIp] = useState('198.51.100.99');
  const [sshUser, setSshUser] = useState('root');
  const [sshPassword, setSshPassword] = useState('password123');

  const [httpIp, setHttpIp] = useState('203.0.113.88');
  const [httpPath, setHttpPath] = useState('/admin');
  const [httpMethod, setHttpMethod] = useState('POST');
  const [httpPayload, setHttpPayload] = useState("' OR '1'='1");

  if (!isOpen) return null;

  const handleSimulateCloudTrail = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await simulateCloudTrailLog({
        Records: [
          {
            eventID: `sim-${Date.now()}`,
            eventName: cloudtrailEvent,
            eventTime: new Date().toISOString(),
            eventSource: 'iam.amazonaws.com',
            sourceIPAddress: cloudtrailIp,
            userIdentity: { type: 'IAMUser', arn: cloudtrailArn },
            errorCode: cloudtrailEvent === 'AccessDenied' ? 'AccessDenied' : None
          }
        ]
      });
      setResult(res);
      onRefresh();
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSSH = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await simulateSSHAttack({
        source_ip: sshIp,
        username: sshUser,
        password: sshPassword
      });
      setResult(res);
      onRefresh();
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateHTTP = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await simulateHTTPAttack({
        source_ip: httpIp,
        path: httpPath,
        method: httpMethod,
        payload: httpPayload
      });
      setResult(res);
      onRefresh();
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Trigger Cyber Attack Simulation</h3>
              <p className="text-xs text-slate-400">Inject raw attack vectors into pipeline & honeypots</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/30 px-6 pt-3 space-x-4">
          <button
            onClick={() => setActiveTab('cloudtrail')}
            className={`flex items-center space-x-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cloudtrail' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>CloudTrail IAM Vector</span>
          </button>
          <button
            onClick={() => setActiveTab('ssh')}
            className={`flex items-center space-x-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ssh' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Cowrie SSH Trap</span>
          </button>
          <button
            onClick={() => setActiveTab('http')}
            className={`flex items-center space-x-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'http' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>HTTP Trap</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'cloudtrail' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">API Event Name</label>
                <select
                  value={cloudtrailEvent}
                  onChange={(e) => setCloudtrailEvent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="AttachUserPolicy">AttachUserPolicy (IAM Escalation - High Risk)</option>
                  <option value="StopLogging">StopLogging (Evasion Attack - High Risk)</option>
                  <option value="AuthorizeSecurityGroupIngress">AuthorizeSecurityGroupIngress (Net Ingress - High Risk)</option>
                  <option value="CreateAccessKey">CreateAccessKey (Persistence - High Risk)</option>
                  <option value="DescribeInstances">DescribeInstances (Recon - Low Risk)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source IP Address</label>
                  <input
                    type="text"
                    value={cloudtrailIp}
                    onChange={(e) => setCloudtrailIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">User Identity ARN</label>
                  <input
                    type="text"
                    value={cloudtrailArn}
                    onChange={(e) => setCloudtrailArn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleSimulateCloudTrail}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{loading ? 'Executing Attack Ingestion...' : 'Dispatch CloudTrail Telemetry'}</span>
              </button>
            </div>
          )}

          {activeTab === 'ssh' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Attacker IPv4</label>
                <input
                  type="text"
                  value={sshIp}
                  onChange={(e) => setSshIp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Username</label>
                  <input
                    type="text"
                    value={sshUser}
                    onChange={(e) => setSshUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Attempted Password</label>
                  <input
                    type="text"
                    value={sshPassword}
                    onChange={(e) => setSshPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleSimulateSSH}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{loading ? 'Injecting SSH Brute Force...' : 'Launch Cowrie SSH Probe'}</span>
              </button>
            </div>
          )}

          {activeTab === 'http' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Attacker IPv4</label>
                  <input
                    type="text"
                    value={httpIp}
                    onChange={(e) => setHttpIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">HTTP Method & Path</label>
                  <div className="flex space-x-2">
                    <select
                      value={httpMethod}
                      onChange={(e) => setHttpMethod(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                    <input
                      type="text"
                      value={httpPath}
                      onChange={(e) => setHttpPath(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exploit Payload</label>
                <input
                  type="text"
                  value={httpPayload}
                  onChange={(e) => setHttpPayload(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSimulateHTTP}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{loading ? 'Dispatching HTTP Exploit...' : 'Launch HTTP Trap Probe'}</span>
              </button>
            </div>
          )}

          {/* Results Output Box */}
          {result && (
            <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Simulation Processing Response</p>
              <pre className="text-xs text-emerald-400 overflow-x-auto max-h-40 font-mono">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
