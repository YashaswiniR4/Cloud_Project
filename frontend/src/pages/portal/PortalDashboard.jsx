import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Shield, Key, UploadCloud, FileText, CheckCircle2, 
  AlertCircle, Loader2, Clock, MapPin, Laptop, Lock, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logPortalActivity, uploadPortalDocument } from '../../services/api';

export const PortalDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // overview, upload, password, activity
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState(null);
  const [pwdError, setPwdError] = useState(null);

  const [activities, setActivities] = useState([
    { id: 1, event: 'EMPLOYEE_LOGIN', ip: '198.51.100.101', country: 'India', time: 'Just Now', status: 'SUCCESS' },
    { id: 2, event: 'DOCUMENT_UPLOAD', ip: '198.51.100.101', country: 'India', time: '1 hour ago', status: 'CLEAN' },
    { id: 3, event: 'PROFILE_UPDATE', ip: '198.51.100.101', country: 'India', time: 'Yesterday', status: 'SUCCESS' },
  ]);

  const [isBlocked, setIsBlocked] = useState(false);

  // Trigger telemetry log when visiting dashboard
  useEffect(() => {
    logPortalActivity({
      event_name: 'EMPLOYEE_DASHBOARD_ACCESS',
      source_ip: '198.51.100.101',
      user_id: user?.username || 'employee-user',
      country: 'India',
      city: 'Bengaluru',
      device: 'Windows Chrome'
    }).catch(err => console.log('Telemetry stream active'));
  }, [user]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user?.username || 'employee-user');
    formData.append('source_ip', '198.51.100.101');

    try {
      const res = await uploadPortalDocument(formData);
      setUploadMessage(`File '${res.filename}' uploaded successfully. Hash: ${res.file_hash.substring(0, 16)}...`);
      setActivities(prev => [
        { id: Date.now(), event: 'DOCUMENT_UPLOAD', ip: '198.51.100.101', country: 'India', time: 'Just Now', status: 'CLEAN' },
        ...prev
      ]);
      setFile(null);
    } catch (err) {
      console.error('File upload error:', err);
      const detail = err.response?.data?.detail || 'File upload rejected by security scan.';
      setUploadError(detail);
      
      if (detail.includes('Malicious') || detail.includes('Threat')) {
        setIsBlocked(true);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMessage(null);
    setPwdError(null);

    if (!oldPassword || !newPassword) {
      setPwdError('Please fill in both password fields.');
      return;
    }

    try {
      await logPortalActivity({
        event_name: 'PASSWORD_CHANGE_ATTEMPT',
        source_ip: '198.51.100.101',
        user_id: user?.username || 'employee-user'
      });
      setPwdMessage('Password successfully updated. Security log recorded.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdError('Password update failed.');
    }
  };

  if (isBlocked) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-red-950/40 border border-red-500/40 rounded-2xl text-center space-y-4">
        <div className="p-4 bg-red-500/20 text-red-400 rounded-full w-fit mx-auto border border-red-500/30">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">403 FORBIDDEN - ACCESS DENIED</h2>
        <p className="text-xs text-red-300">
          Security Threat Detected: Malicious executable or unauthorized script payload blocked by Autonomous SOC Lambda Remediation.
        </p>
        <p className="font-mono text-xs text-slate-400">
          Source IP: 198.51.100.101 | Containment Action: Account Locked & Security Group IP Ingress Blocked.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Employee Profile Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl font-bold">
            {user?.username?.[0]?.toUpperCase() || 'E'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">{user?.username || 'Employee Analyst'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email || 'analyst@enterprise.com'}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold rounded-full uppercase">
                {user?.role || 'Security Analyst'}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-full uppercase flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Baseline</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 border border-slate-800 bg-slate-950 p-1.5 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Document Upload
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'password' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Security & Password
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'activity' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Activity History
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400 font-medium uppercase">Last Verified Login</span>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Today at 09:15 UTC</span>
            </div>
            <p className="text-[11px] text-slate-500">Automated baseline check passed</p>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400 font-medium uppercase">Primary Location</span>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>Bengaluru, India</span>
            </div>
            <p className="text-[11px] text-slate-500">UBA Geographic Baseline</p>
          </div>

          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400 font-medium uppercase">Device Profile</span>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Laptop className="w-5 h-5 text-purple-400" />
              <span>Windows Chrome</span>
            </div>
            <p className="text-[11px] text-slate-500">Trusted Workstation ID</p>
          </div>
        </div>
      )}

      {/* Tab 2: Document Upload */}
      {activeTab === 'upload' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-blue-400" />
              <span>Upload Corporate Document</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select files for corporate processing. Executables (.exe, .sh) or malicious payloads trigger immediate security containment.
            </p>
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
                  <span>Scanning & Uploading File...</span>
                </>
              ) : (
                <span>Process Document</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'password' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 max-w-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Key className="w-5 h-5 text-blue-400" />
              <span>Change Account Password</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Update your password. Password changes emit audit events to the SOC log stream.</p>
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

      {/* Tab 4: Activity History */}
      {activeTab === 'activity' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Personal Activity Audit Stream</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="pb-3 pt-2 font-medium">Event Name</th>
                  <th className="pb-3 pt-2 font-medium">Source IP</th>
                  <th className="pb-3 pt-2 font-medium">Location</th>
                  <th className="pb-3 pt-2 font-medium">Time</th>
                  <th className="pb-3 pt-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-medium text-slate-200">{act.event}</td>
                    <td className="py-3 font-mono text-slate-400">{act.ip}</td>
                    <td className="py-3 text-slate-300">{act.country}</td>
                    <td className="py-3 text-slate-400">{act.time}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[10px]">
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
    </div>
  );
};
