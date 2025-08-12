import React, { createContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import api from '../api/axiosInstance';

// AuthContext stores the authenticated user, their roles, and exposes
// functions for logging in, registering, and logging out. It also
// handles loading the current user from the backend when a JWT is
// present in localStorage.
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // On mount, check for an existing token. If found, decode it
  // to obtain role information and fetch the current user. If
  // decoding or fetching fails, clear the token and reset state.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // roles may be stored under a custom claim depending on your backend
        const tokenRoles = decoded.roles || decoded.authorities || [];
        setRoles(Array.isArray(tokenRoles) ? tokenRoles : [tokenRoles]);
        fetchCurrentUser();
      } catch (err) {
        // If token is invalid or expired, remove it
        console.error('Token decode error', err);
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch the logged‑in user's profile from the backend. If the
  // request fails (for example due to an expired token), log out
  // locally. This keeps the frontend state in sync with the
  // server‑side authentication status.
  const fetchCurrentUser = async () => {
    try {
      const { data } = await api.get('/auth/me');

      setUser(data);
    } catch (error) {
      console.error('Failed to fetch current user', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Perform login by sending credentials to the backend. On success
  // store the returned JWT, decode it for roles, and fetch the user
  // profile. Throw an error to the caller if login fails.
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const token = response.data.token;
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    const tokenRoles = decoded.roles || decoded.authorities || [];
    setRoles(Array.isArray(tokenRoles) ? tokenRoles : [tokenRoles]);
    await fetchCurrentUser();
  };

  // Register a new user. The backend should return a user object
  // or a message. After registering, instruct the user to log in.
const register = async (userInfo) => {
  const response = await api.post('/auth/register', userInfo, {
    headers: {
      'Content-Type': 'application/json',
    },
    // 🚫 Do not add withCredentials unless you are using cookies/sessions
  });
  return response.data;
};


  // Remove the token and reset all state. This is invoked on
  // logout or when an error occurs that invalidates the session.
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRoles([]);
  };

  const value = {
    user,
    roles,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};