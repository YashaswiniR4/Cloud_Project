import React from 'react';

export const SeverityBadge = ({ severity }) => {
  const sev = (severity || 'LOW').toUpperCase();

  let styles = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  if (sev === 'HIGH' || sev === 'CRITICAL' || sev === 'CRITICAL_ZERO_DAY') {
    styles = 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse';
  } else if (sev === 'MEDIUM' || sev === 'HIGH_ANOMALY') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      {sev}
    </span>
  );
};
