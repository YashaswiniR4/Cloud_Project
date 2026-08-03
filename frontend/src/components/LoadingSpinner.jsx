import React from 'react';

export const LoadingSpinner = ({ label = 'Loading Telemetry...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-400">{label}</p>
    </div>
  );
};
