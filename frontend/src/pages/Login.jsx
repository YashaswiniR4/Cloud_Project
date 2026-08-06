import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Building2, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const successMessage = location.state?.successMessage;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Invalid email or password.');
      return;
    }

    setSubmitting(true);

    try {
      const data = await loginUser({ email: email.trim(), password });
      login(data.access_token, data.user, rememberMe);

      // Role-Based Redirection
      const role = data.user?.role || 'Employee';
      if (role === 'Security Analyst' || role === 'Admin') {
        navigate('/dashboard');
      } else {
        navigate('/portal/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      if (detail && detail.includes('locked')) {
        setError('Account temporarily locked. Try again later.');
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">GLOBEX ENTERPRISE PORTAL</h1>
            <p className="text-xs text-slate-400 mt-1">Corporate Employee Sign In</p>
          </div>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-3 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@enterprise.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
              />
              <span className="text-xs text-slate-400">Remember Me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/60 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/20 mt-6"
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Signing In...</span>
              </div>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Don't have an employee account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium underline">
              Register Employee Account
            </Link>
          </p>
          <p className="text-[11px] text-slate-500">
            Globex Enterprise Confidential Workspace
          </p>
        </div>
      </div>
    </div>
  );
};
