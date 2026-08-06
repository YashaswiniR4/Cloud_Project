import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <LoadingSpinner label="Authenticating Security Operations Console Session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-Based Access Control (RBAC) Enforcement:
  // Security Analyst & Admin -> allowed into SOC Console (localhost:5174)
  // Employee -> redirected to Corporate Web Portal (localhost:5173)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || 'Security Analyst';
    const isAllowed = allowedRoles.includes(userRole);
    if (!isAllowed) {
      window.location.href = 'http://localhost:5173/dashboard';
      return null;
    }
  }

  return <Outlet />;
};
