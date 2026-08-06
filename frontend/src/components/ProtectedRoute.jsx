import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <LoadingSpinner label="Authenticating Session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-Based Access Control (RBAC) Enforcement
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || 'Employee';
    const isAllowed = allowedRoles.includes(userRole);
    if (!isAllowed) {
      // Normal employees attempting to access SOC dashboard are redirected to employee portal
      return <Navigate to="/portal/dashboard" replace />;
    }
  }

  return <Outlet />;
};
