import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  User, Mail, Key, UploadCloud, FileText, CheckCircle2, 
  AlertCircle, Loader2, Clock, MapPin, Laptop, Bell, Settings, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logPortalActivity, uploadPortalDocument } from '../../services/api';

export const PortalDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Tab State: overview, profile, documents, notifications, activity, settings
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState(null);
  const [pwdError, setPwdError] = useState(null);

  const [notifications] = useState([
    { id: 1, title: 'Welcome to Globex Workspace', desc: 'Your employee profile is active and verified.', time: 'Today 09:00' },
    { id: 2, title: 'System Maintenance Scheduled', desc: 'Routine cloud server optimization tonight at 23:00 UTC.', time: 'Yesterday' },
  ]);

  const [activities, setActivities] = useState([
    { id: 1, event: 'Employee Login', ip: '198.51.100.101', location: 'Bengaluru, India', time: 'Just Now', status: 'Success' },
    { id: 2, event: 'Document Upload', ip: '198.51.100.101', location: 'Bengaluru, India', time: '1 hour ago', status: 'Completed' },
    { id: 3, event: 'Profile Update', ip: '198.51.100.101', location: 'Bengaluru, India', time: 'Yesterday', status: 'Success' },
  ]);

  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const tabFromUrl = new URLSearchParams(location.search).get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [location]);

  // Log activity silently to backend (no security jargon on screen)
  useEffect(() => {
    logPortalActivity({
      event_name: 'EMPLOYEE_DASHBOARD_ACCESS',
      source_ip: '198.51.100.101',
      user_id: user?.username || 'employee-user',
      country: 'India',
      city: 'Bengaluru',
      device: 'Windows Chrome'
    }).catch(() => {});
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
      setUploadMessage(`Document '${res.filename}' processed successfully.`);
      setActivities(prev => [
        { id: Date.now(), event: 'Document Upload', ip: '198.51.100.101', location: 'Bengaluru, India', time: 'Just Now', status: 'Completed' },
        ...prev
      ]);
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      const detail = err.response?.data?.detail || 'Document upload request failed.';
      setUploadError(detail);
      
      if (detail.includes('Malicious') || detail.includes('Threat') || detail.includes('Rejected')) {
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
      setPwdError('Please fill in all password fields.');
      return;
    }

    try {
      await logPortalActivity({
        event_name: 'PASSWORD_CHANGE_ATTEMPT',
        source_ip: '198.51.100.101',
        user_id: user?.username || 'employee-user'
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
      <div className="max-w-xl mx-auto my-16 p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="p-4 bg-red-500/10 text-red-400 rounded-full w-fit mx-auto border border-red-500/20">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">403 Forbidden - Access Locked</h2>
        <p className="text-xs text-slate-400">
          Your request or file upload could not be processed. Please contact your company administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Profile Header Bar */}
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
                {user?.role || 'Employee'}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-full uppercase flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Account</span>
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
              className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
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
            <span>Employee Profile Details</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between">
              <span className="text-slate-400">Username:</span>
              <span className="text-white font-semibold">{user?.username || 'Employee'}</span>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between">
              <span className="text-slate-400">Email Address:</span>
              <span className="text-white font-semibold">{user?.email || 'employee@enterprise.com'}</span>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between">
              <span className="text-slate-400">Role:</span>
              <span className="text-blue-400 font-semibold">{user?.role || 'Employee'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Documents */}
      {(activeTab === 'documents' || activeTab === 'upload') && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-blue-400" />
              <span>Upload Employee File</span>
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
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 max-w-xl">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <span>Employee Notifications</span>
          </h3>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{n.title}</span>
                  <span className="text-[10px] text-slate-500">{n.time}</span>
                </div>
                <p className="text-xs text-slate-400">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Activity History */}
      {activeTab === 'activity' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Personal Activity History</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="pb-3 pt-2 font-medium">Activity</th>
                  <th className="pb-3 pt-2 font-medium">IP Address</th>
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
                    <td className="py-3 text-slate-300">{act.location}</td>
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

      {/* Tab 6: Settings */}
      {activeTab === 'settings' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 max-w-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Update your employee login password.</p>
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
