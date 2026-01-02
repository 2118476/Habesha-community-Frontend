import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * RequireAuth ensures private routes are only accessible once the
 * authentication state has been hydrated. While auth is resolving,
 * it renders nothing (you could put a skeleton here). If the user
 * is not authenticated it redirects them to /login with a redirect
 * parameter preserving the attempted location. When authenticated,
 * it renders its children. Note: we intentionally avoid using
 * Outlet here to support wrapping arbitrary element trees.
 */
export default function RequireAuth({ children }) {
  const { user, authReady } = useAuth();
  const location = useLocation();

  // Wait until auth state is ready. Prevents redirect loops.
  if (!authReady) {
    return null;
  }
  // If there is no user we redirect to login with redirect param.
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return children;
}