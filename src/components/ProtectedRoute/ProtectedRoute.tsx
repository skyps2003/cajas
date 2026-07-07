import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'cajero')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user doesn't have the right role, redirect to their specific dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'cajero') return <Navigate to="/cajero" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
