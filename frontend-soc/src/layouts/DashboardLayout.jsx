import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AttackSimulationModal } from '../components/AttackSimulationModal';
import { getHealthStatus, getAlerts } from '../services/api';
import { ShieldAlert, X, Lock } from 'lucide-react';

export const DashboardLayout = () => {
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  const prevAlertsCountRef = useRef(0);

  // Synthesize 3-beep security audio alert sound notification
  const playAlertChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const playBeep = (delay) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + delay); // A5 note
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + delay + 0.2);

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.2);
      };

      // Play 3 consecutive alert sound beeps
      playBeep(0.0);
      playBeep(0.3);
      playBeep(0.6);
    } catch (e) {
      // AudioContext fallback
    }
  };

  const fetchHealthAndAlerts = async () => {
    try {
      const [healthData, alertsData] = await Promise.all([
        getHealthStatus(),
        getAlerts()
      ]);
      setHealthStatus(healthData);

      const alertsList = alertsData.alerts || [];
      setAlertCount(alertsList.length);

      // Check if new alerts have arrived or count increased
      if (alertsList.length > prevAlertsCountRef.current) {
        const latestAlert = alertsList[0];
        if (latestAlert) {
          setActiveNotification(latestAlert);
          playAlertChime();

          // Auto hide notification banner after 8 seconds
          setTimeout(() => {
            setActiveNotification(null);
          }, 8000);
        }
      }
      prevAlertsCountRef.current = alertsList.length;
    } catch (err) {
      setHealthStatus({ status: 'OFFLINE' });
    }
  };

  useEffect(() => {
    fetchHealthAndAlerts();
    const interval = setInterval(fetchHealthAndAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0b0f19] font-sans relative overflow-x-hidden">
      {/* Floating Live Alert Toast Notification Popup Banner */}
      {activeNotification && (
        <div className="fixed top-5 right-5 z-[9999] w-96 bg-red-950/95 border-2 border-red-500/80 backdrop-blur-2xl p-4 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.5)] text-white animate-bounce space-y-3">
          <div className="flex items-center justify-between border-b border-red-800/60 pb-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-xs font-black tracking-wider text-red-300 uppercase">
                🚨 REAL-TIME SOC ALERT DISPATCHED
              </span>
            </div>
            <button
              onClick={() => setActiveNotification(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <p className="font-bold text-white text-sm tracking-wide">
                {activeNotification.event_name || 'SECURITY_THREAT_EVENT'}
              </p>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                {activeNotification.severity || 'HIGH'}
              </span>
            </div>

            {/* Target User Information */}
            {(activeNotification.user_id || activeNotification.user_email) && (
              <div className="text-[11px] text-slate-300 bg-red-900/40 p-2 rounded-xl border border-red-800/50 space-y-0.5 font-mono">
                <div><span className="text-slate-400">Target User:</span> <strong className="text-amber-300">{activeNotification.user_id || 'User'}</strong></div>
                {activeNotification.user_email && <div><span className="text-slate-400">User Email:</span> <strong className="text-amber-200">{activeNotification.user_email}</strong></div>}
              </div>
            )}

            <div className="flex justify-between text-[11px] font-mono text-slate-300 bg-black/50 p-2 rounded-xl border border-red-900/40">
              <span>Attacker IP: <strong className="text-blue-400">{activeNotification.source_ip || '198.51.100.101'}</strong></span>
              <span>Threat Score: <strong className="text-red-400">{activeNotification.threat_score || 85}/100</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold pt-1 border-t border-red-900/40">
            <span className="flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>CONTAINMENT EXECUTED</span>
            </span>
            <span className="text-slate-400 font-normal">Just Now</span>
          </div>
        </div>
      )}

      <Sidebar onOpenSimulation={() => setIsSimModalOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onRefresh={fetchHealthAndAlerts} healthStatus={healthStatus} alertCount={alertCount} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet context={{ refreshHealth: fetchHealthAndAlerts, playChime: playAlertChime }} />
        </main>
      </div>

      <AttackSimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onRefresh={fetchHealthAndAlerts}
      />
    </div>
  );
};
