import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, KeyRound, ArrowRight, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { resetPassword } from '../services/api';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Password Policy Checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !otp.trim() || !newPassword || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not satisfy security policy requirements.');
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      // Redirect to login page with success message
      navigate('/login', {
        state: {
          successMessage: 'Password reset successfully. Please log in with your new password.'
        }
      });
    } catch (err) {
      console.error('Reset password error:', err);
      const detail = err.response?.data?.detail || 'Password reset failed. Please check your OTP code.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <KeyRound className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Reset Analyst Password</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your analyst email, 6-digit OTP reset code, and new password.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Analyst Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@enterprise.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">6-Digit Reset Code (OTP)</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-[8px] text-emerald-400 placeholder-slate-700 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Password Policy Indicator */}
          {newPassword && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-[11px] font-mono">
              <span className="text-slate-400 font-sans font-semibold text-[10px] uppercase block mb-1">Password Complexity Rules:</span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className={`flex items-center space-x-1 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>8+ Characters</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Uppercase (A-Z)</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Lowercase (a-z)</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Number (0-9)</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Special (!@#$)</span>
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/60 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/20 mt-2"
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Resetting Password...</span>
              </div>
            ) : (
              <>
                <span>Update & Reset Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
          <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
