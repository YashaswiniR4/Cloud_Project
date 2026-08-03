import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('••••••••••••');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">AUTONOMOUS CLOUD SOC</h1>
            <p className="text-xs text-slate-400 mt-1">Zero Trust Security Operations Console</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Analyst Credentials</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Access Token / Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/20 mt-6"
          >
            <span>Authenticate to SOC Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Protected by AWS WORM Object Lock & KMS Encryption
          </p>
        </div>
      </div>
    </div>
  );
};
