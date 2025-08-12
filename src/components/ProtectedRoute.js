import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Protect routes from unauthenticated access and restrict by roles.
// If the user is not authenticated, they are redirected to the
// login page. If a roles array is provided, the user must have
// at least one of the required roles to proceed.
const ProtectedRoute = ({ roles: requiredRoles }) => {
  const { isAuthenticated, roles, loading } = useAuth();
  if (loading) {
    // Show nothing or a loading spinner while authentication state
    // is being resolved. This prevents flicker during initial load.
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
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