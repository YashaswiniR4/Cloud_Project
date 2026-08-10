import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound, Shield } from 'lucide-react';
import { forgotPassword } from '../services/api';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your analyst email address.');
      return;
    }

    setSubmitting(true);

    try {
      const data = await forgotPassword({ email: email.trim() });
      setMessage(data.message || 'If an account associated with this email exists, a password reset code has been sent.');
      setTimeout(() => {
        navigate('/reset-password', { state: { email: email.trim() } });
      }, 2000);
    } catch (err) {
      console.error('Forgot password error:', err);
      const detail = err.response?.data?.detail || 'Request failed. Please try again.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <KeyRound className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">SOC Analyst Reset Code</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your registered analyst email to receive a 6-digit password reset verification code.
            </p>
          </div>
        </div>

        {message && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-3 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@enterprise.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/60 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Sending Reset Code...</span>
              </div>
            ) : (
              <>
                <span>Send Password Reset Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center flex items-center justify-between text-xs text-slate-400">
          <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
            ← Back to Login
          </Link>
          <Link to="/reset-password" state={{ email }} className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
            Already have a reset code?
          </Link>
        </div>
      </div>
    </div>
  );
};
