import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { registerUser } from '../services/api';

// Disposable email domain list for client-side quick check
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'dispostable.com', 'trashmail.com', 'yopmail.com', 'sharklasers.com'
];

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  // Password Policy Checks
  const passwordChecks = {
    length: password.length >= 8 && password.length <= 64,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Email RFC check
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());

  // Username Policy check (4-25 chars, no spaces, alphanumeric + underscore)
  const isUsernameValid = /^[a-zA-Z0-9_]{4,25}$/.test(username.trim());

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isUsernameValid) {
      setError('Username must be 4-25 characters long and contain only letters, numbers, and underscores (no spaces).');
      return;
    }

    if (!isEmailValid) {
      setError('Please enter a valid RFC-compliant email address (e.g. analyst@company.com).');
      return;
    }

    const domain = email.trim().split('@')[1]?.toLowerCase();
    if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
      setError('Disposable email domain addresses are not permitted.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not satisfy the security policy requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      // Register user analyst account
      const response = await registerUser({
        username: username.trim(),
        email: email.trim(),
        password
      });

      // Redirect to Verify Email page with email and success message (DO NOT auto-login)
      navigate('/verify-email', {
        state: {
          email: email.trim(),
          successMessage: response.message || 'Registration successful. A 6-digit verification code has been sent to your email.'
        }
      });

    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow animations */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[24rem] h-[24rem] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-panel w-full max-w-lg p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 my-8">
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">ANALYST REGISTRATION</h1>
            <p className="text-xs text-slate-400 mt-1">Enterprise Cloud Threat Intelligence Platform</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 text-red-400 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Username <span className="text-slate-500">(4-25 chars, letters/numbers/underscore)</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sec_analyst"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Corporate Email Address</label>
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            {/* Live Password Policy Indicators */}
            {password.length > 0 && (
              <div className="mt-3 p-3 bg-slate-950 border border-slate-800/80 rounded-xl grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center space-x-1.5 ${passwordChecks.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {passwordChecks.length ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>8-64 Characters</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${passwordChecks.uppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {passwordChecks.uppercase ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>Uppercase (A-Z)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${passwordChecks.lowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {passwordChecks.lowercase ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>Lowercase (a-z)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${passwordChecks.digit ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {passwordChecks.digit ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>Digit (0-9)</span>
                </div>
                <div className={`flex items-center space-x-1.5 col-span-2 ${passwordChecks.special ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {passwordChecks.special ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>Special Character (!@#$%^&*)</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1 flex items-center space-x-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>Passwords do not match</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/60 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-lg shadow-emerald-600/20 mt-6"
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creating Account...</span>
              </div>
            ) : (
              <>
                <span>Register Analyst Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium underline">
              Sign In to Console
            </Link>
          </p>
          <p className="text-[11px] text-slate-500">
            RBAC Enforcement & PostgreSQL Vault Persistence
          </p>
        </div>
      </div>
    </div>
  );
};
