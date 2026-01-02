import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../api/axiosInstance';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'auth.token';

// Helper: append a timestamp to bypass HTTP caches/proxies
const withBust = (url, bust) =>
  bust ? `${url}${url.includes('?') ? '&' : '?'}__t=${Date.now()}` : url;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Apply/clear auth token + set default no-cache header
  const applyToken = useCallback((t) => {
    if (t) {
      api.defaults.headers.common.Authorization = `Bearer ${t}`;
      api.defaults.headers.common['Cache-Control'] = 'no-cache';
      api.defaults.headers.common.Pragma = 'no-cache';
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
    } else {
      delete api.defaults.headers.common.Authorization;
      delete api.defaults.headers.common['Cache-Control'];
      delete api.defaults.headers.common.Pragma;
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, []);

  /**
   * Fetch current user.
   * opts = { bust?: boolean, setReady?: boolean }
   */
  const fetchCurrentUser = useCallback(
    async (opts = {}) => {
      const { bust = false, setReady = false } = opts;
      try {
        const url = withBust('/users/me', bust);
        const { data } = await api.get(url, {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });
        setUser(data ?? null);
      } catch (error) {
        // Token likely invalid/expired
        applyToken(null);
        setUser(null);
      } finally {
        if (setReady) setAuthReady(true);
      }
    },
    [applyToken]
  );

  /** Public: refresh user (always bust cache to reflect latest changes) */
  const refreshMe = useCallback(async () => {
    await fetchCurrentUser({ bust: true });
  }, [fetchCurrentUser]);

  // Hydrate on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      applyToken(stored);
      fetchCurrentUser({ setReady: true });
    } else {
      setAuthReady(true);
    }
  }, [applyToken, fetchCurrentUser]);

  // Login flow
  const login = useCallback(
    async (credentials) => {
      const { data } = await api.post('/auth/login', credentials);
      applyToken(data.token);
      // Use backend as the source of truth
      await fetchCurrentUser({ bust: true });
      return data;
    },
    [applyToken, fetchCurrentUser]
  );

  // Register (does not auto-login)
  const register = useCallback(async (form) => {
    const { data } = await api.post('/auth/register', form);
    return data;
  }, []);

  // Logout
  const logout = useCallback(() => {
    applyToken(null);
    setUser(null);
  }, [applyToken]);

  // Exposed context value
  const value = useMemo(() => {
    let roles = [];
    if (user) {
      if (Array.isArray(user.roles)) roles = user.roles;
      else if (user.role) roles = [user.role];
    }
    // Normalize role strings: ensure uppercase, trim, and strip any ROLE_ prefix.
    const normalizedRoles = roles
      .filter((r) => r != null)
      .map((r) => {
        const s = r.toString().trim().toUpperCase();
        return s.startsWith('ROLE_') ? s.substring(5) : s;
      });
    return {
      user,
      roles: normalizedRoles,
      token,
      authReady,
      login,
      register,
      logout,
      refreshMe,
      // Optional: allow optimistic local updates if needed
      setUser, // expose carefully for local patching
    };
  }, [user, token, authReady, login, register, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
