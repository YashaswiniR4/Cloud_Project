import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, KeyRound, Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { verifyEmail, resendOTP } from '../services/api';

export const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(location.state?.successMessage || '');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter a 6-digit numeric verification code.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await verifyEmail({ email: email.trim(), otp: otp.trim() });
      navigate('/login', {
        state: {
          successMessage: res.message || 'Email verified successfully. You can now login.'
        }
      });
    } catch (err) {
      console.error('Email verification error:', err);
      const msg = err.response?.data?.detail || 'Verification failed. Please check your OTP code and try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccessInfo('');

    if (!email.trim()) {
      setError('Please enter your registered email address to resend OTP.');
      return;
    }

    setResending(true);

    try {
      const res = await resendOTP({ email: email.trim() });
      setSuccessInfo(res.message || 'A new verification code has been sent to your email.');
    } catch (err) {
      console.error('Resend OTP error:', err);
      const msg = err.response?.data?.detail || 'Failed to resend verification code.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <KeyRound className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">VERIFY EMAIL ADDRESS</h1>
            <p className="text-xs text-slate-400 mt-1">Enter 6-Digit OTP Sent to Your Corporate Email</p>
          </div>
        </div>

        {/* Success Banner */}
        {successInfo && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-3 text-emerald-400 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Error Notification Banner */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 text-red-400 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@enterprise.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">6-Digit Verification Code (OTP)</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-center text-lg font-mono tracking-widest text-emerald-400 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Code expires in 5 minutes.</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/60 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-lg shadow-emerald-600/20 mt-6"
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Verifying Code...</span>
              </div>
            ) : (
              <>
                <span>Activate Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{resending ? 'Sending new code...' : 'Didn\'t receive code? Resend OTP'}</span>
          </button>

          <div>
            <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300 underline">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
