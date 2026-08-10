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

      // Check if new alerts have arrived
      if (alertsList.length > prevAlertsCountRef.current && prevAlertsCountRef.current !== 0) {
        const latestAlert = alertsList[alertsList.length - 1];
        setActiveNotification(latestAlert);
        playAlertChime();

        // Auto hide notification banner after 6 seconds
        setTimeout(() => {
          setActiveNotification(null);
        }, 6000);
      } else if (prevAlertsCountRef.current === 0 && alertsList.length > 0) {
        prevAlertsCountRef.current = alertsList.length;
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
      {/* Floating Live Alert Toast Notification Banner */}
      {activeNotification && (
        <div className="fixed top-5 right-5 z-50 w-96 bg-red-950/90 border border-red-500/50 backdrop-blur-xl p-4 rounded-2xl shadow-2xl shadow-red-900/40 text-white animate-bounce space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-xs font-extrabold tracking-wider text-red-300 uppercase">
                🚨 REAL-TIME SOC ALERT DISPATCHED
              </span>
            </div>
            <button
              onClick={() => setActiveNotification(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-bold text-white text-sm">
              {activeNotification.event_name || 'SECURITY_THREAT_EVENT'}
            </p>
            <div className="flex justify-between text-[11px] font-mono text-slate-300 bg-black/40 p-2 rounded-xl border border-red-900/40">
              <span>Attacker IP: <strong className="text-blue-400">{activeNotification.source_ip || '198.51.100.101'}</strong></span>
              <span>Score: <strong className="text-red-400">{activeNotification.threat_score}/100</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold pt-1 border-t border-red-900/40">
            <span className="flex items-center space-x-1">
              <Lock className="w-3 h-3" />
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
