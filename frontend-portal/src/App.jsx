import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { PublicPortalLayout } from './layouts/PublicPortalLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

import { PortalLanding } from './pages/portal/PortalLanding';
import { PortalDashboard } from './pages/portal/PortalDashboard';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Corporate Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Corporate Employee Portal Main Layout */}
          <Route path="/" element={<PublicPortalLayout />}>
            <Route index element={<PortalLanding />} />
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="portal" element={<Navigate to="/" replace />} />
            <Route path="portal/*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
