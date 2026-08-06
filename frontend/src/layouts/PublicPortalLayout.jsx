import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Building2, Shield, User, LogOut, Lock, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicPortalLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/portal" className="flex items-center space-x-3 group">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 group-hover:bg-blue-600/30 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-base block">GLOBEX CORP</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block uppercase">Enterprise Employee Portal</span>
            </div>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link to="/portal" className="text-xs font-medium text-slate-300 hover:text-white transition-colors">
              Home
            </Link>
            {isAuthenticated && (
              <Link to="/portal/dashboard" className="text-xs font-medium text-slate-300 hover:text-white transition-colors">
                Employee Dashboard
              </Link>
            )}
            
            {/* Direct Switcher to SOC Command Center */}
            <Link 
              to="/dashboard" 
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-lg text-xs font-semibold text-blue-400 flex items-center space-x-1.5 transition-all shadow-sm shadow-blue-500/10"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>SOC Command Center</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 border border-slate-700">
                    {user?.username?.[0]?.toUpperCase() || 'E'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-white leading-tight">{user?.username}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs transition-colors shadow-md shadow-blue-600/20"
                >
                  Register Account
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Globex Enterprise Portal. Protected by AI-Driven Autonomous Cloud Security Operations Center.</p>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping mr-1.5"></span>
              SOC Live Telemetry Pipeline Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
