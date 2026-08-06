import React, { useState } from 'react';
import { 
  FlaskConical, ShieldAlert, Zap, Terminal, CheckCircle2, AlertTriangle, 
  Loader2, Play, Lock, FileCode, Cpu, UserCheck
} from 'lucide-react';
import { simulateCloudTrailLog, simulateSSHAttack, simulateHTTPAttack, logPortalActivity } from '../services/api';

export const SimulationLab = () => {
  const [selectedAttack, setSelectedAttack] = useState('sqli');
  const [sourceIp, setSourceIp] = useState('198.51.100.99');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const attackPresets = [
    { id: 'sqli', name: 'SQL Injection', type: 'HTTP', desc: "Injects web exploit payload '' OR '1'='1' into application login or search inputs." },
    { id: 'brute_force', name: 'Brute Force Login', type: 'AUTH', desc: 'Fires rapid password attempts to trigger 5-attempt account lockout and UBA alerts.' },
    { id: 'priv_esc', name: 'Privilege Escalation', type: 'AWS', desc: 'Simulates unauthorized IAM AttachUserPolicy attempt to grant AdministratorAccess.' },
    { id: 'iam_abuse', name: 'IAM Access Key Abuse', type: 'AWS', desc: 'Simulates rapid CreateAccessKey API calls from unrecognized proxy location.' },
    { id: 'ssh_brute', name: 'SSH Honeypot Attack', type: 'DECEPTION', desc: 'Fires brute force SSH credentials against Cowrie Honeypot trap on Port 2222.' },
    { id: 'api_abuse', name: 'API Rate Abuse', type: 'API', desc: 'Fires high-frequency unauthenticated API probes to trigger rate-limiting.' },
    { id: 'xss', name: 'Cross-Site Scripting (XSS)', type: 'HTTP', desc: "Injects malicious script tag '<script>alert(document.cookie)</script>'." },
    { id: 'dir_traversal', name: 'Directory Traversal', type: 'HTTP', desc: "Attempts path traversal payload '../../../../etc/passwd' on web endpoints." },
    { id: 'malicious_upload', name: 'Malicious File Upload', type: 'UPLOAD', desc: 'Simulates uploading malware payload file (malware_payload.exe).' },
  ];

  const handleRunSimulation = async () => {
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      let res;
      if (selectedAttack === 'sqli' || selectedAttack === 'xss' || selectedAttack === 'dir_traversal') {
        let payloadStr = "' OR '1'='1";
        if (selectedAttack === 'xss') payloadStr = "<script>alert(document.cookie)</script>";
        if (selectedAttack === 'dir_traversal') payloadStr = "../../../../etc/passwd";

        res = await simulateHTTPAttack({
          source_ip: sourceIp,
          path: '/portal/login',
          method: 'POST',
          payload: payloadStr
        });
      } else if (selectedAttack === 'ssh_brute') {
        res = await simulateSSHAttack({
          source_ip: sourceIp,
          username: 'root',
          password: 'supersecretpassword'
        });
      } else if (selectedAttack === 'priv_esc' || selectedAttack === 'iam_abuse' || selectedAttack === 'api_abuse') {
        let eventName = 'AttachUserPolicy';
        if (selectedAttack === 'iam_abuse') eventName = 'CreateAccessKey';
        if (selectedAttack === 'api_abuse') eventName = 'DescribeInstances';

        res = await simulateCloudTrailLog({
          Records: [
            {
              eventID: `sim-${Date.now()}`,
              eventName: eventName,
              eventTime: new Date().toISOString(),
              eventSource: 'iam.amazonaws.com',
              sourceIPAddress: sourceIp,
              userIdentity: { type: 'IAMUser', arn: `arn:aws:iam::123456789012:user/attacker-${sourceIp}` }
            }
          ]
        });
      } else {
        // Portal activities (Brute force login / Malicious file upload)
        res = await logPortalActivity({
          event_name: selectedAttack === 'malicious_upload' ? 'MALICIOUS_FILE_UPLOAD_ATTEMPT' : 'FAILED_LOGIN_BRUTE_FORCE',
          source_ip: sourceIp,
          user_id: 'target-employee',
          country: 'Russia',
          city: 'Moscow',
          device: 'Kali Linux Tor Proxy'
        });
      }

      setResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.response?.data?.detail || 'Simulation execution failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between relative overflow-hidden">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-400 uppercase tracking-widest mb-1">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Demonstration & Security Testing Zone</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Attack Simulation Lab</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Simulate multi-vector cyber attacks against the Corporate Employee Portal and AWS CloudTrail pipeline to trigger live ML threat detection, SHAP explainability, and Lambda containment.
          </p>
        </div>
        <div className="hidden sm:block px-4 py-2 bg-purple-600/10 border border-purple-500/20 rounded-xl text-right">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Testing Status</p>
          <p className="text-xs font-bold text-purple-400">Isolated Sandbox Ready</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Attack Vector Selection */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Select Attack Scenario</span>
          </h3>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {attackPresets.map((atk) => (
              <div
                key={atk.id}
                onClick={() => setSelectedAttack(atk.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedAttack === atk.id
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{atk.name}</span>
                  <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-400">
                    {atk.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{atk.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Execution Controls & Console Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Simulation Execution Parameters</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Attacker Source IP</label>
              <input
                type="text"
                value={sourceIp}
                onChange={(e) => setSourceIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={running}
              className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-red-600/20 flex items-center justify-center space-x-2"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Attack Telemetry...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Dispatch Attack Telemetry</span>
                </>
              )}
            </button>
          </div>

          {/* Console Log Output Display */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 bg-slate-950 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-semibold flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Sandbox Output Log</span>
              </span>
              <span className="text-[10px] text-slate-500">Live Telemetry Feedback</span>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 space-y-1">
                <p className="font-bold">[ERROR] Simulation Failed</p>
                <p className="text-[11px]">{error}</p>
              </div>
            )}

            {result && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 space-y-2">
                <p className="font-bold flex items-center space-x-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>[SUCCESS] Attack Telemetry Successfully Dispatched!</span>
                </p>
                <pre className="text-[11px] text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded-lg">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            {!result && !error && (
              <p className="text-slate-600 py-6 text-center italic">
                Ready to execute. Select an attack scenario and click "Dispatch Attack Telemetry".
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
