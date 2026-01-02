import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Protect routes from unauthenticated access and restrict by roles.
// If the user is not authenticated, they are redirected to the
// login page. If a roles array is provided, the user must have
// at least one of the required roles to proceed.
const ProtectedRoute = ({ roles: requiredRoles }) => {
  const { user, roles, authReady } = useAuth();
  if (!authReady) {
    return null;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((r) => roles.includes(r));
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }
  return <Outlet />;
};

export default ProtectedRoute;