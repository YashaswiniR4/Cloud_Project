import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CloudTrailLogs } from './pages/CloudTrailLogs';
import { ThreatIntel } from './pages/ThreatIntel';
import { Alerts } from './pages/Alerts';
import { MLPredictions } from './pages/MLPredictions';
import { Honeypots } from './pages/Honeypots';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="logs" element={<CloudTrailLogs />} />
          <Route path="threats" element={<ThreatIntel />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="ml-predictions" element={<MLPredictions />} />
          <Route path="honeypots" element={<Honeypots />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
