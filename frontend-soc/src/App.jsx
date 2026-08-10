import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';

import { Dashboard } from './pages/Dashboard';
import { CloudTrailLogs } from './pages/CloudTrailLogs';
import { ThreatIntel } from './pages/ThreatIntel';
import { Alerts } from './pages/Alerts';
import { MLPredictions } from './pages/MLPredictions';
import { Honeypots } from './pages/Honeypots';
import { IncidentInvestigation } from './pages/IncidentInvestigation';
import { UserBehaviorAnalytics } from './pages/UserBehaviorAnalytics';
import { ThreatHunting } from './pages/ThreatHunting';
import { SimulationLab } from './pages/SimulationLab';
import { Remediation } from './pages/Remediation';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected SOC Dashboard Routes - Restricted to Security Analysts & Admins */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['Security Analyst', 'Admin', 'soc_analyst', 'admin', 'Analyst']} />
            }
          >
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/logs" element={<CloudTrailLogs />} />
              <Route path="/threats" element={<ThreatIntel />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/ml-predictions" element={<MLPredictions />} />
              <Route path="/honeypots" element={<Honeypots />} />
              <Route path="/incidents" element={<IncidentInvestigation />} />
              <Route path="/uba" element={<UserBehaviorAnalytics />} />
              <Route path="/threat-hunting" element={<ThreatHunting />} />
              <Route path="/simulation-lab" element={<SimulationLab />} />
              <Route path="/remediations" element={<Remediation />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
