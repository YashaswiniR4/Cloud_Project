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
  Shield
} from 'lucide-react';

export const Sidebar = ({ onOpenSimulation }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'CloudTrail Logs', path: '/logs', icon: FileText },
    { name: 'Threat Intelligence', path: '/threats', icon: ShieldAlert },
    { name: 'Alerts Feed', path: '/alerts', icon: Bell },
    { name: 'ML Predictions', path: '/ml-predictions', icon: Cpu },
    { name: 'Honeypot Traps', path: '/honeypots', icon: Crosshair },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 px-6 py-5 border-b border-slate-800">
        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">AUTONOMOUS SOC</h1>
          <p className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase">Cloud Security Engine</p>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-4">
        <button
          onClick={onOpenSimulation}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium text-xs transition-all duration-200 shadow-lg shadow-red-500/5 group"
        >
          <ShieldAlert className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
          <span>Simulate Cyber Attack</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
            SO
          </div>
          <div>
            <p className="text-xs font-medium text-white">SOC Analyst</p>
            <p className="text-[10px] text-slate-500">secops@aws.prod</p>
          </div>
        </div>
        <NavLink to="/login" className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" />
        </NavLink>
      </div>
    </aside>
  );
};
