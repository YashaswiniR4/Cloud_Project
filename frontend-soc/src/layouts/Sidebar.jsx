import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldAlert, 
  Bell, 
  Cpu, 
  Crosshair, 
  Settings, 
  LogOut,
  Shield,
  FlaskConical,
  GitCommit,
  UserCheck,
  Search,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Overview / Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'CloudTrail Logs', path: '/logs', icon: FileText },
    { name: 'Threat Intelligence', path: '/threats', icon: ShieldAlert },
    { name: 'Alerts Feed', path: '/alerts', icon: Bell },
    { name: 'ML Predictions', path: '/ml-predictions', icon: Cpu },
    { name: 'Honeypot Traps', path: '/honeypots', icon: Crosshair },
    { name: 'Incident Investigation', path: '/incidents', icon: GitCommit },
    { name: 'User Behavior Analytics', path: '/uba', icon: UserCheck },
    { name: 'Threat Hunting', path: '/threat-hunting', icon: Search },
    { name: 'Attack Simulation Lab', path: '/simulation-lab', icon: FlaskConical },
    { name: 'Remediation', path: '/remediations', icon: Shield },
    { name: 'Audit Logs', path: '/audit-logs', icon: Lock },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const userRole = user?.role || 'Security Analyst';

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col h-screen sticky top-0 bg-[#0b0f19]/90 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 px-6 py-5 border-b border-slate-800">
        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">AUTONOMOUS SOC</h1>
          <p className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase">Command Center</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3 truncate">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30 shrink-0">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : 'SA'}
          </div>
          <div className="truncate">
            <p className="text-xs font-medium text-white truncate">{user?.username || 'SOC Analyst'}</p>
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">{userRole}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors hover:bg-slate-800/50"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
