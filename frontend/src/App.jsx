import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { DashboardLayout } from './layouts/DashboardLayout';
import { PublicPortalLayout } from './layouts/PublicPortalLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';

import { PortalLanding } from './pages/portal/PortalLanding';
import { PortalDashboard } from './pages/portal/PortalDashboard';

import { Dashboard } from './pages/Dashboard';
import { CloudTrailLogs } from './pages/CloudTrailLogs';
import { ThreatIntel } from './pages/ThreatIntel';
import { Alerts } from './pages/Alerts';
import { MLPredictions } from './pages/MLPredictions';
import { Honeypots } from './pages/Honeypots';
import { Settings } from './pages/Settings';
import { SimulationLab } from './pages/SimulationLab';
import { IncidentInvestigation } from './pages/IncidentInvestigation';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Corporate Employee Portal Routes */}
          <Route path="/portal" element={<PublicPortalLayout />}>
            <Route index element={<PortalLanding />} />
            <Route path="dashboard" element={<PortalDashboard />} />
          </Route>

          {/* Protected SOC Command Center Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="logs" element={<CloudTrailLogs />} />
              <Route path="threats" element={<ThreatIntel />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="ml-predictions" element={<MLPredictions />} />
              <Route path="honeypots" element={<Honeypots />} />
              <Route path="incidents" element={<IncidentInvestigation />} />
              <Route path="simulation-lab" element={<SimulationLab />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
