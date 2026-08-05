import React from 'react';

export const MetricCard = ({ title, value, icon: Icon, color = 'blue', subtitle, onClick }) => {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div 
      onClick={onClick}
      className={`glass-panel p-5 rounded-xl border border-slate-800 relative overflow-hidden group transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-slate-600 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-blue-400 transition-colors">
            {value !== undefined && value !== null ? value : 0}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg border ${colorMap[color] || colorMap.blue} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
