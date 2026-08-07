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
import { SimulationLab } from './pages/SimulationLab';
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

          {/* Protected SOC Dashboard Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="logs" element={<CloudTrailLogs />} />
            <Route path="threats" element={<ThreatIntel />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="ml-predictions" element={<MLPredictions />} />
            <Route path="honeypots" element={<Honeypots />} />
            <Route path="incidents" element={<IncidentInvestigation />} />
            <Route path="simulation-lab" element={<SimulationLab />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
