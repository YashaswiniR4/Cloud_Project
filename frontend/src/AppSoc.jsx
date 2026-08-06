import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { Dashboard } from './pages/Dashboard';
import { CloudTrailLogs } from './pages/CloudTrailLogs';
import { ThreatIntel } from './pages/ThreatIntel';
import { Alerts } from './pages/Alerts';
import { MLPredictions } from './pages/MLPredictions';
import { Honeypots } from './pages/Honeypots';
import { Settings } from './pages/Settings';
import { SimulationLab } from './pages/SimulationLab';
import { IncidentInvestigation } from './pages/IncidentInvestigation';

export const AppSoc = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected SOC Analyst Command Center Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Security Analyst', 'Admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/logs" element={<CloudTrailLogs />} />
              <Route path="/threats" element={<ThreatIntel />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/ml-predictions" element={<MLPredictions />} />
              <Route path="/honeypots" element={<Honeypots />} />
              <Route path="/incidents" element={<IncidentInvestigation />} />
              <Route path="/simulation-lab" element={<SimulationLab />} />
              <Route path="/settings" element={<Settings />} />

              {/* Sub-path Support */}
              <Route path="/dashboard/logs" element={<CloudTrailLogs />} />
              <Route path="/dashboard/threats" element={<ThreatIntel />} />
              <Route path="/dashboard/alerts" element={<Alerts />} />
              <Route path="/dashboard/ml-predictions" element={<MLPredictions />} />
              <Route path="/dashboard/honeypots" element={<Honeypots />} />
              <Route path="/dashboard/incidents" element={<IncidentInvestigation />} />
              <Route path="/dashboard/simulation-lab" element={<SimulationLab />} />
              <Route path="/dashboard/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppSoc;
