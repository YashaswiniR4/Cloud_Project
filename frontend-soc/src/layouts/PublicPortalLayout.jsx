import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, User, LogOut, FileText, Home, LayoutDashboard, Bell, Settings, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicPortalLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col font-sans">
      {/* Top Corporate Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 group-hover:bg-blue-600/30 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-base block">SentinelAI</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block uppercase">Employee Corporate Portal</span>
            </div>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link 
              to="/" 
              className={`text-xs font-medium transition-colors flex items-center space-x-1.5 ${location.pathname === '/' ? 'text-blue-400 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`text-xs font-medium transition-colors flex items-center space-x-1.5 ${location.pathname === '/dashboard' ? 'text-blue-400 font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                <Link 
                  to="/dashboard?tab=profile" 
                  className="text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </Link>

                <Link 
                  to="/dashboard?tab=documents" 
                  className="text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Documents</span>
                </Link>

                <Link 
                  to="/dashboard?tab=notifications" 
                  className="text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notifications</span>
                </Link>

                <Link 
                  to="/dashboard?tab=activity" 
                  className="text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Activity History</span>
                </Link>

                <Link 
                  to="/dashboard?tab=settings" 
                  className="text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 border border-slate-700">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-white leading-tight">{user?.username || 'User'}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{user?.email || 'user@sentinelai.com'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors flex items-center space-x-1 text-xs"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Corporate Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 SentinelAI. All Rights Reserved. Confidential Employee Gateway.</p>
          <div className="flex items-center space-x-4">
            <span className="text-[11px] text-slate-400">Enterprise Workspace Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
