import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AttackSimulationModal } from '../components/AttackSimulationModal';
import { getHealthStatus } from '../services/api';

export const DashboardLayout = () => {
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  const fetchHealth = async () => {
    try {
      const data = await getHealthStatus();
      setHealthStatus(data);
    } catch (err) {
      setHealthStatus({ status: 'OFFLINE' });
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      <Sidebar onOpenSimulation={() => setIsSimModalOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onRefresh={fetchHealth} healthStatus={healthStatus} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet context={{ refreshHealth: fetchHealth }} />
        </main>
      </div>

      <AttackSimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onRefresh={fetchHealth}
      />
    </div>
  );
};
