import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ allowedRoles, children }) => {
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

  // Role Security Enforcement:
  // Employees / Users are restricted from accessing SOC Analyst Console (localhost:5174)
  const userRole = user?.role || 'Security Analyst';
  const isEmployee = userRole === 'User' || userRole === 'Employee';

  if (isEmployee) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6 text-center font-sans">
        <div className="glass-panel p-8 rounded-2xl border border-red-500/30 max-w-md space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
            🔒
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied: SOC Authorization Required</h2>
          <p className="text-xs text-slate-400">
            Your account role (<strong className="text-amber-400">{userRole}</strong>) does not have Security Operations Analyst privileges.
          </p>
          <a
            href="http://localhost:5173/dashboard"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition-colors shadow-lg shadow-blue-600/20"
          >
            Go to SentinelAI Corporate Workspace
          </a>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
};
